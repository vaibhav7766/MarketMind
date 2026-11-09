import asyncio
import os
import re
import subprocess
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict, Tuple
import bs4
import httpx

from app.models.news import NewsArticle
from app.services.stock_service import _resolve_ticker
from app.services.vector_db_service import store_articles

# Paths to PinchTab binary and wrapper script
PINCHTAB_BIN = "/home/vaibhav7766/Desktop/web-scraper/pinchtab"
RUN_SCRIPT = "/home/vaibhav7766/Tools/run_web_scraper.sh"

# ANSI Color Codes for terminal
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

KNOWN_PUBLISHERS = {
    "reuters.com": "Reuters",
    "bloomberg.com": "Bloomberg",
    "moneycontrol.com": "Moneycontrol",
    "economictimes.indiatimes.com": "Economic Times",
    "business-standard.com": "Business Standard",
    "financialexpress.com": "Financial Express",
    "livemint.com": "Mint",
    "cnbctv18.com": "CNBC TV18",
    "cnbc.com": "CNBC",
    "barchart.com": "Barchart",
    "simplywall.st": "Simply Wall St",
    "seekingalpha.com": "Seeking Alpha",
    "barrons.com": "Barron's",
    "wsj.com": "Wall Street Journal",
    "ft.com": "Financial Times",
    "marketwatch.com": "MarketWatch",
    "benzinga.com": "Benzinga",
    "fool.com": "Motley Fool",
    "investors.com": "Investor's Business Daily",
    "yahoo.com": "Yahoo Finance",
    "ndtv.com": "NDTV Profit",
    "zeebiz.com": "Zee Business",
    "univest.in": "Univest",
    "upstox.com": "Upstox",
    "equitypandit.com": "EquityPandit",
    "tradingview.com": "TradingView",
    "trefis.com": "Trefis",
    "pluang.com": "Pluang",
    "fastcompany.com": "Fast Company",
    "fortune.com": "Fortune"
}

def _get_google_news_locale(ticker: str) -> str:
    """Returns suitable Google News region parameters based on stock ticker."""
    t = ticker.upper()
    if t.endswith(".NS") or t.endswith(".BO") or t in [
        "ICICIBANK", "HDFCBANK", "RELIANCE", "TCS", "INFY", "SBIN", "ITC", 
        "BHARTIARTL", "KOTAKBANK", "LT", "AXISBANK", "MARUTI", "TATAMOTORS"
    ]:
        return "hl=en-IN&gl=IN&ceid=IN:en"
    return "hl=en-US&gl=US&ceid=US:en"

def resolve_publisher_name(url: str, fallback_source: str = "") -> str:
    """Resolves human-readable publisher brand from URL domain or fallback source string."""
    if fallback_source:
        f_clean = fallback_source.strip().rstrip(".com").rstrip(".in")
        f_lower = f_clean.lower()
        if (
            f_lower not in ["google news", "yahoo news", "yahoo finance", "news", "more"]
            and not f_lower.startswith("by ")
            and not f_lower.startswith("author:")
        ):
            for k, v in KNOWN_PUBLISHERS.items():
                if k.split(".")[0] in f_lower:
                    return v
            return f_clean.capitalize()

    try:
        netloc = urllib.parse.urlparse(url).netloc.lower()
        netloc = re.sub(r"^www\.", "", netloc)
        for k, v in KNOWN_PUBLISHERS.items():
            if k in netloc:
                return v
        parts = netloc.split(".")
        if len(parts) >= 2:
            name = parts[-2]
            if name in ["co", "com", "org", "net", "gov", "edu", "in", "uk"]:
                name = parts[-3] if len(parts) >= 3 else name
            return name.capitalize()
    except Exception:
        pass
        
    return fallback_source if not fallback_source.lower().startswith("by ") else "Financial News"

async def _run_pinchtab(*args: str, timeout: float = 30.0) -> str:
    """Executes the PinchTab CLI binary asynchronously."""
    proc = await asyncio.create_subprocess_exec(
        PINCHTAB_BIN, *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    out_str = stdout.decode("utf-8", errors="ignore").strip()
    err_str = stderr.decode("utf-8", errors="ignore").strip()
    if proc.returncode != 0:
        raise RuntimeError(err_str or out_str or f"PinchTab exited with code {proc.returncode}")
    return out_str

async def _ensure_pinchtab_server() -> None:
    """Ensures the PinchTab server and background watchdog are running if PinchTab exists."""
    if not os.path.isfile(PINCHTAB_BIN):
        return

    try:
        health_out = await _run_pinchtab("health", timeout=5.0)
        if "ok" in health_out.lower():
            return
    except Exception:
        pass

    if os.path.isfile(RUN_SCRIPT):
        print(f"{YELLOW}Starting PinchTab server...{RESET}")
        subprocess.run([RUN_SCRIPT], capture_output=True)

async def _scrape_google_news(clean_name: str, ticker: str) -> List[Tuple[str, str, str, str]]:
    """Scrapes Google News search results."""
    if not os.path.isfile(PINCHTAB_BIN):
        return []

    locale_param = _get_google_news_locale(ticker)
    query = f"{clean_name} stock when:30d"
    search_url = f"https://news.google.com/search?q={urllib.parse.quote(query)}&{locale_param}"
    
    try:
        await _run_pinchtab("nav", search_url, timeout=25.0)
        html_content = await _run_pinchtab("html", timeout=15.0)
        text_content = await _run_pinchtab("text", timeout=15.0)
    except asyncio.TimeoutError:
        print(f"{RED}[FETCH FAILURE 504] Google News navigation timed out for {ticker}{RESET}")
        return []
    except Exception as e:
        print(f"{RED}[FETCH FAILURE 500] Google News navigation failed for {ticker}: {e}{RESET}")
        return []

    soup = bs4.BeautifulSoup(html_content, "html.parser")
    link_map: Dict[str, str] = {}
    
    for a in soup.find_all("a"):
        href = a.get("href", "")
        title = a.get_text(strip=True) or a.get("aria-label", "").strip()
        
        if ("./read/" in href or "./articles/" in href or "/read/" in href or "/articles/" in href) and title and len(title) > 10:
            if title.startswith("Sign in") or title.startswith("Google") or "Privacy" in title or "Terms" in title:
                continue
                
            if href.startswith("./"):
                href = "https://news.google.com" + href[1:]
            elif href.startswith("/"):
                href = "https://news.google.com" + href
                
            if title not in link_map:
                link_map[title] = href

    text_lines = [line.strip() for line in text_content.splitlines() if line.strip()]
    date_regex = re.compile(
        r'\b(\d+\s*(?:sec|min|minute|hour|hr|day|week|month)s?\s*ago|Yesterday|Today|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\b',
        re.IGNORECASE
    )

    results = []
    for title, href in link_map.items():
        source_name = ""
        published_at = ""
        
        for i, line in enumerate(text_lines):
            if title[:15] in line or line[:15] in title:
                if i >= 2 and text_lines[i-1] == "More":
                    source_name = text_lines[i-2]
                elif i >= 1 and text_lines[i-1] != "More":
                    source_name = text_lines[i-1]
                
                for delta in range(1, 4):
                    if i + delta < len(text_lines):
                        match = date_regex.search(text_lines[i+delta])
                        if match:
                            published_at = match.group(0)
                            break
                break

        results.append((title, href, source_name, published_at))
    return results

async def _fetch_google_news_rss(clean_name: str, ticker: str) -> List[Tuple[str, str, str, str]]:
    """Fallback RSS fetcher for Google News when headless browser is blocked or timed out."""
    locale_params = _get_google_news_locale(ticker)
    query = f"{clean_name} stock when:30d"
    rss_url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&{locale_params}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(rss_url)
            if resp.status_code != 200:
                return []
            
        root = ET.fromstring(resp.content)
        items = root.findall(".//item")
        results = []
        for item in items:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()
            source_elem = item.find("source")
            source_name = (source_elem.text if source_elem is not None and source_elem.text else "").strip()
            source_url = (source_elem.get("url", "") if source_elem is not None else "").strip()
            
            # Clean title by removing trailing ' - Publisher'
            if source_name and title.endswith(f" - {source_name}"):
                title = title[:-len(f" - {source_name}")].strip()
            elif " - " in title:
                parts = title.rsplit(" - ", 1)
                title = parts[0].strip()
                if not source_name:
                    source_name = parts[1].strip()
            
            effective_source = source_url or source_name
            if title and link:
                results.append((title, link, effective_source, pub_date))
        return results
    except Exception as e:
        print(f"{YELLOW}[RSS FALLBACK FAILED] {ticker}: {e}{RESET}")
        return []

async def fetch_news(ticker: str, company_name: str, page_size: int = 30) -> List[NewsArticle]:
    """
    Multi-source stock news engine using PinchTab.
    Fetches real-time articles, resolves true publisher domains, and logs fetch status to terminal.
    """
    await _ensure_pinchtab_server()

    clean_name = re.sub(
        r'(?i)\b(India Limited|Limited|Ltd\.?|Inc\.?|Corp\.?|Corporation|Company|Co\.?|Holdings|Plc\.?|Group)\b',
        '', company_name
    )
    clean_name = re.sub(r'[,. ]+$', '', clean_name).strip()
    if not clean_name:
        clean_name = ticker

    print(f"\n{BOLD}{CYAN}=== [PinchTab Multi-Source News Scraper] Querying {ticker} ({clean_name}) ==={RESET}")

    raw_items = []
    if os.path.isfile(PINCHTAB_BIN):
        raw_items = await _scrape_google_news(clean_name, ticker)

    if not raw_items:
        raw_items = await _fetch_google_news_rss(clean_name, ticker)
        if raw_items:
            print(f"{GREEN}[RSS SUCCESS 200] Retrieved {len(raw_items)} articles via Google News feed.{RESET}")
    
    articles: List[NewsArticle] = []
    seen_titles = set()
    publisher_counts: Dict[str, int] = {}

    for title, href, raw_source, published_at in raw_items:
        if title in seen_titles:
            print(f"{YELLOW}[FETCH DISCARDED 304] Duplicate title ignored: '{title[:50]}...'{RESET}")
            continue
        seen_titles.add(title)

        resolved_source = resolve_publisher_name(href, raw_source)
        publisher_counts[resolved_source] = publisher_counts.get(resolved_source, 0) + 1

        print(f"{GREEN}[FETCH SUCCESS 200]{RESET} {href[:65]}... | {BOLD}Publisher:{RESET} {resolved_source} | {published_at or 'Recent'}")

        articles.append(
            NewsArticle(
                title=title,
                source=resolved_source,
                published_at=published_at,
                url=href,
                description=f"Report from {resolved_source} regarding {clean_name} stock.",
                content=f"{title}. Published by {resolved_source} ({published_at})."
            )
        )

        if len(articles) >= page_size:
            break

    # Terminal summary of fetch results and publisher breakdown
    print(f"\n{BOLD}{GREEN}✓ [FETCH SUMMARY] Successfully fetched {len(articles)} articles for {ticker}:{RESET}")
    for pub, count in publisher_counts.items():
        print(f"  • {BOLD}{pub}{RESET}: {count} article(s)")
    print(f"{CYAN}======================================================================{RESET}\n")

    if articles:
        asyncio.create_task(asyncio.to_thread(store_articles, ticker, articles))

    return articles

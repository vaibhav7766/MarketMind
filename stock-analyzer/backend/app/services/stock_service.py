import httpx
import yfinance as yf
from typing import List
from datetime import datetime, timedelta
from app.models.stock import OHLCVPoint, StockInfo
from app.config import settings
import time

def _alpha_vantage_request(url: str, max_retries: int = 4) -> dict:
    for attempt in range(max_retries):
        response = httpx.get(url, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        
        # Check for rate limit responses
        if "Information" in data and "1 request per second" in data["Information"]:
            if attempt < max_retries - 1:
                print(f"Alpha Vantage rate limit hit, sleeping 2s (Attempt {attempt+1}/{max_retries})...")
                time.sleep(2.0)
                continue
        if "Note" in data and "call frequency" in data["Note"]:
            if attempt < max_retries - 1:
                print(f"Alpha Vantage rate limit hit, sleeping 2s (Attempt {attempt+1}/{max_retries})...")
                time.sleep(2.0)
                continue
                
        return data
    return {}

def _resolve_ticker(ticker: str) -> str:
    """
    Try to resolve the ticker, appending .NS or .BO if necessary.
    Returns the resolved ticker string.
    """
    if "." in ticker:
        return ticker
        
    suffixes = ["", ".NS", ".BO"]
    for suffix in suffixes:
        test_ticker = f"{ticker}{suffix}"
        info = yf.Ticker(test_ticker).info
        # If quoteType is valid and not 'NONE', or we have actual price data, it's a valid ticker
        if info.get("quoteType", "NONE") != "NONE" or "regularMarketPrice" in info or "previousClose" in info:
            return test_ticker
            
    return ticker

def _fetch_alpha_vantage_ts(ticker: str, period: str) -> List[OHLCVPoint]:
    if not settings.alpha_vantage_key:
        raise ValueError("Alpha Vantage key is not configured")
        
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}&outputsize=full&apikey={settings.alpha_vantage_key}"
    data = _alpha_vantage_request(url)
    
    if "Time Series (Daily)" not in data:
        print(f"Alpha Vantage error: {data}")
        return []
        
    ts_data = data["Time Series (Daily)"]
    points = []
    
    now = datetime.now()
    if period == "1mo": cutoff = now - timedelta(days=30)
    elif period == "3mo": cutoff = now - timedelta(days=90)
    elif period == "6mo": cutoff = now - timedelta(days=180)
    elif period == "1y": cutoff = now - timedelta(days=365)
    elif period == "5y": cutoff = now - timedelta(days=365 * 5)
    else: cutoff = now - timedelta(days=180)
    
    for date_str, values in ts_data.items():
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        if date_obj < cutoff:
            continue
            
        points.append(
            OHLCVPoint(
                date=date_obj.isoformat(),
                open=float(values["1. open"]),
                high=float(values["2. high"]),
                low=float(values["3. low"]),
                close=float(values["4. close"]),
                volume=int(values["5. volume"])
            )
        )
        
    points.sort(key=lambda x: x.date)
    return points

def _fetch_alpha_vantage_info(ticker: str) -> StockInfo:
    if not settings.alpha_vantage_key:
        raise ValueError("Alpha Vantage key is not configured")
        
    url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker}&apikey={settings.alpha_vantage_key}"
    data = _alpha_vantage_request(url)
    
    if not data or "Symbol" not in data:
        return StockInfo(ticker=ticker.upper(), name=ticker.upper())
        
    return StockInfo(
        ticker=ticker.upper(),
        name=data.get("Name", ticker.upper()),
        sector=data.get("Sector"),
        market_cap=float(data["MarketCapitalization"]) if data.get("MarketCapitalization", "None") not in ["None", None, ""] else None,
        pe_ratio=float(data["PERatio"]) if data.get("PERatio", "None") not in ["None", None, ""] else None,
        fifty_two_week_high=float(data["52WeekHigh"]) if data.get("52WeekHigh", "None") not in ["None", None, ""] else None,
        fifty_two_week_low=float(data["52WeekLow"]) if data.get("52WeekLow", "None") not in ["None", None, ""] else None,
    )

def get_time_series(ticker: str, period: str = "6mo", interval: str = "1d", provider: str = "yfinance") -> List[OHLCVPoint]:
    """Fetch OHLCV time series for a ticker using yfinance or alpha_vantage."""
    if provider == "alpha_vantage":
        return _fetch_alpha_vantage_ts(ticker, period)

    resolved_ticker = _resolve_ticker(ticker)
    df = yf.download(resolved_ticker, period=period, interval=interval, progress=False)

    if isinstance(df.columns, __import__("pandas").MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df.reset_index(inplace=True)
    return [
        OHLCVPoint(
            date=row["Date"].isoformat(),
            open=round(float(row["Open"]), 4),
            high=round(float(row["High"]), 4),
            low=round(float(row["Low"]), 4),
            close=round(float(row["Close"]), 4),
            volume=int(row["Volume"]),
        )
        for _, row in df.iterrows()
    ]

def get_stock_info(ticker: str, provider: str = "yfinance") -> StockInfo:
    if provider == "alpha_vantage":
        return _fetch_alpha_vantage_info(ticker)
        
    resolved_ticker = _resolve_ticker(ticker)
    t = yf.Ticker(resolved_ticker)
    info = t.info

    curr_price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
    if curr_price is not None:
        try:
            curr_price = round(float(curr_price), 2)
        except (ValueError, TypeError):
            curr_price = None

    # Extract dividend yield
    div_yield = info.get("dividendYield")
    if div_yield is None:
        div_yield = info.get("trailingAnnualDividendYield")

    div_rate = info.get("dividendRate") or info.get("trailingAnnualDividendRate")
    if div_rate and curr_price and curr_price > 0:
        try:
            # Most accurate: annual cash dividend per share / current share price * 100
            div_val = (float(div_rate) / float(curr_price)) * 100.0
            div_yield = round(div_val, 2)
        except (ValueError, ZeroDivisionError, TypeError):
            pass
    elif div_yield is not None:
        try:
            div_val = float(div_yield)
            # If formatted as small decimal fraction (e.g. 0.018 for 1.8%), convert to percent.
            # But if >= 0.10 (e.g. 0.63 for 0.63%), it is already expressed as percentage.
            if div_val < 0.10:
                div_val = div_val * 100.0
            div_yield = round(div_val, 2)
        except (ValueError, TypeError):
            div_yield = None

    return StockInfo(
        ticker=resolved_ticker.upper(),
        name=info.get("longName") or info.get("shortName") or resolved_ticker,
        sector=info.get("sector"),
        market_cap=info.get("marketCap"),
        pe_ratio=info.get("trailingPE") or info.get("forwardPE"),
        fifty_two_week_high=info.get("fiftyTwoWeekHigh"),
        fifty_two_week_low=info.get("fiftyTwoWeekLow"),
        dividend_yield=div_yield,
        currency=info.get("currency"),
        current_price=curr_price,
    )

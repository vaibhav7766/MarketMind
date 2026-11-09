# Stock Analyzer — Implementation Plan

## Overview

A full-stack stock analysis application that combines time-series price data with large-context news analysis. The backend exposes a FastAPI REST API; the frontend is a Next.js + TypeScript application. Claude is used as the AI layer for summarizing and reasoning over news.

---

## Project Structure

```
stock-analyzer/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── routers/
│   │   │   ├── stocks.py
│   │   │   └── news.py
│   │   ├── services/
│   │   │   ├── stock_service.py
│   │   │   ├── news_service.py
│   │   │   └── analysis_service.py
│   │   ├── models/
│   │   │   ├── stock.py
│   │   │   └── news.py
│   │   └── utils/
│   │       └── date_utils.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── stocks/
    │   │       └── [ticker]/
    │   │           └── page.tsx
    │   ├── components/
    │   │   ├── StockSearch.tsx
    │   │   ├── PriceChart.tsx
    │   │   ├── NewsPanel.tsx
    │   │   ├── AnalysisSummary.tsx
    │   │   └── ui/
    │   ├── lib/
    │   │   ├── api.ts
    │   │   └── types.ts
    │   └── hooks/
    │       ├── useStockData.ts
    │       └── useNews.ts
    ├── public/
    ├── package.json
    ├── tsconfig.json
    └── .env.local.example
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI (Python) |
| Stock time-series | yfinance (free) or Alpha Vantage / Polygon.io |
| News API | NewsAPI.org or Bing News Search API |
| AI analysis | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Frontend framework | Next.js 14 (App Router) + TypeScript |
| Charting | Recharts or TradingView Lightweight Charts |
| Styling | Tailwind CSS |
| State / fetching | TanStack Query (React Query) |
| HTTP client | Axios |

---

## Backend

### 1. Setup & Dependencies

**`requirements.txt`**
```
fastapi
uvicorn[standard]
httpx
yfinance
pandas
anthropic
python-dotenv
pydantic
pydantic-settings
```

**`.env.example`**
```
NEWS_API_KEY=your_newsapi_key
ANTHROPIC_API_KEY=your_anthropic_key
STOCK_DATA_PROVIDER=yfinance          # or alphavantage
ALPHA_VANTAGE_KEY=optional
ALLOWED_ORIGINS=http://localhost:3000
```

---

### 2. `app/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    news_api_key: str
    anthropic_api_key: str
    stock_data_provider: str = "yfinance"
    alpha_vantage_key: str = ""
    allowed_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

---

### 3. `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stocks, news
from app.config import settings

app = FastAPI(title="Stock Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
```

---

### 4. Stock Service — `app/services/stock_service.py`

Responsibilities:
- Fetch OHLCV time-series for a given ticker and period
- Return structured data ready for charting

```python
import yfinance as yf
import pandas as pd
from app.models.stock import OHLCVPoint, StockInfo

def get_time_series(ticker: str, period: str = "6mo", interval: str = "1d") -> list[OHLCVPoint]:
    """
    period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, ytd, max
    interval: 1m, 5m, 15m, 1h, 1d, 1wk, 1mo
    """
    df = yf.download(ticker, period=period, interval=interval, progress=False)
    df.reset_index(inplace=True)
    return [
        OHLCVPoint(
            date=row["Date"].isoformat(),
            open=round(row["Open"], 4),
            high=round(row["High"], 4),
            low=round(row["Low"], 4),
            close=round(row["Close"], 4),
            volume=int(row["Volume"]),
        )
        for _, row in df.iterrows()
    ]

def get_stock_info(ticker: str) -> StockInfo:
    t = yf.Ticker(ticker)
    info = t.info
    return StockInfo(
        ticker=ticker.upper(),
        name=info.get("longName", ticker),
        sector=info.get("sector"),
        market_cap=info.get("marketCap"),
        pe_ratio=info.get("trailingPE"),
        fifty_two_week_high=info.get("fiftyTwoWeekHigh"),
        fifty_two_week_low=info.get("fiftyTwoWeekLow"),
    )
```

---

### 5. News Service — `app/services/news_service.py`

Responsibilities:
- Fetch recent news articles for a ticker / company name
- Return full article content (not just headlines) to support large-context analysis

```python
import httpx
from app.config import settings
from app.models.news import NewsArticle

NEWSAPI_URL = "https://newsapi.org/v2/everything"

async def fetch_news(ticker: str, company_name: str, page_size: int = 30) -> list[NewsArticle]:
    query = f"{ticker} OR \"{company_name}\""
    async with httpx.AsyncClient() as client:
        resp = await client.get(NEWSAPI_URL, params={
            "q": query,
            "sortBy": "publishedAt",
            "language": "en",
            "pageSize": page_size,
            "apiKey": settings.news_api_key,
        })
        resp.raise_for_status()
        data = resp.json()

    return [
        NewsArticle(
            title=a["title"],
            source=a["source"]["name"],
            published_at=a["publishedAt"],
            url=a["url"],
            description=a.get("description") or "",
            content=a.get("content") or "",   # truncated by NewsAPI free tier — upgrade for full text
        )
        for a in data.get("articles", [])
        if a.get("title")
    ]
```

> **Note on full content:** NewsAPI free tier truncates article body to ~200 chars. For large-context news analysis, either upgrade to a paid NewsAPI plan, use a scraping layer (`newspaper3k` / `trafilatura`) to pull full article text, or switch to Bing News Search API + scraper.

---

### 6. Analysis Service — `app/services/analysis_service.py`

Responsibilities:
- Pack all article texts into a single large-context Claude prompt
- Return structured sentiment + key themes + analyst-style summary

```python
import anthropic
from app.config import settings
from app.models.news import NewsArticle

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

def build_news_context(articles: list[NewsArticle]) -> str:
    parts = []
    for i, a in enumerate(articles, 1):
        body = a.content or a.description or "(no body)"
        parts.append(
            f"[Article {i}]\n"
            f"Source: {a.source} | Published: {a.published_at}\n"
            f"Title: {a.title}\n"
            f"Body: {body}\n"
        )
    return "\n---\n".join(parts)

def analyze_news(ticker: str, company_name: str, articles: list[NewsArticle]) -> dict:
    news_context = build_news_context(articles)

    system = (
        "You are a senior equity research analyst. "
        "You read large volumes of news and produce concise, structured analysis. "
        "Respond ONLY with valid JSON — no preamble, no markdown fences."
    )

    prompt = f"""
You are analyzing {company_name} (ticker: {ticker}).

Below are {len(articles)} recent news articles. Read all of them carefully.

{news_context}

Return a JSON object with the following fields:
{{
  "overall_sentiment": "bullish" | "bearish" | "neutral",
  "sentiment_score": float between -1.0 (very bearish) and 1.0 (very bullish),
  "key_themes": [list of 3-6 concise theme strings],
  "risks": [list of top 3 risks mentioned],
  "catalysts": [list of top 3 positive catalysts mentioned],
  "summary": "3-5 sentence analyst-style narrative summary of the news landscape",
  "notable_articles": [
    {{"title": "...", "reason": "why this article is significant"}}
  ]
}}
"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )

    import json
    raw = message.content[0].text
    return json.loads(raw)
```

---

### 7. Routers

**`app/routers/stocks.py`**
```python
from fastapi import APIRouter, Query
from app.services import stock_service

router = APIRouter()

@router.get("/{ticker}/timeseries")
def get_timeseries(
    ticker: str,
    period: str = Query("6mo"),
    interval: str = Query("1d"),
):
    return {
        "ticker": ticker.upper(),
        "period": period,
        "interval": interval,
        "data": stock_service.get_time_series(ticker, period, interval),
    }

@router.get("/{ticker}/info")
def get_info(ticker: str):
    return stock_service.get_stock_info(ticker)
```

**`app/routers/news.py`**
```python
from fastapi import APIRouter, Query
from app.services import news_service, analysis_service, stock_service

router = APIRouter()

@router.get("/{ticker}")
async def get_news(ticker: str, page_size: int = Query(30, le=100)):
    info = stock_service.get_stock_info(ticker)
    articles = await news_service.fetch_news(ticker, info.name, page_size)
    analysis = analysis_service.analyze_news(ticker, info.name, articles)
    return {
        "ticker": ticker.upper(),
        "company": info.name,
        "article_count": len(articles),
        "analysis": analysis,
        "articles": [a.dict() for a in articles],
    }
```

---

### 8. Pydantic Models

**`app/models/stock.py`**
```python
from pydantic import BaseModel
from typing import Optional

class OHLCVPoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

class StockInfo(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
```

**`app/models/news.py`**
```python
from pydantic import BaseModel

class NewsArticle(BaseModel):
    title: str
    source: str
    published_at: str
    url: str
    description: str
    content: str
```

---

### 9. Running the Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in keys
uvicorn app.main:app --reload --port 8000
```

API docs auto-available at `http://localhost:8000/docs`

---

## Frontend

### 1. Setup

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --eslint
npm install axios @tanstack/react-query recharts lucide-react
```

**`.env.local.example`**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

---

### 2. `src/lib/types.ts`

```typescript
export interface OHLCVPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockInfo {
  ticker: string;
  name: string;
  sector?: string;
  market_cap?: number;
  pe_ratio?: number;
  fifty_two_week_high?: number;
  fifty_two_week_low?: number;
}

export interface NewsArticle {
  title: string;
  source: string;
  published_at: string;
  url: string;
  description: string;
  content: string;
}

export interface NewsAnalysis {
  overall_sentiment: "bullish" | "bearish" | "neutral";
  sentiment_score: number;
  key_themes: string[];
  risks: string[];
  catalysts: string[];
  summary: string;
  notable_articles: { title: string; reason: string }[];
}

export interface NewsResponse {
  ticker: string;
  company: string;
  article_count: number;
  analysis: NewsAnalysis;
  articles: NewsArticle[];
}

export interface TimeSeriesResponse {
  ticker: string;
  period: string;
  interval: string;
  data: OHLCVPoint[];
}
```

---

### 3. `src/lib/api.ts`

```typescript
import axios from "axios";
import type { TimeSeriesResponse, NewsResponse, StockInfo } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

export const fetchTimeSeries = (
  ticker: string,
  period = "6mo",
  interval = "1d"
): Promise<TimeSeriesResponse> =>
  api
    .get(`/stocks/${ticker}/timeseries`, { params: { period, interval } })
    .then((r) => r.data);

export const fetchStockInfo = (ticker: string): Promise<StockInfo> =>
  api.get(`/stocks/${ticker}/info`).then((r) => r.data);

export const fetchNews = (
  ticker: string,
  pageSize = 30
): Promise<NewsResponse> =>
  api.get(`/news/${ticker}`, { params: { page_size: pageSize } }).then((r) => r.data);
```

---

### 4. `src/hooks/useStockData.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchTimeSeries, fetchStockInfo } from "@/lib/api";

export function useStockData(ticker: string, period = "6mo", interval = "1d") {
  const info = useQuery({
    queryKey: ["stock-info", ticker],
    queryFn: () => fetchStockInfo(ticker),
    enabled: !!ticker,
  });

  const timeSeries = useQuery({
    queryKey: ["timeseries", ticker, period, interval],
    queryFn: () => fetchTimeSeries(ticker, period, interval),
    enabled: !!ticker,
  });

  return { info, timeSeries };
}
```

---

### 5. `src/hooks/useNews.ts`

```typescript
import { useQuery } from "@tanstack/react-query";
import { fetchNews } from "@/lib/api";

export function useNews(ticker: string, pageSize = 30) {
  return useQuery({
    queryKey: ["news", ticker, pageSize],
    queryFn: () => fetchNews(ticker, pageSize),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

### 6. Key Components

**`src/components/PriceChart.tsx`** — renders the OHLCV time-series using Recharts `ComposedChart` with a candlestick-style line + volume bar overlay.

**`src/components/AnalysisSummary.tsx`** — displays:
- Sentiment badge (bullish / bearish / neutral) with color coding
- Sentiment score gauge
- Key themes as pill tags
- Risks (red) and catalysts (green) as two-column lists
- 3–5 sentence narrative summary from Claude

**`src/components/NewsPanel.tsx`** — scrollable list of articles with title, source, date, and link. Highlights notable articles flagged by the AI analysis.

**`src/components/StockSearch.tsx`** — controlled input that navigates to `/stocks/[ticker]` on submit.

---

### 7. `src/app/stocks/[ticker]/page.tsx`

```tsx
"use client";
import { useParams } from "next/navigation";
import { useStockData } from "@/hooks/useStockData";
import { useNews } from "@/hooks/useNews";
import PriceChart from "@/components/PriceChart";
import AnalysisSummary from "@/components/AnalysisSummary";
import NewsPanel from "@/components/NewsPanel";
import { useState } from "react";

const PERIODS = ["1mo", "3mo", "6mo", "1y", "5y"];

export default function StockPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const [period, setPeriod] = useState("6mo");
  const { info, timeSeries } = useStockData(ticker, period);
  const news = useNews(ticker, 30);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{ticker.toUpperCase()}</h1>
        {info.data && (
          <p className="text-gray-500">{info.data.name} · {info.data.sector}</p>
        )}
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              period === p
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      {timeSeries.data && <PriceChart data={timeSeries.data.data} />}

      {/* AI Analysis + News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {news.data && (
          <>
            <AnalysisSummary analysis={news.data.analysis} />
            <NewsPanel
              articles={news.data.articles}
              notableArticles={news.data.analysis.notable_articles}
            />
          </>
        )}
        {news.isLoading && (
          <p className="col-span-2 text-center text-gray-400">
            Fetching news and running AI analysis…
          </p>
        )}
      </div>
    </main>
  );
}
```

---

### 8. Running the Frontend

```bash
cd frontend
cp .env.local.example .env.local   # set API URL
npm run dev
```

App available at `http://localhost:3000`

---

## API Endpoints Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/stocks/{ticker}/info` | Company metadata |
| GET | `/api/stocks/{ticker}/timeseries?period=6mo&interval=1d` | OHLCV time-series |
| GET | `/api/news/{ticker}?page_size=30` | News articles + AI analysis |

---

## Large-Context News Strategy

The app is designed to pass **all** article texts in a single Claude prompt. To maximize article quality and volume:

1. **Upgrade NewsAPI** to a paid plan for full article body text (not truncated).
2. **Alternatively**, use `trafilatura` or `newspaper3k` to scrape full article content from URLs returned by the free tier.
3. **Claude model**: `claude-sonnet-4-20250514` supports a 200K token context window — sufficient for dozens of full-length articles in a single call.
4. **Chunking fallback**: If article volume exceeds ~150K tokens, split into batches and merge the JSON analysis results in a second "synthesis" Claude call.

---

## Environment Variables Summary

| Variable | Where | Purpose |
|---|---|---|
| `NEWS_API_KEY` | backend `.env` | NewsAPI.org API key |
| `ANTHROPIC_API_KEY` | backend `.env` | Claude API key |
| `STOCK_DATA_PROVIDER` | backend `.env` | `yfinance` or `alphavantage` |
| `ALLOWED_ORIGINS` | backend `.env` | CORS whitelist |
| `NEXT_PUBLIC_API_BASE_URL` | frontend `.env.local` | Backend base URL |

---

## Development Checklist

- [ ] Backend: install deps, configure `.env`, run `uvicorn`
- [ ] Verify `/api/stocks/AAPL/timeseries` returns OHLCV data
- [ ] Verify `/api/news/AAPL` returns articles + analysis JSON
- [ ] Frontend: install deps, configure `.env.local`, run `npm run dev`
- [ ] Implement `PriceChart` with Recharts
- [ ] Implement `AnalysisSummary` sentiment display
- [ ] Implement `NewsPanel` with article list
- [ ] Add loading skeletons and error boundaries
- [ ] Add full-text scraping layer for large-context news (optional but recommended)
- [ ] Deploy backend (Railway / Render / EC2) and frontend (Vercel)

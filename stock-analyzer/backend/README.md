# Stock Analyzer Backend

This is the FastAPI backend for the Antigravity Stock Analyzer. It provides real-time stock data (via yfinance), aggregates news (via NewsData.io), and uses Google Gemini to generate AI-driven market analysis.

## Setup

1. **Install dependencies:**
   ```bash
   uv sync
   ```
2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in your API keys:
   - `NEWSDATA_API_KEY`: Get from [NewsData.io](https://newsdata.io/)
   - `GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/)
3. **Run the server:**
   ```bash
   uv run uvicorn app.main:app --reload --port 8000
   ```
   The interactive API docs will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints & Sample Responses

Here are the sample JSON responses you can expect when testing via Postman or the Swagger UI (`/docs`).

### 1. Get Stock Info
**Endpoint:** `GET /api/stocks/{ticker}/info`  
**Example:** `GET /api/stocks/AAPL/info`

**Sample Response:**
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "market_cap": 2850000000000,
  "pe_ratio": 29.5,
  "fifty_two_week_high": 199.62,
  "fifty_two_week_low": 164.08
}
```

### 2. Get Stock Time-Series Data
**Endpoint:** `GET /api/stocks/{ticker}/timeseries?period=6mo&interval=1d`  
**Example:** `GET /api/stocks/AAPL/timeseries?period=1mo&interval=1d`

**Sample Response:**
```json
{
  "ticker": "AAPL",
  "period": "1mo",
  "interval": "1d",
  "data": [
    {
      "date": "2024-04-10T00:00:00-04:00",
      "open": 168.80,
      "high": 169.09,
      "low": 167.11,
      "close": 167.78,
      "volume": 49709300
    },
    {
      "date": "2024-04-11T00:00:00-04:00",
      "open": 168.34,
      "high": 175.46,
      "low": 168.16,
      "close": 175.04,
      "volume": 91070300
    }
  ]
}
```

### 3. Get News & AI Analysis
**Endpoint:** `GET /api/news/{ticker}`  
**Example:** `GET /api/news/AAPL`

*(Note: This endpoint fetches real-time news and passes it to Google Gemini for processing. It may take a few seconds to return).*

**Sample Response:**
```json
{
  "ticker": "AAPL",
  "company": "Apple Inc.",
  "article_count": 12,
  "analysis": {
    "overall_sentiment": "bullish",
    "sentiment_score": 0.75,
    "key_themes": [
      "AI Strategy Unveiling",
      "New iPad Pro Launch",
      "Supply Chain Resilience"
    ],
    "risks": [
      "Regulatory scrutiny in the EU",
      "Declining iPhone sales in China",
      "Delayed AI feature rollout"
    ],
    "catalysts": [
      "Upcoming WWDC announcements",
      "Integration of Google Gemini/OpenAI",
      "Strong Services revenue growth"
    ],
    "summary": "Apple's narrative is shifting rapidly as the company prepares to unveil its highly anticipated AI strategy at the upcoming WWDC. Despite ongoing concerns regarding iPhone sales weakness in the Chinese market and regulatory headwinds in Europe, market sentiment is increasingly bullish. Investors are focusing on the imminent launch of new, OLED-equipped iPad Pros and the potential for a massive 'supercycle' driven by generative AI integration across the Apple ecosystem.",
    "notable_articles": [
      {
        "title": "Apple to revamp iPad lineup with new Pro and Air models",
        "reason": "Highlights a major upcoming product cycle catalyst."
      },
      {
        "title": "EU opens new antitrust probe into Apple's App Store",
        "reason": "Details the most significant near-term regulatory risk."
      }
    ]
  },
  "articles": [
    {
      "title": "Apple to revamp iPad lineup with new Pro and Air models",
      "source": "TechCrunch",
      "published_at": "2024-04-20 14:30:00",
      "url": "https://example.com/apple-ipad-event",
      "description": "Apple is preparing for a major hardware event...",
      "content": "Full article content goes here..."
    },
    {
      "title": "EU opens new antitrust probe into Apple's App Store",
      "source": "Reuters",
      "published_at": "2024-04-19 09:15:00",
      "url": "https://example.com/eu-apple-probe",
      "description": "European regulators are looking closer at...",
      "content": "Full article content goes here..."
    }
  ]
}
```

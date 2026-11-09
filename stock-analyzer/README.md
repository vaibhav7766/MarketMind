# Stock Analyzer

A full‑stack web application that **fetches stock price data**, **aggregates recent news**, and **leverages AI** (Anthropic Claude or Google Gemini) to provide concise analyst‑style insights.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Data fetching | `yfinance` (or Alpha Vantage) |
| News | NewsAPI.org (or Bing) |
| AI analysis | Anthropic Claude (`claude‑sonnet‑4‑20250514`) **with optional Google Gemini fallback** |
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS, Recharts, Lucide‑React |
| State & fetching | TanStack Query |
| HTTP client | Axios |

---

## 🛠️ Project Structure

```
stock-analyzer/
├── backend/                 # FastAPI server
│   ├── app/                # Application code
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── main.py
│   │   ├── models/        # Pydantic models (stock, news)
│   │   ├── routers/       # API routers (stocks, news)
│   │   └── services/      # Business logic
│   ├── requirements.txt
│   ├── pyproject.toml      # UV configuration
│   └── .env.example
├── frontend/                # Next.js client
│   ├── src/
│   │   ├── app/           # Pages (stock ticker page)
│   │   ├── components/    # UI components (PriceChart, AnalysisSummary, NewsPanel, StockSearch)
│   │   ├── hooks/         # React Query hooks
│   │   └── lib/           # Types & API wrapper
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local.example
└── README.md               # **You are here**
```

---

## ⚙️ Setup Guide

### 1️⃣ Clone the repository
```bash
git clone <repo‑url>
cd stock-analyzer
```

### 2️⃣ Backend Setup (Python)
```bash
# Navigate to backend
cd backend

# Create a virtual environment (recommended) – uv will handle it automatically
uv venv .venv   # will create .venv

# Install dependencies via uv (fast!)
uv pip install -r requirements.txt
# or use the pyproject.toml configuration
uv sync

# Copy the example env file and fill in your keys
cp .env.example .env
# Edit .env:
#   NEWS_API_KEY=your_newsapi_key
#   ANTHROPIC_API_KEY=your_anthropic_key
#   GEMINI_API_KEY=your_gemini_key   # optional fallback
#   (other defaults are fine)

# Run the FastAPI server
uv run uvicorn app.main:app --reload --port 8000
```
The API docs are available at `http://localhost:8000/docs`.

### 3️⃣ Frontend Setup (Node.js)
```bash
# From the project root
cd frontend

# Install npm packages (Tailwind, Recharts, etc.)
npm install

# Copy the env example and set the backend URL
cp .env.local.example .env.local
# Edit .env.local if your backend runs on a different host/port
#   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Start the dev server
npm run dev
```
Open `http://localhost:3000` in your browser. You should see a clean search interface; type a ticker (e.g., `AAPL`) to view price charts, AI‑generated analysis, and recent news.

---

## 🌐 Production (Optional)
- **Backend:** Deploy to Railway, Render, Fly.io, or any VPS. Ensure the `.env` file is present and the port is open.
- **Frontend:** Deploy to Vercel, Netlify, or any static‑host that supports Next.js.
- Remember to set the same environment variables on the hosting platform.

---

## 📚 How It Works
1. **Stock Service** pulls OHLCV data from `yfinance` (or your chosen provider).
2. **News Service** fetches recent articles via NewsAPI; optional full‑text scraping can be added later.
3. **Analysis Service** concatenates all article bodies and sends a single prompt to Anthropic Claude (or Gemini if the Claude key is missing) to generate structured JSON containing sentiment, key themes, risks, catalysts, and a brief narrative.
4. The **frontend** uses React Query to call the API, renders a candlestick‑style chart (Recharts), displays the AI summary, and lists news articles.

---

## 🎨 Design Philosophy
- **Premium UI**: Tailwind CSS with smooth gradients, dark‑mode support, and subtle micro‑animations.
- **Responsiveness**: Mobile‑first layout, grid‑based for larger screens.
- **Performance**: API responses are cached (`staleTime` 5 min) and chart rendering is lightweight.

---

## 🛠️ Extending the Project
- **Add a full‑text scraper** (`newspaper3k` or `trafilatura`) to replace the truncated NewsAPI bodies.
- **Swap the AI model**: plug in a different Claude model or use Gemini directly by reading `settings.gemini_api_key` in `analysis_service.py`.
- **Charting Library**: replace Recharts with TradingView Lightweight Charts for more advanced interactions.
- **Authentication**: protect the API with JWT to restrict usage.

---

## ✅ Checklist (for developers)
- [ ] Backend: virtual env, install deps, configure `.env`, run FastAPI.
- [ ] Frontend: npm install, configure `.env.local`, run dev server.
- [ ] Verify endpoints (`/api/stocks/<ticker>/info`, `/api/news/<ticker>`).
- [ ] Test UI: price chart, AI analysis, news panel.
- [ ] Deploy (optional).

---

## 📜 License
MIT – feel free to fork, modify, and use commercially.

---

Happy coding! 🚀

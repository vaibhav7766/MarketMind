# 📈 Stonks — Unified Market Intelligence & AI Copilot Platform

> [!NOTE]
> **Modified Fork & Open Source Attribution Notice**  
> The web platform in this workspace contains a **modified fork** of [**OpenStock**](https://github.com/Open-Dev-Society/OpenStock), originally created by [**Open Dev Society**](https://github.com/Open-Dev-Society) and contributors, licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.  
> In compliance with the AGPL-3.0 copyleft requirements, this repository carries prominent notices documenting all architectural modifications, credits the original authors, and makes all modified source code openly available under the same license terms. Full details can be found in the [Credits & License section](#-open-source-credits-modified-fork-notice--license).

Welcome to the **Stonks** workspace, a hybrid architecture that integrates **OpenStock** (a modern, open-source market tracking dashboard) with **Stock Assistant** ("The Brain" — an autonomous quantitative scoring and AI financial intelligence microservice).

---

## 🏛️ Architecture Overview (Model A: Microservice Bridge)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OpenStock Web Platform                          │
│          Next.js 15 (Turbopack) • React 19 • Tailwind CSS v4           │
│           Better Auth • MongoDB • TradingView • Inngest Cron           │
│                           (Port 3000)                                  │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
            US Live Quotes                    Global Data / AI
                   │                                 │
                   ▼                                 ▼
           ┌───────────────┐        ┌────────────────────────────────────┐
           │  Finnhub API  │        │       Stock Assistant Brain        │
           │ (WebSocket /  │        │        FastAPI (Port 8000)         │
           │   US Free)    │        ├────────────────────────────────────┤
           └───────────────┘        │ • yfinance Global Exchange Engine  │
                                    │ • Hybrid Conviction Scoring        │
                                    │ • Gemini 2.5 + Mistral AI Fallback │
                                    │ • ChromaDB RAG Vector Store        │
                                    │ • WeasyPrint Research PDF Engine   │
                                    └────────────────────────────────────┘
```

The platform is decoupled into two independent, highly specialized engines:

1. **OpenStock (`/OpenStock`)**: Handles the user-facing web dashboard, watchlist management, real-time TradingView charts, user accounts, and email digests.
2. **Stock Assistant (`/stock-analyzer`)**: Operates as a headless financial intelligence microservice handling heavy financial computations, pandas technical analysis, vector embeddings, multi-model LLM inferences, and PDF dossier generation.

---

## ⚡ Core Solved Problems & Features

### 1. Global Market Coverage (Bypassing Finnhub's 403 Wall)

* **The Problem:** Finnhub's free tier restricts fundamentals, profiles, and metrics strictly to US equities. Any query for Indian stocks (`BEL.NS`, `ICICIBANK.NS`, `RELIANCE.NS`) or European listings triggers a `403 Forbidden` error, rendering blank metrics.
* **The Solution:** OpenStock routes non-US tickers to the Brain's `/api/stocks/{symbol}/info` endpoint. Using `yfinance` with automated `.NS`/`.BO` exchange resolvers, accurate metrics (Dividend Yield, P/E ratios, 52-week ranges, Market Cap) are seamlessly fetched and formatted for global markets.

### 2. Unified "Technicals & AI Meter" Card

* **Streamlined UI:** Replaced the previous 800px+ double-card layout with a single, uncluttered panel that integrates the gauge meter and AI narrative in one view.
* **Native Speedometer Gauge:** Features a sleek 5-zone SVG arc (*Strong Sell* ➔ *Sell* ➔ *Neutral* ➔ *Buy* ➔ *Strong Buy*) with an animated needle pointing directly to the composite conviction score (0–100).
* **Three-Pillar Breakdown:**
  * **Technicals:** RSI (14), MACD diff, and 50/200-day moving average trend.
  * **Fundamentals:** Sector-relative valuation, P/E, and capital structure.
  * **News Sentiment:** Real headlines extracted from Indian and global financial press (Economic Times, Moneycontrol, Livemint, Reuters).
* **Collapsible Catalysts & Risks:** Keeps the sidebar compact while providing 1-click drilldowns into upside catalysts and downside risks.
* **One-Click TradingView Toggle:** Easily switch between the native AI Meter and the full TradingView technical analysis iframe via header tabs.

### 3. Dual-LLM Resilience (Gemini ➔ Mistral AI Fallback)

* **Zero Downtime:** If Google Gemini returns `503 Service Unavailable` (model under high demand) or rate-limit errors, the Brain automatically catches the failure and routes the prompt to **Mistral AI** (`mistral-small-latest`).
* **Deterministic Fallback:** If both external LLM APIs are offline or disconnected, an algorithmic synthesis engine generates a grounded technical summary from the quantitative indicators, ensuring the UI never breaks.

### 4. Smart Social Sentiment Auto-Hide

* **The Problem:** Third-party social listening (Adanos API) only covers US large-cap stocks. On international stocks, it displayed a wall of empty zeros (`0.0 buzz`, `0 mentions`, `No Trend`).
* **The Solution:** Added an activity gate. If a ticker has 0 social chatter, the card automatically conceals itself, leaving the screen clean and focused.

---

## 🚀 Quick Start Guide

### Prerequisites

* **Node.js**: v20+ (NVM managed or system installed)
* **Python**: 3.10+ (managed via `uv` or virtualenv)
* **MongoDB**: Atlas connection string or local MongoDB instance

---

### One-Command Startup

Both services can be launched together using the root orchestration script:

```bash
# 1. Interactive foreground mode (Ctrl+C cleanly stops all services):
./start.sh

# 2. Background daemon mode (logs output to .logs/):
./start.sh -d

# 3. Launch with stock-analyzer's standalone frontend (Port 3001):
./start.sh --all
```

When started, access:

* **OpenStock Web App:** [`http://localhost:3000`](http://localhost:3000)
* **Brain Swagger API Docs:** [`http://localhost:8000/docs`](http://localhost:8000/docs)

---

### Stopping Services	

To forcefully terminate all running processes and free up ports `3000`, `8000`, and `3001`:

```bash
./kill.sh
```

---

## 🔐 Environment Configurations

### 1. OpenStock (`/OpenStock/.env`)

```ini
# Core
NODE_ENV=development
BETTER_AUTH_SECRET=your_auth_secret_here
BETTER_AUTH_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://...

# Market Data
FINNHUB_API_KEY=your_finnhub_key
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# Stock Assistant (Brain) Microservice
STOCK_BRAIN_URL=http://localhost:8000/api

# Social Sentiment (Optional)
ADANOS_API_KEY=your_adanos_key
ADANOS_API_BASE_URL=https://api.adanos.org
```

### 2. Stock Assistant Brain (`/stock-analyzer/backend/.env`)

```ini
# Primary AI Provider
GEMINI_API_KEY=your_gemini_api_key

# Fallback AI Provider
MISTRAL_API_KEY=your_mistral_api_key

# Stock Data Engine
STOCK_DATA_PROVIDER=yfinance

# CORS Whitelist
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 📂 Project Directory Layout

```
Stonks/
├── start.sh                       # Master startup script (with venv auto-healing)
├── kill.sh                        # Port cleanup and process termination script
├── README.md                      # Platform documentation (You are here)
│
├── OpenStock/                     # User-facing Next.js 15 Platform
│   ├── app/(root)/stocks/[symbol]/# Stock details page & widget layout
│   ├── components/stocks/
│   │   ├── StockTechnicalsPanel.tsx # Unified AI Speedometer + Narrative card
│   │   ├── StockHeader.tsx        # Real-time quotes and exchange routing
│   │   └── StockSentimentCard.tsx # Social listening card (Adanos)
│   ├── lib/actions/
│   │   ├── brain.actions.ts       # Client bridge for Stock Assistant API
│   │   └── finnhub.actions.ts     # Finnhub quote routing with Brain fallback
│   └── package.json
│
└── stock-analyzer/                # Stock Assistant "The Brain" Microservice
    ├── backend/
    │   ├── app/
    │   │   ├── main.py            # FastAPI application entrypoint
    │   │   ├── config.py          # Settings (Gemini, Mistral, yfinance)
    │   │   ├── routers/
    │   │   │   ├── stocks.py      # /api/stocks/{ticker}/info
    │   │   │   ├── news.py        # /api/news/{ticker}
    │   │   │   ├── chat.py        # /api/chat/{ticker}
    │   │   │   └── export.py      # /api/export/{ticker}/pdf
    │   │   └── services/
    │   │       ├── stock_service.py    # yfinance global ticker resolver
    │   │       ├── analysis_service.py # Dual-LLM synthesis (Gemini ➔ Mistral)
    │   │       ├── scoring_service.py  # Deterministic technical/fundamental math
    │   │       ├── news_service.py     # RSS multi-publisher news scraper
    │   │       └── pdf_service.py      # WeasyPrint PDF report renderer
    │   └── pyproject.toml
    └── frontend/                  # Optional standalone Next.js client
```

---

## 🗺️ Next Steps & Roadmap

* [ ] **Interactive Copilot Drawer:** Embed a conversational "Ask Copilot" chat drawer on `/stocks/[symbol]` connecting to `/api/chat/{ticker}` with source-cited RAG answers.
* [ ] **1-Click PDF Equity Research Memos:** Add a "Download Institutional Report" button that triggers the Brain's WeasyPrint generator.
* [ ] **Smart Thesis Alerts:** Extend Inngest jobs to alert users when a stock's technical or fundamental score crosses predefined conviction thresholds.

---

## 📜 Open Source Credits, Modified Fork Notice & License

### Original Upstream Project
* **Project:** [OpenStock](https://github.com/Open-Dev-Society/OpenStock)
* **Author / Organization:** [Open Dev Society](https://github.com/Open-Dev-Society) and [ravixalgorithm](https://github.com/ravixalgorithm)
* **License:** [GNU Affero General Public License v3.0 (AGPL-3.0)](https://github.com/Open-Dev-Society/OpenStock/blob/main/LICENSE)

We express immense gratitude to the Open Dev Society community for building and maintaining OpenStock openly for everyone.

### Nature of Modifications (AGPL-3.0 Section 5 Notice)
In accordance with Section 5 of the GNU Affero General Public License v3.0, this repository constitutes a **modified version / derivative work** of OpenStock. The specific architectural and functional modifications made in this fork include:
1. **Decoupled Microservice Bridge:** Connected OpenStock to the standalone **Stock Assistant ("The Brain")** FastAPI backend via `STOCK_BRAIN_URL`.
2. **Global Exchange Fallback:** Enhanced `lib/actions/finnhub.actions.ts` to seamlessly route international and Indian exchange tickers (`.NS`, `.BO`) to the Brain's `yfinance` engine, resolving Finnhub's free-tier `403 Forbidden` wall and computing accurate dividend yields.
3. **Unified Technicals & AI Speedometer Card:** Replaced the separate, duplicate 800px+ stacked panels with a custom [`StockTechnicalsPanel.tsx`](file:///home/vaibhav7766/Desktop/Stonks/OpenStock/components/stocks/StockTechnicalsPanel.tsx) featuring a native 5-zone SVG speedometer gauge, 0–100 conviction score, three quantitative pillars (Tech, Fund, News), concise AI analyst narrative, collapsible catalysts/risks, and a 1-click TradingView toggle.
4. **Resilient Dual-LLM Pipeline:** Integrated an automatic **Mistral AI fallback** into the backend analysis engine to prevent downtime during Google Gemini 503 service outages.
5. **Smart Social Sentiment Auto-Hiding:** Added an activity gate to [`page.tsx`](file:///home/vaibhav7766/Desktop/Stonks/OpenStock/app/(root)/stocks/[symbol]/page.tsx) that automatically conceals 0-activity third-party Adanos cards on international equities, keeping the sidebar layout clean and clutter-free.
6. **Multi-Service Lifecycle Scripts:** Created [`start.sh`](file:///home/vaibhav7766/Desktop/Stonks/start.sh) (with virtualenv path auto-healing) and [`kill.sh`](file:///home/vaibhav7766/Desktop/Stonks/kill.sh) in the workspace root for unified process management.

### License Terms
This modified fork is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. If you modify, redistribute, or host this software as a networked service, you must make your modified source code available under the same AGPL-3.0 terms and preserve original author attributions.


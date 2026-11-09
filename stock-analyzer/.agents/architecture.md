# Stock Analyzer Architecture

## Overview
This document outlines the architecture of the Stock Analyzer application, highlighting the routes, services, and their data flow.

## Backend Structure

### Entry Point
- **File**: `backend/app/main.py`
- **Framework**: FastAPI
- **Purpose**: Main application entry point, configures CORS, and includes all routers

### Core Components

#### 1. Routes (API Endpoints)

**Stocks Router** (`backend/app/routers/stocks.py`)
- **GET /api/stocks/{ticker}/info** - Get stock information (name, sector, market cap, P/E ratio, 52-week high/low)
- **GET /api/stocks/{ticker}/timeseries** - Get OHLCV time series data with configurable period and interval

**News Router** (`backend/app/routers/news.py`)
- **GET /api/news/{ticker}** - Fetch news articles and AI-driven analysis using Google Gemini

**Chat Router** (`backend/app/routers/chat.py`)
- **POST /api/chat/{ticker}** - Chat with stock using historical news data from ChromaDB vector database

**Export Router** (`backend/app/routers/export.py`)
- **GET /api/export/{ticker}** - Generate and export PDF reports

**Config Router** (`backend/app/routers/config.py`)
- **GET /api/config/** - Get application configuration

#### 2. Services Layer

**Stock Service** (`backend/app/services/stock_service.py`)
- **Functions**: `get_time_series()`, `get_stock_info()`
- **Providers**: yfinance (primary), Alpha Vantage (fallback)
- **Responsibilities**: Fetch stock price data, resolve ticker symbols, handle rate limiting

**News Service** (`backend/app/services/news_service.py`)
- **Function**: `fetch_news()`
- **Source / Engine**: **PinchTab Web Scraper** (Headless Chromium Control Plane)
- **Responsibilities**: Automate browser navigation (`pinchtab nav`), extract real-time news articles (`pinchtab html`, `pinchtab text`), parse article metadata, and auto-upsert into ChromaDB vector DB.

**Analysis Service** (`backend/app/services/analysis_service.py`)
- **Function**: `analyze_news()`
- **AI Model**: Google Gemini
- **Responsibilities**: Perform sentiment analysis, extract themes, identify risks/catalysts, generate summaries

**Vector DB Service** (`backend/app/services/vector_db_service.py`)
- **Functions**: `store_news()`, `query_db()`
- **Database**: ChromaDB
- **Responsibilities**: Store news chunks for retrieval, enable semantic search for chat functionality

**PDF Service** (`backend/app/services/pdf_service.py`)
- **Function**: `generate_pdf_report()`
- **Template**: `templates/report.html`
- **Responsibilities**: Generate professional PDF reports with stock analysis

**Scoring Service** (`backend/app/services/scoring_service.py`)
- **Function**: `calculate_scores()`
- **Responsibilities**: Calculate investment scores based on multiple factors

#### 3. Models

**Stock Model** (`backend/app/models/stock.py`)
- **Classes**: `StockInfo`, `OHLCVPoint`
- **Purpose**: Data structures for stock information and time series data

**News Model** (`backend/app/models/news.py`)
- **Class**: `NewsArticle`
- **Purpose**: Data structure for news articles

#### 4. Configuration

**Config Module** (`backend/app/config.py`)
- **Settings**: API keys (NewsData, Gemini, Alpha Vantage), allowed origins, model configurations
- **Purpose**: Centralized configuration management

## Frontend Structure

### Framework
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks

### Core Components

**Stock Search** (`frontend/src/components/StockSearch.tsx`)
- **Purpose**: Search and select stocks

**Price Chart** (`frontend/src/components/PriceChart.tsx`)
- **Purpose**: Display stock price charts with multiple timeframes

**News Panel** (`frontend/src/components/NewsPanel.tsx`)
- **Purpose**: Display news articles with AI analysis

**Analysis Summary** (`frontend/src/components/AnalysisSummary.tsx`)
- **Purpose**: Show sentiment analysis and key insights

**Chat Widget** (`frontend/src/components/ChatWidget.tsx`)
- **Purpose**: Interactive chat interface for stock questions

### Hooks

**useStockData** (`frontend/src/hooks/useStockData.ts`)
- **Purpose**: Fetch and manage stock data state

**useNews** (`frontend/src/hooks/useNews.ts`)
- **Purpose**: Fetch and manage news data state

### Utilities

**API Client** (`frontend/src/lib/api.ts`)
- **Purpose**: Centralized API client for backend communication

**Types** (`frontend/src/lib/types.ts`)
- **Purpose**: TypeScript type definitions

## Data Flow

### 1. Stock Information Flow
1. User searches for a stock ticker
2. Frontend calls `/api/stocks/{ticker}/info` and `/api/stocks/{ticker}/timeseries`
3. Backend's `stock_service.py` fetches data from yfinance/Alpha Vantage
4. Data returned to frontend and displayed in charts and summaries

### 2. News and Analysis Flow
1. User requests news for a stock
2. Frontend calls `/api/news/{ticker}`
3. Backend automates headless Chromium via `news_service.py` using **PinchTab Web Scraper** to extract real-time stock news
4. News is analyzed by `analysis_service.py` using Google Gemini
5. Combined results (articles + analysis) returned to frontend

### 3. Chat Functionality Flow
1. User asks a question about a stock in chat
2. Frontend calls `/api/chat/{ticker}`
3. Backend queries ChromaDB vector database via `vector_db_service.py`
4. Relevant news chunks retrieved and combined with stock info
5. Prompt sent to Google Gemini for AI response
6. Response with citations returned to frontend

### 4. Export Flow
1. User requests PDF report
2. Frontend calls `/api/export/{ticker}`
3. Backend generates comprehensive report using `pdf_service.py`
4. PDF returned to user

## External Dependencies

### Backend
- **Python**: FastAPI, yfinance, httpx, pandas, python-dotenv
- **AI**: Google Gemini API
- **News**: PinchTab MCP Web Scraper (Playwright/Chromium Automation)
- **Database**: ChromaDB
- **PDF**: WeasyPrint

### Frontend
- **JavaScript/TypeScript**: React, Next.js, Tailwind CSS
- **HTTP**: Axios (via API client)

## Key Technologies

### Backend
- **API Framework**: FastAPI (RESTful API)
- **Database**: ChromaDB (vector database for semantic search)
- **AI Integration**: Google Gemini for natural language analysis
- **Caching**: Redis (for API responses)
- **Logging**: Rotating file handler

### Frontend
- **Framework**: Next.js (React-based)
- **Styling**: Tailwind CSS (utility-first CSS framework)
- **State**: React hooks and context
- **Routing**: Next.js file-based routing
- **API Integration**: Custom API client with error handling

## Architecture Patterns

### 1. Separation of Concerns
- **Routes**: Handle HTTP requests and responses
- **Services**: Business logic and external API integration
- **Models**: Data structures and validation
- **Configuration**: Application settings

### 2. API Design
- **RESTful**: Resource-oriented endpoints
- **JSON**: Standard data format
- **Error Handling**: Consistent error responses
- **Documentation**: OpenAPI/Swagger generated automatically

### 3. Data Storage
- **Vector Database**: ChromaDB for storing and searching news articles
- **File-based**: PDF reports generated on-demand
- **Caching**: API responses cached for performance

### 4. AI Integration
- **Prompt Engineering**: Structured prompts for consistent AI responses
- **Context Management**: Historical news context for chat functionality
- **Fallback**: Multiple AI providers (Gemini, Ollama)

## Performance Considerations

### 1. Caching
- Stock data cached for 5 minutes
- News articles cached for 1 hour
- API responses cached using Redis

### 2. Rate Limiting
- Alpha Vantage: 1 request per second
- NewsData.io: Respects API limits
- Gemini: Managed through application logic

### 3. Background Processing
- PDF generation runs asynchronously
- News fetching happens in background
- Vector database updates are batched

## Security

### 1. API Keys
- Stored in environment variables
- Never committed to version control
- Rotated regularly

### 2. CORS
- Configured to allow specific origins only
- Prevents unauthorized domain access

### 3. Input Validation
- Pydantic models validate all request bodies
- Sanitized inputs before external API calls

## Deployment

### 1. Backend
- **Container**: Docker with multi-stage build
- **Orchestration**: Docker Compose for local development
- **Scaling**: Horizontal scaling with load balancer

### 2. Frontend
- **Hosting**: Vercel (recommended for Next.js)
- **CDN**: Automatic caching through CDN
- **Build**: Static export for optimal performance

### 3. Database
- **Local**: SQLite for ChromaDB metadata
- **Production**: PostgreSQL for production deployments
- **Backup**: Regular backups of vector database

## Future Enhancements

### 1. Additional Features
- Real-time stock quotes
- Technical indicators
- Portfolio management
- Alert system

### 2. Architecture Improvements
- Microservices architecture
- Event-driven architecture
- GraphQL alternative to REST

### 3. Technology Upgrades
- gRPC for internal communication
- WebSockets for real-time updates
- Machine learning models for predictions
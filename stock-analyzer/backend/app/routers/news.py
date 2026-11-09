from fastapi import APIRouter
from app.services.news_service import fetch_news
from app.services.analysis_service import analyze_news
from app.services.stock_service import get_stock_info, get_time_series

router = APIRouter()

@router.get("/{ticker}")
async def get_news(ticker: str, page_size: int = 15, model: str = "gemini"):
    info = get_stock_info(ticker)
    time_series = get_time_series(ticker, period="6mo", interval="1d")
    articles = await fetch_news(ticker, info.name, page_size)
    analysis = analyze_news(ticker, info, time_series, articles, model=model)
    return {
        "ticker": ticker.upper(),
        "company": info.name,
        "article_count": len(articles),
        "analysis": analysis,
        "articles": [a.dict() for a in articles],
    }

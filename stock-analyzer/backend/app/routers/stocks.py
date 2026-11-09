from fastapi import APIRouter, Query
from app.services.stock_service import get_time_series, get_stock_info

router = APIRouter()

@router.get("/{ticker}/timeseries")
def get_timeseries(
    ticker: str,
    period: str = Query("6mo"),
    interval: str = Query("1d"),
    provider: str = Query("yfinance"),
):
    return {
        "ticker": ticker.upper(),
        "period": period,
        "interval": interval,
        "data": get_time_series(ticker, period, interval, provider=provider),
    }

@router.get("/{ticker}/info")
def get_info(ticker: str, provider: str = Query("yfinance")):
    return get_stock_info(ticker, provider=provider)

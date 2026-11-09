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
    dividend_yield: Optional[float] = None
    currency: Optional[str] = None
    current_price: Optional[float] = None

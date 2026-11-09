import pandas as pd
import ta
from typing import List, Dict, Any
from app.models.stock import StockInfo, OHLCVPoint
from app.models.news import NewsArticle

def calculate_fundamental_score(info: StockInfo) -> float:
    score = 50.0  # Start neutral
    
    # Analyze P/E Ratio
    pe = info.pe_ratio
    if pe is not None:
        if 0 < pe < 15:
            score += 20
        elif 15 <= pe <= 25:
            score += 10
        elif 25 < pe <= 40:
            score -= 5
        elif pe > 40:
            score -= 20
            
    # Normally we would add Revenue Growth, EPS Growth, ROE, etc., here.
    # For now, we use generalized static thresholds based on available data.
        
    return max(0.0, min(100.0, score))

def calculate_technical_score(historical_data: List[OHLCVPoint]) -> float:
    if not historical_data or len(historical_data) < 50:
        return 50.0
        
    df = pd.DataFrame([
        {"close": p.close, "high": p.high, "low": p.low, "volume": p.volume} 
        for p in historical_data
    ])
    
    score = 50.0
    
    # RSI (14)
    try:
        rsi = ta.momentum.rsi(df["close"], window=14)
        current_rsi = rsi.iloc[-1]
        if pd.notna(current_rsi):
            if current_rsi < 30: score += 20 # Oversold (Bullish reversal)
            elif current_rsi > 70: score -= 20 # Overbought (Bearish reversal)
            elif current_rsi > 50: score += 10
            else: score -= 10
    except Exception:
        pass
        
    # MACD
    try:
        macd = ta.trend.macd_diff(df["close"])
        current_macd = macd.iloc[-1]
        if pd.notna(current_macd):
            if current_macd > 0: score += 15
            elif current_macd < 0: score -= 15
    except Exception:
        pass
        
    # SMAs
    try:
        sma_50 = ta.trend.sma_indicator(df["close"], window=50)
        sma_20 = ta.trend.sma_indicator(df["close"], window=20)
        if pd.notna(sma_50.iloc[-1]) and pd.notna(sma_20.iloc[-1]):
            if sma_20.iloc[-1] > sma_50.iloc[-1]: score += 15
            else: score -= 15
    except Exception:
        pass
        
    return max(0.0, min(100.0, score))

def calculate_news_score(events: List[Dict[str, Any]]) -> float:
    if not events:
        return 50.0
        
    total_impact = 0.0
    for e in events:
        impact = float(e.get("impact", 0))  # -3 to +3
        importance = float(e.get("importance", 0.5)) # 0 to 1
        confidence = float(e.get("confidence", 0.5)) # 0 to 1
        
        event_score = impact * importance * confidence
        total_impact += event_score
        
    # Normalize from unbounded sum to 0-100
    # Let's say a total impact of +4 is very bullish (100), -4 is very bearish (0)
    final_score = 50.0 + (total_impact * 12.5)
    return max(0.0, min(100.0, final_score))

def calculate_overall_score(fundamental: float, technical: float, news: float) -> float:
    return (0.40 * fundamental) + (0.30 * technical) + (0.30 * news)
    
def get_classification(score: float) -> str:
    if score >= 70: return "Bullish"
    elif score <= 39: return "Bearish"
    return "Neutral"

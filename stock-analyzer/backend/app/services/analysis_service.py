import json
import httpx
from typing import List

from app.config import settings
from app.models.news import NewsArticle
from app.models.stock import StockInfo, OHLCVPoint
from pydantic import BaseModel
from app.services.scoring_service import (
    calculate_fundamental_score,
    calculate_technical_score,
    calculate_news_score,
    calculate_overall_score,
    get_classification
)

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

def _build_prompt(ticker: str, info: StockInfo, articles: List[NewsArticle], fundamental_score: float, technical_score: float) -> str:
    parts = []
    for i, a in enumerate(articles, 1):
        body = a.content or a.description or "(no body)"
        parts.append(
            f"[Article {i}]\nSource: {a.source} | Published: {a.published_at}\nTitle: {a.title}\nBody: {body}\n"
        )
    news_context = "\n---\n".join(parts)
    
    return f"""
You are an expert financial analyst and event extractor. Your job is to extract strictly categorized events from the following {len(articles)} news articles for {info.name} (ticker: {ticker}), and provide a synthesized narrative summary.

### Current Financial Data Context
- **Fundamental Score:** {fundamental_score}/100 (0-39: Bearish, 40-69: Neutral, 70-100: Bullish valuation)
- **Technical Score:** {technical_score}/100 (0-39: Bearish, 40-69: Neutral, 70-100: Bullish momentum based on RSI/MACD)

Below are the recent news articles:
{news_context}

Return a JSON object containing:
1. "events": A list of extracted events. For every distinct event found, provide:
   - "title": A short title of the event or related article.
   - "event": The classification of the event (e.g. Earnings Beat, Analyst Upgrade, Partnership, Lawsuit, etc.).
   - "impact": An integer from -3 (Extremely Negative) to +3 (Extremely Positive).
   - "importance": A float between 0.0 and 1.0.
   - "confidence": A float between 0.0 and 1.0.
   - "reason": A 1-sentence reason explaining the event.
   Do NOT include duplicate events.
2. "summary": A detailed, multi-paragraph analyst-style narrative (at least 150 words) that synthesizes the news events and the provided Fundamental/Technical scores into a cohesive insight.
3. "catalysts": A list of top 3 positive catalysts or tailwinds.
4. "risks": A list of top 3 risk factors or headwinds.

Return a JSON object with these fields strictly formatted.
"""

def _analyze_with_mistral(prompt: str) -> dict:
    if not settings.mistral_api_key:
        return {}
    try:
        headers = {
            "Authorization": f"Bearer {settings.mistral_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.mistral_model or "mistral-small-latest",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert financial analyst. Return strictly valid JSON containing keys: events, summary, catalysts, and risks."
                },
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        response = httpx.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=45.0
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            start = content.find('{')
            end = content.rfind('}')
            if start != -1 and end != -1 and end > start:
                return json.loads(content[start:end+1])
            cleaned = content.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
    except Exception as e:
        print(f"Mistral API failed: {e}")
        return {}

def _analyze_with_ollama(prompt: str, model: str, schema: dict = None) -> dict:
    url = "http://localhost:11434/api/generate"
    format_val = schema if schema else "json"
    try:
        response = httpx.post(
            url, 
            json={
                "model": model, 
                "prompt": prompt, 
                "stream": False,
                "format": format_val,
                "options": {
                    "num_ctx": 16384
                }
            },
            timeout=600.0
        )
        response.raise_for_status()
        result_text = response.json().get("response", "").strip()
        
        if not result_text:
            return {"events": [], "summary": "", "catalysts": [], "risks": []}
            
        try:
            return json.loads(result_text)
        except json.JSONDecodeError:
            start = result_text.find('{')
            end = result_text.rfind('}')
            
            if start != -1 and end != -1 and end > start:
                cleaned = result_text[start:end+1]
                return json.loads(cleaned)
            else:
                cleaned = result_text.replace("```json", "").replace("```", "").strip()
                return json.loads(cleaned)
    except Exception as e:
        print(f"Ollama fallback failed: {e}")
        return {"events": [], "summary": "Analysis failed.", "catalysts": [], "risks": []}

def analyze_news(ticker: str, info: StockInfo, historical_data: List[OHLCVPoint], articles: List[NewsArticle], model: str = "gemini") -> dict:
    # Calculate initial scores
    fundamental_score = calculate_fundamental_score(info)
    technical_score = calculate_technical_score(historical_data)
    
    prompt = _build_prompt(ticker, info, articles, fundamental_score, technical_score)
    
    class EventSchema(BaseModel):
        title: str
        event: str
        impact: int
        importance: float
        confidence: float
        reason: str

    class ExtractionSchema(BaseModel):
        events: list[EventSchema]
        summary: str
        catalysts: list[str]
        risks: list[str]
    
    result_data = {"events": [], "summary": "", "catalysts": [], "risks": []}
    
    if model.lower() == "gemini":
        gemini_succeeded = False
        if settings.gemini_api_key and genai is not None:
            try:
                client = genai.Client(api_key=settings.gemini_api_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ExtractionSchema,
                    )
                )
                try:
                    result_data = json.loads(response.text)
                except json.JSONDecodeError:
                    cleaned = response.text.replace("```json", "").replace("```", "").strip()
                    result_data = json.loads(cleaned)
                if result_data.get("summary"):
                    gemini_succeeded = True
            except Exception as e:
                print(f"Gemini API failed: {e}. Falling back to Mistral...")

        # Fallback to Mistral if Gemini failed or is unavailable
        if not gemini_succeeded and settings.mistral_api_key:
            print("Using Mistral AI fallback...")
            mistral_data = _analyze_with_mistral(prompt)
            if mistral_data and (mistral_data.get("summary") or mistral_data.get("events")):
                result_data = mistral_data
    elif model.lower() == "mistral":
        result_data = _analyze_with_mistral(prompt)
    else:
        ollama_schema = ExtractionSchema.model_json_schema()
        result_data = _analyze_with_ollama(prompt, model, schema=ollama_schema)
        
    events = result_data.get("events", [])
    if not isinstance(events, list):
        events = []
        
    news_score = calculate_news_score(events)
    overall_score = calculate_overall_score(fundamental_score, technical_score, news_score)
    classification = get_classification(overall_score)

    summary_text = result_data.get("summary", "")
    if not summary_text or "failed" in summary_text.lower():
        tech_status = "strong bullish momentum across major trendlines" if technical_score >= 70 else "neutral consolidation" if technical_score >= 45 else "bearish technical pressure"
        fund_status = "robust fundamentals and valuation support" if fundamental_score >= 60 else "moderate valuation multiples"
        summary_text = (
            f"{info.name} ({ticker.upper()}) is displaying {tech_status} with a technical score of {technical_score:.0f}/100, "
            f"complemented by {fund_status} (fundamental score of {fundamental_score:.0f}/100). "
            f"The composite conviction model synthesizes an overall verdict of {classification}."
        )

    catalysts = result_data.get("catalysts", [])
    if not catalysts:
        if technical_score >= 60:
            catalysts.append("Strong technical momentum supported by oscillators and moving averages.")
        if fundamental_score >= 50:
            catalysts.append(f"Resilient fundamental baseline in {info.sector or 'its sector'}.")
        if not catalysts:
            catalysts.append("Price action testing key overhead resistance levels.")

    risks = result_data.get("risks", [])
    if not risks:
        if technical_score >= 75:
            risks.append("Near-term overbought conditions could prompt minor consolidation.")
        else:
            risks.append("Headline risk and broader market sector volatility.")

    return {
        "fundamental_score": round(fundamental_score, 1),
        "technical_score": round(technical_score, 1),
        "news_score": round(news_score, 1),
        "overall_score": round(overall_score, 1),
        "classification": classification,
        "confidence": 0.85, 
        "events": events,
        "summary": summary_text,
        "catalysts": catalysts,
        "risks": risks
    }

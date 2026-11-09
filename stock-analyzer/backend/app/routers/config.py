from fastapi import APIRouter
from app.config import settings

router = APIRouter()

@router.get("/")
def get_config():
    models = []
    
    # Check Gemini
    if settings.gemini_api_key:
        models.append({"id": "gemini", "name": "Gemini 2.5 Flash"})
        
    # Check Ollama env var (e.g. "qwen3.5:4b,qwen-large-ctx:latest")
    if settings.ollama:
        ollama_models = [m.strip() for m in settings.ollama.split(",") if m.strip()]
        for m in ollama_models:
            name = m.replace("-", " ").title()
            models.append({"id": m, "name": name})
        
    providers = [{"id": "yfinance", "name": "Yahoo Finance"}]
    
    if settings.alpha_vantage_key:
        providers.append({"id": "alpha_vantage", "name": "Alpha Vantage"})
        
    return {
        "models": models,
        "providers": providers
    }

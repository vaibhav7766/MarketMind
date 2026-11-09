from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.vector_db_service import query_db
from app.services.stock_service import get_stock_info
from app.config import settings
import json

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    model: str = "gemini"

@router.post("/{ticker}")
async def chat_with_stock(ticker: str, request: ChatRequest):
    # Retrieve relevant chunks from ChromaDB
    context_chunks = query_db(ticker=ticker.upper(), query=request.message, n_results=5)
    
    if not context_chunks:
        return {
            "response": "I don't have enough historical news data for this stock yet to answer your question.",
            "citations": []
        }
        
    # Build context string and citations list
    context_str = ""
    citations = []
    
    for i, chunk in enumerate(context_chunks, 1):
        context_str += f"[Citation {i}]:\n{chunk['text']}\n\n"
        citations.append({
            "id": i,
            "title": chunk["metadata"]["title"],
            "source": chunk["metadata"]["source"],
            "url": chunk["metadata"]["url"],
            "date": chunk["metadata"]["date"]
        })
        
    info = get_stock_info(ticker)
    
    prompt = f"""
You are an expert financial analyst answering a user's question about {info.name} (ticker: {ticker.upper()}).
The user asked: "{request.message}"

Use ONLY the historical news context provided below to answer the question.
If the provided context does not contain the answer, say so explicitly. Do not make up facts.
When you use information from a citation, you MUST append the citation number in brackets to the end of the sentence (e.g. "The company's revenue grew by 20% [1].").

--- HISTORICAL NEWS CONTEXT ---
{context_str}
"""
    
    # Generate response
    response_text = ""
    if request.model.lower() == "gemini":
        gemini_success = False
        if settings.gemini_api_key and genai:
            try:
                client = genai.Client(api_key=settings.gemini_api_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                response_text = response.text
                gemini_success = True
            except Exception as e:
                print(f"Gemini API failed in chat: {e}. Falling back to Mistral...")

        if not gemini_success:
            if settings.mistral_api_key:
                import httpx
                try:
                    headers = {
                        "Authorization": f"Bearer {settings.mistral_api_key}",
                        "Content-Type": "application/json",
                    }
                    payload = {
                        "model": settings.mistral_model or "mistral-small-latest",
                        "messages": [
                            {"role": "system", "content": "You are an expert financial analyst answering a stock query."},
                            {"role": "user", "content": prompt}
                        ],
                    }
                    resp = httpx.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload, timeout=45.0)
                    resp.raise_for_status()
                    response_text = resp.json()["choices"][0]["message"]["content"]
                except Exception as me:
                    raise HTTPException(status_code=500, detail=f"Both Gemini and Mistral failed: {me}")
            else:
                raise HTTPException(status_code=500, detail="Gemini failed and no Mistral fallback is configured.")
    elif request.model.lower() == "mistral":
        import httpx
        try:
            headers = {
                "Authorization": f"Bearer {settings.mistral_api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": settings.mistral_model or "mistral-small-latest",
                "messages": [
                    {"role": "system", "content": "You are an expert financial analyst answering a stock query."},
                    {"role": "user", "content": prompt}
                ],
            }
            resp = httpx.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload, timeout=45.0)
            resp.raise_for_status()
            response_text = resp.json()["choices"][0]["message"]["content"]
        except Exception as me:
            raise HTTPException(status_code=500, detail=f"Mistral failed: {me}")
    else:
        # Use Ollama
        import httpx
        url = "http://localhost:11434/api/generate"
        try:
            response = httpx.post(
                url, 
                json={
                    "model": request.model, 
                    "prompt": prompt, 
                    "stream": False
                },
                timeout=120.0
            )
            response.raise_for_status()
            response_text = response.json().get("response", "").strip()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ollama failed: {str(e)}")
            
    return {
        "response": response_text,
        "citations": citations
    }

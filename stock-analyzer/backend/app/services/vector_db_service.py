import os
import uuid
import chromadb
from typing import List, Dict, Any
from app.models.news import NewsArticle

# Initialize ChromaDB persistent client
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma_db")

def _get_client():
    return chromadb.PersistentClient(path=DB_PATH)

def _get_collection():
    """Dynamically get or create collection to handle DB reset gracefully."""
    client = _get_client()
    return client.get_or_create_collection(name="stock_news")

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Simple text chunker to ensure we don't hit token limits and get better semantic matches."""
    if not text:
        return []
    
    words = text.split()
    chunks = []
    
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += (chunk_size - overlap)
        
    return chunks

def store_articles(ticker: str, articles: List[NewsArticle]):
    """Embed and store articles in ChromaDB."""
    unique_docs = {}
    
    for article in articles:
        text = article.content or article.description or ""
        if not text:
            continue
            
        chunks = chunk_text(text)
        for idx, chunk in enumerate(chunks):
            doc_id = f"{ticker}_{uuid.uuid5(uuid.NAMESPACE_URL, article.url)}_{idx}"
            
            meta = {
                "primary_ticker": ticker,
                "url": article.url,
                "date": article.published_at or "Unknown Date",
                "title": article.title or "Untitled",
                "source": article.source or "Unknown Source"
            }
            
            unique_docs[doc_id] = {
                "document": chunk,
                "metadata": meta,
                "id": doc_id
            }
            
    if unique_docs:
        documents = [d["document"] for d in unique_docs.values()]
        metadatas = [d["metadata"] for d in unique_docs.values()]
        ids = [d["id"] for d in unique_docs.values()]
        
        try:
            coll = _get_collection()
            coll.upsert(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"Upserted {len(documents)} chunks into ChromaDB for {ticker}")
        except Exception as e:
            print(f"ChromaDB store note for {ticker}: {e}")

def query_db(ticker: str, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
    """Query ChromaDB for relevant historical context."""
    context_chunks = []
    try:
        coll = _get_collection()
        results = coll.query(
            query_texts=[query],
            n_results=n_results,
            where={"primary_ticker": ticker}
        )
        
        if not results or not results['documents'] or not results['documents'][0]:
            return context_chunks
            
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]
        
        for i in range(len(documents)):
            context_chunks.append({
                "text": documents[i],
                "metadata": metadatas[i]
            })
    except Exception as e:
        print(f"ChromaDB query note for {ticker}: {e}")
        
    return context_chunks

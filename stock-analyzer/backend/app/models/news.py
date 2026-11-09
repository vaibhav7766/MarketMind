from pydantic import BaseModel

class NewsArticle(BaseModel):
    title: str
    source: str
    published_at: str
    url: str
    description: str
    content: str

import os
import logging
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stocks, config, news, export, chat
from app.config import settings

os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    handlers=[
        RotatingFileHandler(
            "logs/app.log", maxBytes=5*1024*1024, backupCount=1
        ),
        logging.StreamHandler()
    ],
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(title="Stock Analyzer API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(config.router, prefix="/api/config", tags=["config"])

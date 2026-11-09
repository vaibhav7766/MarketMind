from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str | None = None
    mistral_api_key: str | None = None
    mistral_model: str = "mistral-small-latest"
    ollama: str | None = None
    stock_data_provider: str = "yfinance"
    alpha_vantage_key: str = ""
    allowed_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()

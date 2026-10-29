"""Application configuration loaded from environment variables."""
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    """Central settings object for the entire backend."""

    APP_NAME: str = "AI Requirement Analyzer & Prioritization System"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str = "sqlite:///./requirement_analyzer.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Optional AI provider
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Prioritization scoring weights (must sum to 1.0)
    WEIGHT_BUSINESS_VALUE: float = 0.30
    WEIGHT_USER_IMPACT: float = 0.20
    WEIGHT_URGENCY: float = 0.20
    WEIGHT_EFFORT: float = 0.15
    WEIGHT_RISK: float = 0.15

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def weights(self) -> dict[str, float]:
        return {
            "business_value": self.WEIGHT_BUSINESS_VALUE,
            "user_impact": self.WEIGHT_USER_IMPACT,
            "urgency": self.WEIGHT_URGENCY,
            "effort": self.WEIGHT_EFFORT,
            "risk": self.WEIGHT_RISK,
        }

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

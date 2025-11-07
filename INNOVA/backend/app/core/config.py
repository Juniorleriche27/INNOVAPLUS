from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings


def _load_dotenv_with_fallback() -> None:
    # Load from current working directory first
    load_dotenv(override=False)

    # Try common project locations relative to this file
    here = Path(__file__).resolve()
    guesses = [
        here.parents[2] / ".env",              # project backend folder .env
        here.parents[3] / ".env",              # PlusBook/.env
        here.parents[1] / ".env",              # app/.env
    ]
    for candidate in guesses:
        if candidate.is_file():
            load_dotenv(dotenv_path=candidate, override=False)


_load_dotenv_with_fallback()


def _default_adapter_path() -> Optional[str]:
    """Return default adapter path if present locally."""
    guesses = [
        Path(__file__).resolve().parents[2] / "models" / "qwen2.5-0.5b-instruct-lora",
        Path("/opt/innovaplus/models/qwen2.5-0.5b-instruct-lora"),
    ]
    for candidate in guesses:
        if candidate.exists():
            return str(candidate)
    return None


class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    APP_NAME: str = "plusbooks-fastapi"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "insecure-dev-secret-change-me")
    JWT_ALG: str = "HS256"
    JWT_EXPIRES_MINUTES: int = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))
    SESSION_COOKIE_NAME: str = os.getenv("SESSION_COOKIE_NAME", "innova_session")
    SESSION_TTL_DAYS: int = int(os.getenv("SESSION_TTL_DAYS", "7"))
    RESET_TOKEN_TTL_MIN: int = int(os.getenv("RESET_TOKEN_TTL_MIN", "30"))
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "https://innovaplus.africa")
    SMTP_HOST: str | None = os.getenv("SMTP_HOST")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER")
    SMTP_PASS: str | None = os.getenv("SMTP_PASS")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", os.getenv("SMTP_STARTTLS", "true")).lower() in {"1", "true", "yes"}
    SMTP_FROM_EMAIL: str | None = os.getenv("SMTP_FROM_EMAIL") or os.getenv("SMTP_USER")
    CHAT_PROVIDER: str = os.getenv("PROVIDER", "local")
    CHAT_MODEL: str | None = os.getenv("CHAT_MODEL")
    CHAT_MAX_NEW_TOKENS: int = int(os.getenv("CHAT_MAX_NEW_TOKENS", "600"))
    # CORS
    ALLOWED_ORIGINS: str | None = os.getenv("ALLOWED_ORIGINS")
    # RAG / AI
    EMBED_MODEL: str | None = os.getenv("EMBED_MODEL")
    EMBED_DIM: int = int(os.getenv("EMBED_DIM", "384"))
    LLM_PROVIDER: str | None = os.getenv("LLM_PROVIDER")
    LLM_MODEL: str | None = os.getenv("LLM_MODEL")
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "30"))
    SMOLLM_MODEL_PATH: str = os.getenv("SMOLLM_MODEL_PATH", "models/qwen2.5-0.5b-instruct")
    SMOLLM_ADAPTER_PATH: Optional[str] = os.getenv("SMOLLM_ADAPTER_PATH") or _default_adapter_path()
    COHERE_API_KEY: str | None = os.getenv("COHERE_API_KEY")
    VECTOR_INDEX_NAME: str = os.getenv("VECTOR_INDEX_NAME", "vector_index")
    RAG_TOP_K_DEFAULT: int = int(os.getenv("RAG_TOP_K_DEFAULT", "5"))
    RAG_MAX_CONTEXT_TOKENS: int = int(os.getenv("RAG_MAX_CONTEXT_TOKENS", "1200"))
    RAG_API_URL: str | None = os.getenv("RAG_API_URL", "http://127.0.0.1:8011")
    RAG_API_TIMEOUT: float = float(os.getenv("RAG_API_TIMEOUT", "8.0"))
    UPLOAD_MAX_MB: int = int(os.getenv("UPLOAD_MAX_MB", "20"))
    ALLOWED_UPLOAD_MIME: str | None = os.getenv("ALLOWED_UPLOAD_MIME")
    # Matching / Fairness (INNOVA)
    MATCH_ALPHA: float = float(os.getenv("MATCH_ALPHA", "0.5"))
    MATCH_BETA: float = float(os.getenv("MATCH_BETA", "0.3"))
    MATCH_GAMMA: float = float(os.getenv("MATCH_GAMMA", "0.15"))
    MATCH_DELTA: float = float(os.getenv("MATCH_DELTA", "0.15"))
    MATCH_TOP_K: int = int(os.getenv("MATCH_TOP_K", "10"))
    FAIRNESS_WINDOW_DAYS: int = int(os.getenv("FAIRNESS_WINDOW_DAYS", "7"))
    FAIRNESS_NEED_INDEX_JSON: str | None = os.getenv("FAIRNESS_NEED_INDEX_JSON")
    FAIRNESS_MIN_QUOTA: float = float(os.getenv("FAIRNESS_MIN_QUOTA", "0.05"))
    FAIRNESS_MAX_QUOTA: float = float(os.getenv("FAIRNESS_MAX_QUOTA", "0.5"))
    # Multi-DB names (modules)
    DB_PLUSBOOK: str | None = None
    DB_INNOVA: str | None = None
    DB_PIEAGENCY: str | None = None
    DB_FARMLINK: str | None = None
    DB_SANTE: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings(
    MONGO_URI=os.getenv("MONGO_URI", "mongodb://localhost:27017"),
    DB_NAME=os.getenv("DB_NAME", "plusbook_db"),
)

# Prefer INNOVA as the default (root) DB if provided
settings.DB_INNOVA = settings.DB_INNOVA or "innova_db"
if os.getenv("DB_NAME") is None:
    # If DB_NAME not explicitly set in env, use DB_INNOVA for the root app
    settings.DB_NAME = settings.DB_INNOVA

# Defaults for module DBs
settings.DB_PLUSBOOK = settings.DB_PLUSBOOK or "plusbook_db"
settings.DB_PIEAGENCY = settings.DB_PIEAGENCY or "pieagency_db"
settings.DB_FARMLINK = settings.DB_FARMLINK or "farmlink_db"
settings.DB_SANTE = settings.DB_SANTE or "sante_db"

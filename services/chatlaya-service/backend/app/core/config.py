from __future__ import annotations

import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = os.getenv("SERVICE_NAME", "chatlaya-service")
    SERVICE_PORT: int = int(os.getenv("SERVICE_PORT", "8010"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", os.getenv("ENV", "development"))
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    CORE_INTERNAL_API_BASE_URL: str | None = os.getenv("CORE_INTERNAL_API_BASE_URL")
    CORE_INTERNAL_API_TIMEOUT_S: float = float(os.getenv("CORE_INTERNAL_API_TIMEOUT_S", "5"))
    INTERNAL_API_TOKEN: str | None = os.getenv("INTERNAL_API_TOKEN")
    CHAT_PROVIDER: str | None = os.getenv("CHAT_PROVIDER")
    CHAT_MODEL: str | None = os.getenv("CHAT_MODEL")
    LLM_PROVIDER: str | None = os.getenv("LLM_PROVIDER")
    LLM_MODEL: str | None = os.getenv("LLM_MODEL")
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "30"))
    COHERE_API_KEY: str | None = os.getenv("COHERE_API_KEY")
    EMBED_MODEL: str | None = os.getenv("EMBED_MODEL")
    EMBED_DIM: int = int(os.getenv("EMBED_DIM", "1024"))
    RAG_API_URL: str | None = os.getenv("RAG_API_URL")
    RAG_API_TIMEOUT: float = float(os.getenv("RAG_API_TIMEOUT", "8"))
    RAG_TOP_K_DEFAULT: int = int(os.getenv("RAG_TOP_K_DEFAULT", "5"))
    RAG_MAX_CONTEXT_TOKENS: int = int(os.getenv("RAG_MAX_CONTEXT_TOKENS", "900"))
    CHATLAYA_SPECIALIST_SCHEMA: str | None = os.getenv("CHATLAYA_SPECIALIST_SCHEMA")
    CHATLAYA_SPECIALIST_TABLE: str | None = os.getenv("CHATLAYA_SPECIALIST_TABLE")
    CHATLAYA_SPECIALIST_FILTER_COLUMN: str | None = os.getenv("CHATLAYA_SPECIALIST_FILTER_COLUMN")
    CHATLAYA_SPECIALIST_FILTER_VALUE: str | None = os.getenv("CHATLAYA_SPECIALIST_FILTER_VALUE")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

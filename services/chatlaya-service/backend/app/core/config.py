from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SERVICE_NAME: str = "chatlaya-service"
    SERVICE_PORT: int = 8010
    ENVIRONMENT: str = "development"
    DATABASE_URL: str | None = None
    CORE_INTERNAL_API_BASE_URL: str | None = None
    CORE_INTERNAL_API_TIMEOUT_S: float = 5.0
    INTERNAL_API_TOKEN: str | None = None
    CHAT_PROVIDER: str | None = None
    CHAT_MODEL: str | None = None
    LLM_PROVIDER: str | None = None
    LLM_MODEL: str | None = None
    LLM_TIMEOUT: int = 30
    LLM_MAX_NEW_TOKENS: int = 280
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    AI_GATEWAY_BASE_URL: str | None = None
    AI_GATEWAY_API_KEY: str | None = None
    AI_GATEWAY_TIMEOUT_SECONDS: int = 120
    COHERE_API_KEY: str | None = None
    EMBED_MODEL: str | None = None
    EMBED_DIM: int = 1024
    RAG_API_URL: str | None = None
    RAG_API_TIMEOUT: float = 8.0
    RAG_TOP_K_DEFAULT: int = 5
    RAG_MAX_CONTEXT_TOKENS: int = 600
    CHATLAYA_SPECIALIST_SCHEMA: str | None = None
    CHATLAYA_SPECIALIST_TABLE: str | None = None
    CHATLAYA_SPECIALIST_FILTER_COLUMN: str | None = None
    CHATLAYA_SPECIALIST_FILTER_VALUE: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()

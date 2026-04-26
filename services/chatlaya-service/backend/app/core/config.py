from __future__ import annotations

import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = os.getenv("SERVICE_NAME", "chatlaya-service")
    SERVICE_PORT: int = int(os.getenv("SERVICE_PORT", "8010"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", os.getenv("ENV", "development"))
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    CORE_INTERNAL_API_BASE_URL: str | None = os.getenv("CORE_INTERNAL_API_BASE_URL")
    INTERNAL_API_TOKEN: str | None = os.getenv("INTERNAL_API_TOKEN")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

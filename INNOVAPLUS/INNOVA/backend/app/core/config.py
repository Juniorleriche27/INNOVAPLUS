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


class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    APP_NAME: str = "plusbooks-fastapi"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "insecure-dev-secret-change-me")
    JWT_ALG: str = "HS256"
    JWT_EXPIRES_MINUTES: int = int(os.getenv("JWT_EXPIRES_MINUTES", "60"))
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

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

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings(
    MONGO_URI=os.getenv("MONGO_URI", "mongodb://localhost:27017"),
    DB_NAME=os.getenv("DB_NAME", "plusbook_db"),
)

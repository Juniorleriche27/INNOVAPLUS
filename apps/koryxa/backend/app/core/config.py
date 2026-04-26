from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings


def _load_dotenv_with_fallback() -> None:
    # Load from current working directory first
    load_dotenv(override=False)

    # Try common project locations relative to this file
    here = Path(__file__).resolve()
    guesses = [
        here.parents[2] / ".env",              # project backend folder .env
        here.parents[3] / ".env",              # repository root fallback
        here.parents[1] / ".env",              # app/.env
    ]
    for candidate in guesses:
        if candidate.is_file():
            load_dotenv(dotenv_path=candidate, override=False)


_load_dotenv_with_fallback()


class Settings(BaseSettings):
    MONGO_URI: str
    DB_NAME: str
    ENV: str = os.getenv("ENV", "development")
    APP_NAME: str = "koryxa-backend"
    PRODUCT_MODE: str = os.getenv("PRODUCT_MODE", "all")
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
    SUBMISSION_NOTIFY_EMAILS: str | None = os.getenv("SUBMISSION_NOTIFY_EMAILS")
    CHAT_PROVIDER: str = os.getenv("PROVIDER", "cohere")
    CHAT_MODEL: str | None = os.getenv("CHAT_MODEL")
    CHAT_MAX_NEW_TOKENS: int = int(os.getenv("CHAT_MAX_NEW_TOKENS", "900"))
    # CORS
    ALLOWED_ORIGINS: str | None = os.getenv("ALLOWED_ORIGINS")
    # RAG / AI
    EMBED_MODEL: str | None = os.getenv("EMBED_MODEL")
    EMBED_DIM: int = int(os.getenv("EMBED_DIM", "384"))
    LLM_PROVIDER: str | None = os.getenv("LLM_PROVIDER")
    LLM_MODEL: str | None = os.getenv("LLM_MODEL")
    # LLM calls for MyPlanning can take longer; default to 5 minutes unless overridden
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "300"))
    COHERE_API_KEY: str | None = os.getenv("COHERE_API_KEY")
    VECTOR_INDEX_NAME: str = os.getenv("VECTOR_INDEX_NAME", "vector_index")
    RAG_TOP_K_DEFAULT: int = int(os.getenv("RAG_TOP_K_DEFAULT", "5"))
    RAG_MAX_CONTEXT_TOKENS: int = int(os.getenv("RAG_MAX_CONTEXT_TOKENS", "1200"))
    RAG_API_URL: str | None = os.getenv("RAG_API_URL", "http://127.0.0.1:8011")
    RAG_API_TIMEOUT: float = float(os.getenv("RAG_API_TIMEOUT", "8.0"))
    UPLOAD_MAX_MB: int = int(os.getenv("UPLOAD_MAX_MB", "20"))
    ALLOWED_UPLOAD_MIME: str | None = os.getenv("ALLOWED_UPLOAD_MIME")
    UPLOADS_DIR: str = os.getenv("UPLOADS_DIR", "/srv/koryxa_uploads")
    MODULE6_TEST_COOLDOWN_HOURS: int = int(os.getenv("MODULE6_TEST_COOLDOWN_HOURS", "6"))
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
    DB_INNOVA: str | None = None
    OTP_CODE_LENGTH: int = int(os.getenv("OTP_CODE_LENGTH", "6"))
    OTP_TTL_MIN: int = int(os.getenv("OTP_TTL_MIN", "10"))
    OTP_DEV_DEBUG: bool = os.getenv("OTP_DEV_DEBUG", "false").lower() in {"1", "true", "yes"}
    DEV_AUTH_BYPASS: bool = os.getenv("DEV_AUTH_BYPASS", "false").lower() in {"1", "true", "yes"}
    DEV_AUTH_BYPASS_EMAIL: str = os.getenv("DEV_AUTH_BYPASS_EMAIL", "dev@koryxa.app")
    DEV_AUTH_BYPASS_FIRST_NAME: str = os.getenv("DEV_AUTH_BYPASS_FIRST_NAME", "Dev")
    DEV_AUTH_BYPASS_LAST_NAME: str = os.getenv("DEV_AUTH_BYPASS_LAST_NAME", "Local")
    DEV_AUTH_BYPASS_COUNTRY: str = os.getenv("DEV_AUTH_BYPASS_COUNTRY", "TG")
    DEV_AUTH_BYPASS_ACCOUNT_TYPE: str = os.getenv("DEV_AUTH_BYPASS_ACCOUNT_TYPE", "organization")
    DEV_AUTH_BYPASS_PLAN: str = os.getenv("DEV_AUTH_BYPASS_PLAN", "team")
    DEV_AUTH_BYPASS_WORKSPACE_ROLE: str = os.getenv("DEV_AUTH_BYPASS_WORKSPACE_ROLE", "demandeur")
    WHATSAPP_API_URL: str | None = os.getenv("WHATSAPP_API_URL")
    WHATSAPP_API_TOKEN: str | None = os.getenv("WHATSAPP_API_TOKEN")
    WHATSAPP_SENDER: str | None = os.getenv("WHATSAPP_SENDER")
    USER_HASH_SECRET: str = os.getenv("USER_HASH_SECRET", "dev-user-hash-secret-change-me")
    SIGNUP_NOTIFY_EMAILS: str | None = os.getenv("SIGNUP_NOTIFY_EMAILS")
    YOUTUBE_API_KEY: str | None = os.getenv("YOUTUBE_API_KEY")
    ADMIN_EMAILS: str | None = os.getenv("ADMIN_EMAILS", "seniorlamadokou@gmail.com")
    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "https://api.innovaplus.africa")
    PAYDUNYA_MODE: str = os.getenv("PAYDUNYA_MODE", "test")
    PAYDUNYA_BASE_URL: str | None = os.getenv("PAYDUNYA_BASE_URL")
    PAYDUNYA_MASTER_KEY: str | None = os.getenv("PAYDUNYA_MASTER_KEY")
    PAYDUNYA_PRIVATE_KEY: str | None = os.getenv("PAYDUNYA_PRIVATE_KEY")
    PAYDUNYA_TOKEN: str | None = os.getenv("PAYDUNYA_TOKEN")
    PAYDUNYA_STORE_NAME: str = os.getenv("PAYDUNYA_STORE_NAME", "KORYXA")
    PAYDUNYA_STORE_TAGLINE: str = os.getenv("PAYDUNYA_STORE_TAGLINE", "Plateforme KORYXA")
    PAYDUNYA_CHANNELS: str | None = os.getenv("PAYDUNYA_CHANNELS")
    PAYDUNYA_VERIFY_HASH: bool = os.getenv("PAYDUNYA_VERIFY_HASH", "true").lower() in {"1", "true", "yes"}
    PAYDUNYA_HTTP_TIMEOUT_S: int = int(os.getenv("PAYDUNYA_HTTP_TIMEOUT_S", "20"))
    PAYDUNYA_RETURN_PATH: str = os.getenv("PAYDUNYA_RETURN_PATH", "/pricing?checkout=success")
    PAYDUNYA_CANCEL_PATH: str = os.getenv("PAYDUNYA_CANCEL_PATH", "/pricing?checkout=cancel")
    PAYDUNYA_CALLBACK_PATH: str = os.getenv("PAYDUNYA_CALLBACK_PATH", "/paydunya/ipn")
    PAYDUNYA_AMOUNT_PRO_MONTHLY: int = int(os.getenv("PAYDUNYA_AMOUNT_PRO_MONTHLY", "5000"))
    PAYDUNYA_AMOUNT_PRO_YEARLY: int = int(os.getenv("PAYDUNYA_AMOUNT_PRO_YEARLY", "50000"))
    PAYDUNYA_AMOUNT_TEAM_MONTHLY: int = int(os.getenv("PAYDUNYA_AMOUNT_TEAM_MONTHLY", "20000"))
    PAYDUNYA_AMOUNT_TEAM_YEARLY: int = int(os.getenv("PAYDUNYA_AMOUNT_TEAM_YEARLY", "200000"))
    ENFORCE_HTTPS_REDIRECT: bool = os.getenv("ENFORCE_HTTPS_REDIRECT", "true").lower() in {"1", "true", "yes"}
    ALLOWED_HOSTS: str | None = os.getenv("ALLOWED_HOSTS")
    REQUIRE_MONGO: bool = os.getenv("REQUIRE_MONGO", "true").lower() in {"1", "true", "yes"}

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings(
    MONGO_URI=os.getenv("MONGO_URI", "mongodb://localhost:27017"),
    DB_NAME=os.getenv("DB_NAME", "innova_db"),
)

# Prefer INNOVA as the default (root) DB if provided
settings.DB_INNOVA = settings.DB_INNOVA or "innova_db"
if os.getenv("DB_NAME") is None:
    # If DB_NAME not explicitly set in env, use DB_INNOVA for the root app
    settings.DB_NAME = settings.DB_INNOVA


def is_production_env() -> bool:
    return (settings.ENV or "").strip().lower() == "production"


def get_allowed_hosts() -> list[str]:
    raw = [host.strip() for host in (settings.ALLOWED_HOSTS or "").split(",") if host.strip()]
    if raw:
        hosts = list(dict.fromkeys(raw))
    else:
        hosts: list[str] = []
        for candidate in (settings.FRONTEND_BASE_URL, settings.BACKEND_BASE_URL):
            try:
                parsed = Path(candidate).name  # noop fallback guard for malformed values
                del parsed
            except Exception:
                pass
            try:
                from urllib.parse import urlparse

                hostname = (urlparse(candidate).hostname or "").strip()
            except Exception:
                hostname = ""
            if hostname:
                hosts.append(hostname)
                if not hostname.startswith("www."):
                    hosts.append(f"www.{hostname}")

    # Allow local reverse-proxy and systemd health probes that hit the app over loopback.
    hosts.extend(["127.0.0.1", "localhost", "::1"])
    return list(dict.fromkeys(hosts))

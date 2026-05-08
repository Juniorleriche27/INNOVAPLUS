from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = "https://formation.innovaplus.africa,https://innovaplus.africa"
    CORE_AUTH_ME_URL: str = "http://127.0.0.1:8000/innova/api/auth/me"
    CORE_AUTH_TIMEOUT_S: float = 5.0
    KORYXA_SESSION_COOKIE_NAME: str = "innova_session"
    COHERE_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()

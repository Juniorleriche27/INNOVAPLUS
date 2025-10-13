from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings


try:
    import bcrypt as _bcrypt  # type: ignore
    _HAS_BCRYPT = hasattr(_bcrypt, "__about__") or hasattr(_bcrypt, "__version__")
except Exception:
    _HAS_BCRYPT = False

# Prefer bcrypt if usable; otherwise stick to PBKDF2 only
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256"] if _HAS_BCRYPT else ["pbkdf2_sha256"],
    deprecated="auto",
)
_fallback_ctx = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    try:
        if _HAS_BCRYPT:
            return pwd_context.hash(password)
        return _fallback_ctx.hash(password)
    except Exception:
        # Fallback when hashing fails (e.g., bcrypt backend problem)
        return _fallback_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        if _HAS_BCRYPT:
            return pwd_context.verify(plain, hashed)
        # If bcrypt is not available, try PBKDF2 verification directly
        return _fallback_ctx.verify(plain, hashed)
    except Exception:
        # Last resort: PBKDF2
        try:
            return _fallback_ctx.verify(plain, hashed)
        except Exception:
            return False


def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes or settings.JWT_EXPIRES_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError:
        return None

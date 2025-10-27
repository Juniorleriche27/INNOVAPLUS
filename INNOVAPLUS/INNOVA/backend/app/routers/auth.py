from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, urlparse

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.auth import (
    generate_session_token,
    hash_password,
    hash_token,
    normalize_email,
    session_expiry,
    verify_password,
)
from app.core.config import settings
from app.core.email import send_email_async
from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.users import (
    AuthResponse,
    ForgotPasswordPayload,
    LoginPayload,
    ResetPasswordPayload,
    UserCreate,
    UserPublic,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


def _cookie_domain() -> str | None:
    try:
        host = urlparse(settings.FRONTEND_BASE_URL).hostname
    except Exception:
        return None
    if not host:
        return None
    host = host.lstrip(".")
    # Avoid setting domain for localhost / dev hosts
    if host in {"localhost", "127.0.0.1"} or host.endswith(".local"):
        return None
    if host.count(".") >= 1:
        return f".{host}"
    return None


def _set_session_cookie(response: Response, token: str, expires_at: datetime) -> None:
    max_age = max(60, int((expires_at - datetime.now(timezone.utc)).total_seconds()))
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=max_age,
        expires=expires_at,
        path="/",
        domain=_cookie_domain(),
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        domain=_cookie_domain(),
    )


def _public_user(user: dict) -> UserPublic:
    created_at = user.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at)
        except ValueError:
            created_at = datetime.now(timezone.utc)
    elif not created_at:
        created_at = datetime.now(timezone.utc)
    roles = user.get("roles") or ["user"]
    if not isinstance(roles, list):
        roles = [str(roles)]
    return UserPublic(
        id=str(user.get("_id")),
        email=user.get("email"),
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        roles=roles,
        created_at=created_at,
    )


async def _issue_session(
    response: Response,
    db: AsyncIOMotorDatabase,
    user_id,
    request: Request,
) -> datetime:
    token = generate_session_token()
    now = datetime.now(timezone.utc)
    expires_at = session_expiry()
    session_doc = {
        "user_id": user_id,
        "token_hash": hash_token(token),
        "issued_at": now,
        "expires_at": expires_at,
        "revoked": False,
        "ip": getattr(request.client, "host", None),
        "ua": request.headers.get("user-agent"),
        "last_seen_at": now,
    }
    await db["sessions"].insert_one(session_doc)
    _set_session_cookie(response, token, expires_at)
    response.headers["Cache-Control"] = "no-store"
    return expires_at


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    response: Response,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    email = normalize_email(payload.email)
    existing = await db["users"].find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_EXISTS", "detail": "Email déjà utilisé"},
        )

    now = datetime.now(timezone.utc)
    user_doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "first_name": payload.first_name.strip(),
        "last_name": payload.last_name.strip(),
        "roles": ["user"],
        "created_at": now,
    }
    res = await db["users"].insert_one(user_doc)
    user_doc["_id"] = res.inserted_id

    expires_at = await _issue_session(response, db, user_doc["_id"], request)
    return {"user": _public_user(user_doc), "session_expires_at": expires_at}


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginPayload,
    response: Response,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    email = normalize_email(payload.email)
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")

    stored_hash = user.get("password_hash") or user.get("password")
    if not stored_hash or not verify_password(payload.password, stored_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")

    # Promote legacy password field to password_hash
    if "password_hash" not in user or not user.get("password_hash"):
        await db["users"].update_one({"_id": user["_id"]}, {"$set": {"password_hash": stored_hash}, "$unset": {"password": ""}})
        user["password_hash"] = stored_hash

    expires_at = await _issue_session(response, db, user["_id"], request)
    return {"user": _public_user(user), "session_expires_at": expires_at}


@router.get("/me", response_model=UserPublic)
async def me(current: dict = Depends(get_current_user)):
    return _public_user(current)


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        token_hash = hash_token(token)
        now = datetime.now(timezone.utc)
        await db["sessions"].update_many(
            {"token_hash": token_hash, "revoked": False},
            {"$set": {"revoked": True, "revoked_at": now}},
        )
    _clear_session_cookie(response)
    response.headers["Cache-Control"] = "no-store"
    return {"ok": True}


@router.post("/forgot")
async def forgot_password(
    payload: ForgotPasswordPayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    email = normalize_email(payload.email)
    user = await db["users"].find_one({"email": email})
    if not user:
        # Toujours répondre ok pour éviter l'énumération d'emails
        return {"ok": True}

    token = generate_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_TTL_MIN)
    doc = {
        "user_id": user["_id"],
        "token_hash": hash_token(token),
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.now(timezone.utc),
        "ip": getattr(request.client, "host", None),
        "ua": request.headers.get("user-agent"),
    }
    await db["password_reset_tokens"].insert_one(doc)

    params = urlencode({"token": token, "email": email})
    reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset?{params}"
    subject = "Réinitialisation de votre mot de passe INNOVA+"
    first_name = user.get("first_name", "") or "membre"
    html_body = f"""
    <p>Bonjour {first_name},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe INNOVA+.</p>
    <p>Veuillez cliquer sur le lien ci-dessous (valide {settings.RESET_TOKEN_TTL_MIN} minutes) :</p>
    <p><a href="{reset_url}">{reset_url}</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
    <p>L’équipe INNOVA+</p>
    """
    text_body = (
        f"Bonjour {first_name},\n\n"
        "Vous avez demandé à réinitialiser votre mot de passe INNOVA+.\n"
        f"Veuillez ouvrir le lien suivant (valide {settings.RESET_TOKEN_TTL_MIN} minutes) :\n{reset_url}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel.\n\n"
        "L’équipe INNOVA+"
    )

    try:
        await send_email_async(subject=subject, recipient=email, html_body=html_body, text_body=text_body)
    except Exception as exc:
        logger.warning("Failed to send password reset email: %s", exc)

    return {"ok": True}


@router.post("/reset")
async def reset_password(
    payload: ResetPasswordPayload,
    response: Response,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    email = normalize_email(payload.email)
    user = await db["users"].find_one({"email": email})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token invalide ou expiré")

    now = datetime.now(timezone.utc)
    token_hash = hash_token(payload.token)
    token_doc = await db["password_reset_tokens"].find_one(
        {
            "user_id": user["_id"],
            "token_hash": token_hash,
            "used": False,
            "expires_at": {"$gt": now},
        }
    )
    if not token_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token invalide ou expiré")

    new_hash = hash_password(payload.new_password)
    await db["users"].update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": new_hash,
                "password_updated_at": now,
            },
            "$unset": {"password": ""},
        },
    )
    await db["password_reset_tokens"].update_one(
        {"_id": token_doc["_id"]},
        {
            "$set": {
                "used": True,
                "used_at": now,
                "used_ip": getattr(request.client, "host", None),
                "used_ua": request.headers.get("user-agent"),
            }
        },
    )
    await db["sessions"].update_many(
        {"user_id": user["_id"], "revoked": False},
        {"$set": {"revoked": True, "revoked_at": now}},
    )
    _clear_session_cookie(response)
    response.headers["Cache-Control"] = "no-store"
    return {"ok": True}


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup_alias(
    payload: UserCreate,
    response: Response,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return await register(payload, response, request, db)

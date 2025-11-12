from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, urlparse
import asyncio
import logging
import secrets
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
    OTPRequestPayload,
    OTPVerifyPayload,
    ResetPasswordPayload,
    UserCreate,
    UserPublic,
    RoleUpdatePayload,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])
OTP_COLLECTION = "login_otps"


def _generate_otp(length: int | None = None) -> str:
    digits = "0123456789"
    size = length or settings.OTP_CODE_LENGTH
    return "".join(secrets.choice(digits) for _ in range(size))


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
    now = datetime.now(timezone.utc)
    ttl_seconds = int((expires_at - now).total_seconds())
    if ttl_seconds <= 0:
        ttl_seconds = 60
    expires_utc = expires_at
    if expires_at.tzinfo is None:
        expires_utc = expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_utc = expires_at.astimezone(timezone.utc)
    secure_cookie = True
    try:
        secure_cookie = urlparse(settings.FRONTEND_BASE_URL).scheme == "https"
    except Exception:
        secure_cookie = True

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=ttl_seconds,
        expires=expires_utc,
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
    workspace_role = user.get("workspace_role")
    if workspace_role not in {"demandeur", "prestataire"}:
        workspace_role = None
    return UserPublic(
        id=str(user.get("_id")),
        email=user.get("email"),
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        roles=roles,
        created_at=created_at,
        workspace_role=workspace_role,
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


@router.post("/request-otp")
async def request_otp(
    payload: OTPRequestPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    email = normalize_email(payload.email)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.OTP_TTL_MIN)
    code = _generate_otp()
    otp_doc = {
        "email": email,
        "code_hash": hash_password(code),
        "expires_at": expires_at,
        "attempts": 0,
        "intent": payload.intent or "auto",
        "created_at": now,
    }
    await db[OTP_COLLECTION].update_one({"email": email}, {"$set": otp_doc}, upsert=True)

    subject = "Code de connexion KORYXA"
    html_body = f"""
    <html lang=\"fr\">
        <body>
            <p>Bonjour,</p>
            <p>Voici votre code de connexion KORYXA :</p>
            <p style=\"font-size:24px;font-weight:bold;letter-spacing:4px;\">{code}</p>
            <p>Il expire dans {settings.OTP_TTL_MIN} minutes.</p>
        </body>
    </html>
    """
    asyncio.create_task(send_email_async(subject, email, html_body, f"Code: {code}"))
    response = {"ok": True, "expires_at": expires_at.isoformat()}
    if settings.ENV != "production" or settings.OTP_DEV_DEBUG:
        response["debug_code"] = code
    return response


@router.post("/login-otp", response_model=AuthResponse)
async def login_with_otp(
    payload: OTPVerifyPayload,
    response: Response,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    email = normalize_email(payload.email)
    now = datetime.now(timezone.utc)
    otp_doc = await db[OTP_COLLECTION].find_one({"email": email})
    if not otp_doc or otp_doc.get("expires_at") <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expiré. Merci de renvoyer un OTP.")

    if not verify_password(payload.code, otp_doc.get("code_hash") or ""):
        attempts = int(otp_doc.get("attempts", 0)) + 1
        await db[OTP_COLLECTION].update_one({"_id": otp_doc["_id"]}, {"$set": {"attempts": attempts}})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Code invalide.")

    await db[OTP_COLLECTION].delete_one({"_id": otp_doc["_id"]})

    user = await db["users"].find_one({"email": email})
    if not user:
        derived = email.split("@", 1)[0]
        default_first = payload.first_name or derived.replace(".", " ").replace("_", " ").title()
        default_last = payload.last_name or ""
        user_doc = {
            "email": email,
            "password_hash": hash_password(secrets.token_urlsafe(12)),
            "first_name": (default_first or "Membre").strip(),
            "last_name": default_last.strip(),
            "roles": ["user"],
            "created_at": now,
        }
        res = await db["users"].insert_one(user_doc)
        user_doc["_id"] = res.inserted_id
        user = user_doc
    else:
        updates = {}
        if payload.first_name and not user.get("first_name"):
            updates["first_name"] = payload.first_name.strip()
        if payload.last_name and not user.get("last_name"):
            updates["last_name"] = payload.last_name.strip()
        if updates:
            await db["users"].update_one({"_id": user["_id"]}, {"$set": updates})
            user.update(updates)

    expires_at = await _issue_session(response, db, user["_id"], request)
    return {"user": _public_user(user), "session_expires_at": expires_at}


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


@router.post("/role")
async def set_workspace_role(
    payload: RoleUpdatePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    await db["users"].update_one(
        {"_id": current["_id"]},
        {"$set": {"workspace_role": payload.role}},
    )
    current["workspace_role"] = payload.role
    return {"workspace_role": payload.role}


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
    subject = "Réinitialisation de votre mot de passe KORYXA"
    first_name = user.get("first_name", "") or "membre"
    html_body = f"""
    <p>Bonjour {first_name},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe KORYXA.</p>
    <p>Veuillez cliquer sur le lien ci-dessous (valide {settings.RESET_TOKEN_TTL_MIN} minutes) :</p>
    <p><a href="{reset_url}">{reset_url}</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
    <p>L’équipe KORYXA</p>
    """
    text_body = (
        f"Bonjour {first_name},\n\n"
        "Vous avez demandé à réinitialiser votre mot de passe KORYXA.\n"
        f"Veuillez ouvrir le lien suivant (valide {settings.RESET_TOKEN_TTL_MIN} minutes) :\n{reset_url}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce courriel.\n\n"
        "L’équipe KORYXA"
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

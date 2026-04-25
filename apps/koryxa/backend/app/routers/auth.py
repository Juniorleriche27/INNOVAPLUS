from __future__ import annotations

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, urlparse
import asyncio
import logging
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

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
from app.deps.auth import get_current_user
from app.repositories.auth_pg import (
    create_reset_token,
    create_session as create_pg_session,
    create_user as create_pg_user,
    delete_otp,
    get_latest_otp,
    get_user_by_email,
    mark_reset_token_used,
    replace_otp,
    revoke_session_by_token,
    revoke_sessions_for_user,
    update_user_fields,
    upsert_dev_user,
    get_valid_reset_token,
)
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
    )
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
    raw_plan = str(user.get("plan", "free")).lower()
    if raw_plan not in {"free", "pro", "team"}:
        raw_plan = "free"
    return UserPublic(
        id=str(user.get("_id")),
        email=user.get("email"),
        first_name=user.get("first_name", ""),
        last_name=user.get("last_name", ""),
        roles=roles,
        created_at=created_at,
        workspace_role=workspace_role,
        country=user.get("country"),
        account_type=user.get("account_type"),
        plan=raw_plan,
    )


def _dev_auth_enabled() -> bool:
    return settings.ENV != "production" and settings.DEV_AUTH_BYPASS


def _build_dev_user_doc(now: datetime) -> dict:
    account_type = str(settings.DEV_AUTH_BYPASS_ACCOUNT_TYPE or "organization").lower()
    if account_type not in {"learner", "company", "organization"}:
        account_type = "organization"
    plan = str(settings.DEV_AUTH_BYPASS_PLAN or "team").lower()
    if plan not in {"free", "pro", "team"}:
        plan = "team"
    workspace_role = str(settings.DEV_AUTH_BYPASS_WORKSPACE_ROLE or "demandeur").lower()
    if workspace_role not in {"demandeur", "prestataire"}:
        workspace_role = "demandeur"

    return {
        "email": normalize_email(settings.DEV_AUTH_BYPASS_EMAIL),
        "password_hash": hash_password(generate_session_token()),
        "first_name": (settings.DEV_AUTH_BYPASS_FIRST_NAME or "Dev").strip() or "Dev",
        "last_name": (settings.DEV_AUTH_BYPASS_LAST_NAME or "Local").strip() or "Local",
        "country": (settings.DEV_AUTH_BYPASS_COUNTRY or "TG").strip() or "TG",
        "account_type": account_type,
        "roles": ["user", "dev"],
        "plan": plan,
        "workspace_role": workspace_role,
        "created_at": now,
    }


def _public_user_pg(user: dict) -> UserPublic:
    return _public_user(user)


def _issue_session_pg(response: Response, user_id: str, request: Request) -> datetime:
    token = generate_session_token()
    expires_at = session_expiry()
    create_pg_session(
        user_id=user_id,
        token_hash=hash_token(token),
        expires_at=expires_at,
        ip=getattr(request.client, "host", None),
        ua=request.headers.get("user-agent"),
    )
    _set_session_cookie(response, token, expires_at)
    response.headers["Cache-Control"] = "no-store"
    return expires_at


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserCreate,
    response: Response,
    request: Request,
):
    email = normalize_email(payload.email)
    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "EMAIL_EXISTS", "detail": "Email deja utilise"},
        )
    user = create_pg_user(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        country=payload.country.strip(),
        account_type=payload.account_type,
    )
    expires_at = _issue_session_pg(response, str(user["id"]), request)
    return {"user": _public_user_pg(user), "session_expires_at": expires_at}


@router.post("/request-otp")
async def request_otp(
    payload: OTPRequestPayload,
):
    email = normalize_email(payload.email)
    if payload.intent == "login":
        if not get_user_by_email(email):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte introuvable. Merci de vous inscrire.")
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_TTL_MIN)
    code = _generate_otp()
    replace_otp(email=email, code_hash=hash_password(code), expires_at=expires_at, intent=payload.intent or "auto")
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
):
    email = normalize_email(payload.email)
    otp_doc = get_latest_otp(email)
    now = datetime.now(timezone.utc)
    expires_at = otp_doc.get("expires_at") if otp_doc else None
    if not otp_doc or not isinstance(expires_at, datetime) or expires_at <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expire. Merci de renvoyer un OTP.")
    if not verify_password(payload.code, otp_doc.get("code_hash") or ""):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Code invalide.")
    delete_otp(str(otp_doc["id"]))
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Compte introuvable. Merci de vous inscrire d'abord.")
    updates: dict[str, str] = {}
    if payload.first_name and not user.get("first_name"):
        updates["first_name"] = payload.first_name.strip()
    if payload.last_name and not user.get("last_name"):
        updates["last_name"] = payload.last_name.strip()
    if updates:
        user = update_user_fields(str(user["id"]), **updates) or user
    session_expires_at = _issue_session_pg(response, str(user["id"]), request)
    return {"user": _public_user_pg(user), "session_expires_at": session_expires_at}


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginPayload,
    response: Response,
    request: Request,
):
    user = get_user_by_email(normalize_email(payload.email))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
    if not verify_password(payload.password, user.get("password_hash") or ""):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identifiants invalides")
    expires_at = _issue_session_pg(response, str(user["id"]), request)
    return {"user": _public_user_pg(user), "session_expires_at": expires_at}


@router.post("/dev-login", response_model=AuthResponse)
async def dev_login(
    response: Response,
    request: Request,
):
    if not _dev_auth_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    user = upsert_dev_user(_build_dev_user_doc(datetime.now(timezone.utc)))
    expires_at = _issue_session_pg(response, str(user["id"]), request)
    return {"user": _public_user_pg(user), "session_expires_at": expires_at}


@router.get("/me", response_model=UserPublic)
async def me(current: dict = Depends(get_current_user)):
    return _public_user(current)


@router.post("/role")
async def set_workspace_role(
    payload: RoleUpdatePayload,
    current: dict = Depends(get_current_user),
):
    user = update_user_fields(str(current["_id"]), workspace_role=payload.role)
    current["workspace_role"] = payload.role
    if user:
        current.update(user)
    return {"workspace_role": payload.role}


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
):
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        revoke_session_by_token(hash_token(token))
    _clear_session_cookie(response)
    response.headers["Cache-Control"] = "no-store"
    return {"ok": True}


@router.post("/forgot")
async def forgot_password(
    payload: ForgotPasswordPayload,
    request: Request,
):
    email = normalize_email(payload.email)
    user = get_user_by_email(email)
    if not user:
        return {"ok": True}
    token = generate_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_TTL_MIN)
    create_reset_token(user_id=str(user["id"]), token_hash=hash_token(token), expires_at=expires_at)
    params = urlencode({"token": token, "email": email})
    reset_url = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/reset?{params}"
    subject = "Reinitialisation de votre mot de passe KORYXA"
    first_name = user.get("first_name", "") or "membre"
    html_body = f"<p>Bonjour {first_name},</p><p>Ouvrez ce lien : <a href=\"{reset_url}\">{reset_url}</a></p>"
    try:
        await send_email_async(subject=subject, recipient=email, html_body=html_body, text_body=reset_url)
    except Exception as exc:
        logger.warning("Failed to send password reset email: %s", exc)
    return {"ok": True}


@router.post("/reset")
async def reset_password(
    payload: ResetPasswordPayload,
    response: Response,
    request: Request,
):
    email = normalize_email(payload.email)
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token invalide ou expire")
    token_doc = get_valid_reset_token(user_id=str(user["id"]), token_hash=hash_token(payload.token))
    if not token_doc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token invalide ou expire")
    update_user_fields(str(user["id"]), password_hash=hash_password(payload.new_password))
    mark_reset_token_used(str(token_doc["id"]))
    revoke_sessions_for_user(str(user["id"]))
    _clear_session_cookie(response)
    response.headers["Cache-Control"] = "no-store"
    return {"ok": True}


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup_alias(
    payload: UserCreate,
    response: Response,
    request: Request,
):
    return await register(payload, response, request)

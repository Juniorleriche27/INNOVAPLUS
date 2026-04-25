from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, Request, status

from app.core.auth import generate_session_token, hash_password, hash_token, normalize_email
from app.core.config import settings
from app.repositories.auth_pg import get_active_session, get_user_by_id, touch_session, upsert_dev_user


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


async def _dev_bypass_user_pg() -> dict | None:
    if not _dev_auth_enabled():
        return None
    now = datetime.now(timezone.utc)
    return upsert_dev_user(_build_dev_user_doc(now))


async def get_current_user_optional(
    request: Request,
) -> dict | None:
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw_token:
        authz = (request.headers.get("authorization") or "").strip()
        if authz.lower().startswith("bearer "):
            raw_token = authz[7:].strip()
    if not raw_token:
        try:
            return await _dev_bypass_user_pg()
        except Exception:
            return None

    session = get_active_session(hash_token(raw_token))
    if not session:
        try:
            return await _dev_bypass_user_pg()
        except Exception:
            return None

    user = get_user_by_id(str(session["user_id"]))
    if not user:
        try:
            return await _dev_bypass_user_pg()
        except Exception:
            return None

    try:
        touch_session(str(session["id"]))
    except Exception:
        pass

    request.state.session = session
    return user


async def get_current_user(
    request: Request,
) -> dict:
    user = await get_current_user_optional(request)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user

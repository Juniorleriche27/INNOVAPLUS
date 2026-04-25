from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.auth import generate_session_token, hash_password, hash_token, normalize_email
from app.core.config import settings
from app.db.mongo import get_db_instance
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


async def _dev_bypass_user(db: AsyncIOMotorDatabase) -> dict | None:
    if not _dev_auth_enabled():
        return None

    now = datetime.now(timezone.utc)
    dev_doc = _build_dev_user_doc(now)
    email = dev_doc["email"]
    user = await db["users"].find_one({"email": email})
    if not user:
        res = await db["users"].insert_one(dev_doc)
        dev_doc["_id"] = res.inserted_id
        return dev_doc

    updates = {}
    for key in ("first_name", "last_name", "country", "account_type", "plan", "workspace_role"):
        if user.get(key) != dev_doc.get(key):
            updates[key] = dev_doc[key]
    existing_roles = user.get("roles") or []
    if not isinstance(existing_roles, list):
        existing_roles = [str(existing_roles)]
    merged_roles = list(dict.fromkeys([*existing_roles, "user", "dev"]))
    if merged_roles != existing_roles:
        updates["roles"] = merged_roles
    if updates:
        await db["users"].update_one({"_id": user["_id"]}, {"$set": updates})
        user.update(updates)
    return user


async def _dev_bypass_user_pg() -> dict | None:
    if not _dev_auth_enabled():
        return None
    now = datetime.now(timezone.utc)
    return upsert_dev_user(_build_dev_user_doc(now))


async def get_current_user_optional(
    request: Request,
) -> dict | None:
    if not settings.REQUIRE_MONGO:
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

    try:
        db: AsyncIOMotorDatabase = get_db_instance()
    except RuntimeError:
        return None

    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw_token:
        authz = (request.headers.get("authorization") or "").strip()
        if authz.lower().startswith("bearer "):
            raw_token = authz[7:].strip()
    if not raw_token:
        try:
            return await _dev_bypass_user(db)
        except Exception:
            return None

    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    try:
        session = await db["sessions"].find_one(
            {
                "token_hash": token_hash,
                "revoked": False,
                "expires_at": {"$gt": now},
            }
        )
    except Exception:
        return None
    if not session:
        try:
            return await _dev_bypass_user(db)
        except Exception:
            return None

    try:
        user = await db["users"].find_one(
            {"_id": ObjectId(session["user_id"]) if not isinstance(session["user_id"], ObjectId) else session["user_id"]}
        )
    except Exception:
        return None
    if not user:
        try:
            return await _dev_bypass_user(db)
        except Exception:
            return None

    try:
        await db["sessions"].update_one(
            {"_id": session["_id"]},
            {"$set": {"last_seen_at": now}}
        )
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

from __future__ import annotations

from datetime import datetime, timezone

from bson import ObjectId
from fastapi import Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.auth import hash_token
from app.core.config import settings
from app.db.mongo import get_db


async def get_current_user(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    raw_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token_hash = hash_token(raw_token)
    now = datetime.now(timezone.utc)
    session = await db["sessions"].find_one(
        {
            "token_hash": token_hash,
            "revoked": False,
            "expires_at": {"$gt": now},
        }
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expirée ou invalide")

    user = await db["users"].find_one({"_id": ObjectId(session["user_id"]) if not isinstance(session["user_id"], ObjectId) else session["user_id"]})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Utilisateur introuvable")

    # Best effort update last_seen_at (ignore failures)
    try:
        await db["sessions"].update_one(
            {"_id": session["_id"]},
            {"$set": {"last_seen_at": now}}
        )
    except Exception:
        pass

    request.state.session = session
    return user

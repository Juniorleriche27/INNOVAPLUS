from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.auth import decode_token
from app.db.mongo import get_db


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme), db: AsyncIOMotorDatabase = Depends(get_db)) -> dict:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    data = decode_token(creds.credentials)
    if not data or "sub" not in data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        uid = ObjectId(data["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid subject")
    user = await db["users"].find_one({"_id": uid})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


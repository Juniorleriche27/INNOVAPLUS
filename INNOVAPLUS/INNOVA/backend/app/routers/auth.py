from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.auth import create_access_token, hash_password, verify_password
from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.users import UserCreate, LoginPayload, AuthResponse, UserOut
from app.utils.ids import serialize_id


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db["users"].find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=422, detail="Email already used")
    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "password": hash_password(payload.password),
        "role": payload.role,
        "domain": payload.domain,
        "bio": payload.bio,
    }
    res = await db["users"].insert_one(user_doc)
    user_doc["_id"] = res.inserted_id
    token = create_access_token({"sub": str(res.inserted_id)})
    user_out = UserOut(**serialize_id(user_doc))
    return {"user": user_out, "token": token}


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginPayload, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db["users"].find_one({"email": payload.email})
    if not user or not verify_password(payload.password, user.get("password", "")):
        raise HTTPException(status_code=422, detail="Identifiants invalides")
    token = create_access_token({"sub": str(user["_id"])})
    user_out = UserOut(**serialize_id(user))
    return {"user": user_out, "token": token}


@router.get("/me", response_model=UserOut)
async def me(current: dict = Depends(get_current_user)):
    return UserOut(**serialize_id(current))


@router.post("/logout")
async def logout():
    # Stateless JWT: nothing to revoke server-side here
    return {"message": "Déconnecté"}
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup_alias(payload: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    # alias vers register pour compatibilité frontend
    return await register(payload, db)

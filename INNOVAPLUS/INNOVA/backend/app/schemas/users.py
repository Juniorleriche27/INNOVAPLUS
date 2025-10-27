from __future__ import annotations

from typing import List
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=256)
    first_name: str = Field(..., min_length=1, max_length=120)
    last_name: str = Field(..., min_length=1, max_length=120)


class LoginPayload(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=256)


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    email: EmailStr
    token: str = Field(..., min_length=16, max_length=256)
    new_password: str = Field(..., min_length=8, max_length=256)


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    roles: List[str] = Field(default_factory=list)
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserPublic
    session_expires_at: datetime

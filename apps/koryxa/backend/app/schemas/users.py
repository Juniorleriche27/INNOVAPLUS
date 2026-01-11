from __future__ import annotations

from typing import List, Optional, Literal
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=256)
    first_name: str = Field(..., min_length=1, max_length=120)
    last_name: str = Field(..., min_length=1, max_length=120)
    country: str = Field(..., min_length=2, max_length=120)
    account_type: Literal["learner", "company", "organization"]


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
    workspace_role: Optional[Literal["demandeur", "prestataire"]] = None
    country: Optional[str] = None
    account_type: Optional[Literal["learner", "company", "organization"]] = None


class OTPRequestPayload(BaseModel):
    email: EmailStr
    intent: Optional[str] = Field(default=None, description="login|register|auto")


class OTPVerifyPayload(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=8, pattern=r"^\d+$")
    first_name: Optional[str] = Field(None, max_length=120)
    last_name: Optional[str] = Field(None, max_length=120)


class RoleUpdatePayload(BaseModel):
    role: Literal["demandeur", "prestataire"]


class AuthResponse(BaseModel):
    user: UserPublic
    session_expires_at: datetime

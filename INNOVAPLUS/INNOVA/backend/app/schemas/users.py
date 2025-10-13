from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from pydantic import AliasChoices


class UserCreate(BaseModel):
    # Accept name from multiple keys: name | full_name | fullName
    name: str = Field(
        ..., min_length=1, max_length=255, validation_alias=AliasChoices("name", "full_name", "fullName")
    )
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern=r"^(user|coach)$")
    domain: Optional[str] = Field(default=None, max_length=255)
    bio: Optional[str] = Field(default=None, max_length=1000)


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    domain: Optional[str] = None
    bio: Optional[str] = None


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserOut
    token: str

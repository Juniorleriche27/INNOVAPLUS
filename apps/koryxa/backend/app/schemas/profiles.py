from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class DemandeurProfilePayload(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=140)
    organization: Optional[str] = Field(default=None, max_length=140)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(default=None, max_length=40)
    languages: List[str] = Field(default_factory=list)
    country: Optional[str] = Field(default=None, max_length=80)
    city: Optional[str] = Field(default=None, max_length=120)
    remote_ok: bool = False
    preferred_channels: List[str] = Field(default_factory=list)
    notes: Optional[str] = Field(default=None, max_length=500)
    timezone: Optional[str] = Field(default=None, max_length=64)


class PrestataireProfilePayload(BaseModel):
    display_name: str = Field(..., min_length=2, max_length=140)
    bio: str = Field(..., min_length=20, max_length=1000)
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    availability: Optional[str] = Field(default=None, max_length=200)
    availability_timezone: Optional[str] = Field(default=None, max_length=64)
    rate_min: Optional[int] = Field(default=None, ge=0)
    rate_max: Optional[int] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default="EUR", max_length=8)
    zones: List[str] = Field(default_factory=list)
    remote: bool = True
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(default=None, max_length=40)
    channels: List[str] = Field(default_factory=list)


class WorkspaceProfileResponse(BaseModel):
    user_id: str
    demandeur: Optional[DemandeurProfilePayload] = None
    prestataire: Optional[PrestataireProfilePayload] = None
    workspace_role: Optional[str] = None
    updated_at: Optional[str] = None


class TagSuggestionRequest(BaseModel):
    bio: str = Field(..., min_length=30, max_length=1200)
    max_tags: int = Field(default=6, ge=3, le=12)


class TagSuggestionResponse(BaseModel):
    suggestions: List[str]

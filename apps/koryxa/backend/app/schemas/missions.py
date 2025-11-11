from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class MissionBudget(BaseModel):
    minimum: Optional[int] = Field(default=None, ge=0)
    maximum: Optional[int] = Field(default=None, ge=0)
    currency: str = Field(default="EUR", max_length=8)


class MissionCreatePayload(BaseModel):
    title: str = Field(..., min_length=6, max_length=180)
    description: str = Field(..., min_length=60, max_length=6000)
    deliverables: str = Field(..., min_length=20, max_length=2000)
    deadline: Optional[str] = Field(default=None, max_length=80)
    duration_days: Optional[int] = Field(default=None, ge=1, le=365)
    budget: MissionBudget
    language: str = Field(default="fr", max_length=24)
    work_mode: Literal["remote", "local", "hybrid"] = "remote"
    allow_expansion: bool = False
    collect_multiple_quotes: bool = False
    location_hint: Optional[str] = Field(default=None, max_length=140)


class MissionWaveRequest(BaseModel):
    wave_size: int = Field(default=5, ge=1, le=25)
    top_n: int = Field(default=20, ge=3, le=80)
    timeout_minutes: int = Field(default=10, ge=5, le=180)
    channel: Literal["email", "whatsapp", "both"] = "email"


class OfferResponsePayload(BaseModel):
    action: Literal["accept", "refuse"]
    comment: Optional[str] = Field(default=None, max_length=500)


class ConfirmSelectionPayload(BaseModel):
    offer_id: str
    notes: Optional[str] = Field(default=None, max_length=500)


class MissionMessagePayload(BaseModel):
    text: str = Field(..., min_length=1, max_length=1200)
    attachment: Optional[str] = Field(default=None, max_length=512)


class MissionMilestonePayload(BaseModel):
    title: str = Field(..., min_length=4, max_length=160)
    due_date: Optional[str] = Field(default=None, max_length=64)
    notes: Optional[str] = Field(default=None, max_length=300)


class MilestoneUpdatePayload(BaseModel):
    status: Literal["todo", "in_progress", "delivered", "validated"]
    notes: Optional[str] = Field(default=None, max_length=300)


class DashboardFilters(BaseModel):
    window_days: int = Field(default=30, ge=7, le=365)


class MissionClosePayload(BaseModel):
    rating_demandeur: Optional[int] = Field(default=None, ge=1, le=5)
    rating_prestataire: Optional[int] = Field(default=None, ge=1, le=5)
    feedback: Optional[str] = Field(default=None, max_length=600)

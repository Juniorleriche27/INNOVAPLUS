from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


class TrajectoryOnboardingPayload(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    objective: str = Field(..., min_length=8, max_length=280)
    current_level: str = Field(..., min_length=2, max_length=64)
    domain_interest: str = Field(..., min_length=2, max_length=120)
    weekly_rhythm: str = Field(..., min_length=2, max_length=64)
    target_outcome: str | None = Field(default=None, max_length=180)
    context: str | None = Field(default=None, max_length=500)
    constraints: List[str] = Field(default_factory=list, max_length=8)
    preferences: List[str] = Field(default_factory=list, max_length=8)


class TrajectoryProgressUpdatePayload(BaseModel):
    step_key: str = Field(..., min_length=2, max_length=80)
    status: Literal["todo", "in_progress", "done"]
    proof: str | None = Field(default=None, max_length=280)


class TrajectoryResource(BaseModel):
    type: str
    label: str
    reason: str


class TrajectoryStep(BaseModel):
    key: str
    title: str
    status: Literal["todo", "in_progress", "done"]
    detail: str
    proof: str | None = None


class TrajectoryReadiness(BaseModel):
    score: int
    label: str
    validation_status: str


class TrajectoryRecommendation(BaseModel):
    title: str
    rationale: str
    mission_focus: str


class TrajectoryDiagnostic(BaseModel):
    profile_summary: str
    recommended_trajectory: TrajectoryRecommendation
    recommended_resources: List[TrajectoryResource]
    next_steps: List[str]
    readiness: TrajectoryReadiness
    target_opportunities: List[str]
    progress_steps: List[TrajectoryStep]


class TrajectoryFlowResponse(BaseModel):
    flow_id: str
    guest_id: str
    status: str
    onboarding: TrajectoryOnboardingPayload
    diagnostic: TrajectoryDiagnostic | None = None
    created_at: datetime
    updated_at: datetime

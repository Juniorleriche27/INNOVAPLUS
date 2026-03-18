from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


class EnterpriseNeedCreatePayload(BaseModel):
    organisation: str = Field(..., min_length=2, max_length=160)
    country: str = Field(..., min_length=2, max_length=120)
    domain: str = Field(..., min_length=2, max_length=120)
    title: str = Field(..., min_length=4, max_length=180)
    description: str = Field(..., min_length=12, max_length=3000)
    context: str = Field(..., min_length=8, max_length=2000)
    expected_deliverable: str = Field(..., min_length=4, max_length=240)
    need_type: str = Field(..., min_length=2, max_length=80)
    urgency: str = Field(..., min_length=2, max_length=40)
    treatment_mode: Literal["prive", "publie", "accompagne"]
    contact: str = Field(..., min_length=4, max_length=180)


class EnterpriseNeedResponse(BaseModel):
    id: str
    title: str
    organisation: str
    country: str
    domain: str
    description: str
    context: str
    expected_deliverable: str
    need_type: str
    urgency: str
    treatment_mode: str
    status: str
    qualification_score: int
    clarity_level: str
    structured_summary: str
    created_at: datetime


class EnterpriseMissionResponse(BaseModel):
    id: str
    need_id: str
    title: str
    summary: str
    deliverable: str
    execution_mode: str
    status: str
    steps: List[str]
    created_at: datetime


class EnterpriseOpportunityResponse(BaseModel):
    id: str
    need_id: str
    mission_id: str
    title: str
    summary: str
    status: str
    highlights: List[str]
    published_at: datetime | None = None


class EnterpriseSubmissionResponse(BaseModel):
    need: EnterpriseNeedResponse
    mission: EnterpriseMissionResponse
    opportunity: EnterpriseOpportunityResponse | None = None


class EnterpriseOpportunityListResponse(BaseModel):
    items: List[EnterpriseOpportunityResponse]

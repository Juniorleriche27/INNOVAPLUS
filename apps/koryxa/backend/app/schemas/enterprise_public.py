from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


EnterpriseNeedStatus = Literal["draft", "submitted", "qualified", "published", "in_progress", "done", "archived"]
EnterpriseMissionStatus = Literal["draft", "structured", "ready", "in_progress", "done", "archived"]
EnterpriseOpportunityStatus = Literal["published", "closed", "archived"]
EnterpriseOpportunityType = Literal["mission", "stage", "collaboration", "project", "accompagnement"]
TaskStatus = Literal["todo", "in_progress", "done"]


class EnterpriseNeedCreatePayload(BaseModel):
    primary_goal: str = Field(..., min_length=2, max_length=120)
    need_type: str = Field(..., min_length=2, max_length=120)
    expected_result: str = Field(..., min_length=2, max_length=180)
    urgency: str = Field(..., min_length=2, max_length=40)
    treatment_preference: str = Field(..., min_length=2, max_length=120)
    team_context: str = Field(..., min_length=2, max_length=120)
    support_preference: str = Field(..., min_length=2, max_length=120)
    short_brief: str | None = Field(default=None, max_length=500)


class EnterpriseNeedResponse(BaseModel):
    id: str
    title: str
    primary_goal: str
    need_type: str
    expected_result: str
    urgency: str
    treatment_preference: str
    recommended_treatment_mode: Literal["prive", "publie", "accompagne"]
    team_context: str
    support_preference: str
    short_brief: str | None = None
    status: EnterpriseNeedStatus
    qualification_score: int
    clarity_level: str
    structured_summary: str
    next_recommended_action: str
    created_at: datetime


class EnterpriseMissionResponse(BaseModel):
    id: str
    need_id: str
    title: str
    summary: str
    deliverable: str
    execution_mode: str
    status: EnterpriseMissionStatus
    steps: List[str]
    created_at: datetime


class EnterpriseOpportunityResponse(BaseModel):
    id: str
    need_id: str
    mission_id: str
    type: EnterpriseOpportunityType
    title: str
    summary: str
    status: EnterpriseOpportunityStatus
    highlights: List[str]
    published_at: datetime | None = None


class EnterpriseSubmissionResponse(BaseModel):
    need: EnterpriseNeedResponse
    mission: EnterpriseMissionResponse
    opportunity: EnterpriseOpportunityResponse | None = None


class EnterpriseOpportunityListResponse(BaseModel):
    items: List[EnterpriseOpportunityResponse]


class EnterpriseCockpitTaskQuery(BaseModel):
    context_type: Literal["professional"]
    context_id: str


class EnterpriseCockpitExecutionStep(BaseModel):
    step_key: str
    title: str
    description: str
    myplanning_task_id: str | None = None
    status: TaskStatus = "todo"


class EnterpriseCockpitBindingSummary(BaseModel):
    binding_count: int = 0


class EnterpriseCockpitActivationResponse(BaseModel):
    status: Literal["ready", "auth_required"]
    need_id: str
    context_id: str
    task_query: EnterpriseCockpitTaskQuery
    redirect_url: str
    binding_count: int = 0
    created_task_count: int = 0


class EnterpriseCockpitContextResponse(BaseModel):
    need_id: str
    context_id: str
    task_query: EnterpriseCockpitTaskQuery
    need: EnterpriseNeedResponse
    mission: EnterpriseMissionResponse
    opportunity: EnterpriseOpportunityResponse | None = None
    next_actions: List[str] = Field(default_factory=list)
    execution_steps: List[EnterpriseCockpitExecutionStep] = Field(default_factory=list)
    binding_summary: EnterpriseCockpitBindingSummary

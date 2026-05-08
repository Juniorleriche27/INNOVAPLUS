from __future__ import annotations

from datetime import datetime
from typing import Any, List, Literal

from pydantic import BaseModel, Field


ResourceType = Literal["document", "notebook", "dataset", "video", "article"]


class FormationTrackResponse(BaseModel):
    id: str
    track_key: str
    title: str
    summary: str
    description: str
    domain: str | None = None
    difficulty: str | None = None
    estimated_duration: str | None = None
    skills: List[str] = Field(default_factory=list)
    module_count: int = 0
    created_at: datetime
    updated_at: datetime


class FormationResourceResponse(BaseModel):
    id: str
    module_id: str
    title: str
    url: str
    resource_type: ResourceType
    description: str | None = None
    order_index: int
    created_at: datetime


class FormationModuleResponse(BaseModel):
    id: str
    track_id: str
    track_key: str
    module_key: str
    title: str
    description: str
    order_index: int
    duration: str | None = None
    notebook_path: str | None = None
    lesson_count: int = 0
    skills: List[str] = Field(default_factory=list)
    is_published: bool = True
    created_at: datetime
    updated_at: datetime
    resources: List[FormationResourceResponse] = Field(default_factory=list)


class FormationTrackDetailResponse(FormationTrackResponse):
    modules: List[FormationModuleResponse] = Field(default_factory=list)


class FormationProgressItemResponse(BaseModel):
    module_id: str
    module_key: str
    completed: bool
    completed_at: datetime | None = None


class FormationProgressResponse(BaseModel):
    track_key: str
    total_modules: int
    completed_modules: int
    percentage: float
    items: List[FormationProgressItemResponse] = Field(default_factory=list)


class FormationProgressUpdatePayload(BaseModel):
    module_id: str
    completed: bool


class FormationCertificateResponse(BaseModel):
    id: str
    user_id: str
    track_id: str
    track_key: str
    issued_at: datetime
    certificate_url: str | None = None


from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field


class SkillTag(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    name: str
    slug: str


class CertificateProgram(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    title: str
    slug: str
    short_label: Optional[str] = None
    description: Optional[str] = None
    category: str
    is_paid: bool = False
    price: Optional[float] = None
    estimated_duration: Optional[str] = None
    status: str = "draft"
    required_evidence_types: List[str] = []
    skills: List[str] = Field(default_factory=list, description="List of skill tag slugs")


class CertificateModule(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    certificate_id: str
    title: str
    description: Optional[str] = None
    order_index: int = 0


class Lesson(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    module_id: str
    title: str
    lesson_type: str
    order_index: int = 0
    summary: Optional[str] = None


class ContentResource(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    lesson_id: str
    resource_type: str
    url: Optional[str] = None
    content_text: Optional[str] = None
    reading_time_minutes: Optional[int] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class CertificateEnrollment(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    user_id: str
    certificate_id: str
    enrollment_date: str
    status: str = "in_progress"
    progress_percent: float = 0.0


class LessonProgress(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    enrollment_id: str
    lesson_id: str
    status: str
    last_viewed_at: Optional[str] = None


class Evidence(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    certificate_id: str
    user_id: str
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    status: str = "submitted"
    reviewer_id: Optional[str] = None
    review_comment: Optional[str] = None


class IssuedCertificate(BaseModel):
    model_config = {"populate_by_name": True}
    id: str = Field(alias="_id")
    user_id: str
    certificate_id: str
    issued_at: str
    verification_code: str
    status: str = "valid"

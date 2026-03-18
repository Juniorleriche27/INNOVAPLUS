from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, Field


ProofType = Literal[
    "link",
    "file",
    "short_text",
    "structured_answer",
    "mini_deliverable",
    "screenshot",
    "project_submission",
    "summary_note",
]
TaskStatus = Literal["todo", "in_progress", "done"]
AccessLevel = Literal["free", "premium"]


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
    status: TaskStatus
    proof: str | None = Field(default=None, max_length=280)


class TrajectoryProofCreatePayload(BaseModel):
    stage_key: str = Field(..., min_length=2, max_length=80)
    task_key: str = Field(..., min_length=2, max_length=80)
    proof_type: ProofType
    value: str = Field(..., min_length=3, max_length=4000)
    summary: str | None = Field(default=None, max_length=600)


class TrajectoryResource(BaseModel):
    type: str
    label: str
    reason: str


class TrajectoryPartnerRecommendation(BaseModel):
    type: Literal["organisme", "plateforme", "coach"]
    label: str
    reason: str
    match_score: int
    formats: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    price_hint: str | None = None
    proof_fit: List[ProofType] = Field(default_factory=list)


class TrajectoryReadiness(BaseModel):
    initial_score: int
    progress_score: int
    readiness_score: int
    label: str
    validation_status: Literal["initial", "in_progress", "validated"]
    validation_level: Literal["initial", "building", "validated", "advanced"]


class TrajectoryRecommendation(BaseModel):
    title: str
    rationale: str
    mission_focus: str


class TrajectoryTask(BaseModel):
    key: str
    title: str
    description: str
    status: TaskStatus
    proof_required: bool = False
    expected_proof_types: List[ProofType] = Field(default_factory=list)
    access_level: AccessLevel = "free"
    feature_gate: str | None = None
    proof_count: int = 0
    validated_proof_count: int = 0
    next_action: str | None = None


class TrajectoryStage(BaseModel):
    key: str
    title: str
    objective: str
    order: int
    status: TaskStatus
    access_level: AccessLevel = "free"
    tasks: List[TrajectoryTask] = Field(default_factory=list)


class TrajectoryProgressPlan(BaseModel):
    title: str
    target_goal: str
    access_level: AccessLevel = "free"
    plan_tier: str = "starter"
    skills_to_cover: List[str] = Field(default_factory=list)
    stages: List[TrajectoryStage] = Field(default_factory=list)
    milestones: List[str] = Field(default_factory=list)
    next_actions: List[str] = Field(default_factory=list)
    progress_score: int
    readiness_score: int
    validation_level: Literal["initial", "building", "validated", "advanced"]


class TrajectoryOpportunityCriteria(BaseModel):
    minimum_readiness_score: int
    minimum_validated_proofs: int
    minimum_validation_level: Literal["initial", "building", "validated", "advanced"]


class TrajectoryOpportunityTarget(BaseModel):
    label: str
    type: Literal["mission", "stage", "collaboration", "project", "accompagnement"]
    reason: str
    visibility_status: Literal["recommended", "unlocked", "prioritized"]
    criteria: TrajectoryOpportunityCriteria


class TrajectoryProofItem(BaseModel):
    proof_id: str
    stage_key: str
    task_key: str
    proof_type: ProofType
    value: str
    summary: str | None = None
    status: Literal["declared", "submitted", "reviewed", "validated", "rejected"]
    impact_note: str | None = None
    submitted_at: datetime
    validated_at: datetime | None = None


class TrajectoryVerifiedProfile(BaseModel):
    profile_status: Literal["not_ready", "eligible", "verified"]
    progress_score: int
    readiness_score: int
    validation_level: Literal["initial", "building", "validated", "advanced"]
    validated_proof_count: int
    minimum_validated_proofs: int
    minimum_readiness_score: int
    shareable_headline: str
    summary: str
    included_fields: List[str] = Field(default_factory=list)


class TrajectoryDiagnostic(BaseModel):
    profile_summary: str
    recommended_trajectory: TrajectoryRecommendation
    recommended_resources: List[TrajectoryResource]
    recommended_partners: List[TrajectoryPartnerRecommendation]
    next_steps: List[str]
    readiness: TrajectoryReadiness


class TrajectoryFlowResponse(BaseModel):
    flow_id: str
    guest_id: str
    status: str
    onboarding: TrajectoryOnboardingPayload
    diagnostic: TrajectoryDiagnostic | None = None
    progress_plan: TrajectoryProgressPlan | None = None
    proofs: List[TrajectoryProofItem] = Field(default_factory=list)
    verified_profile: TrajectoryVerifiedProfile | None = None
    opportunity_targets: List[TrajectoryOpportunityTarget] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

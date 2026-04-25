from __future__ import annotations

from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, EmailStr, Field


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
    objective: str = Field(..., min_length=8, max_length=400)
    current_level: str = Field(..., min_length=2, max_length=64)
    domain_interest: str = Field(..., min_length=2, max_length=120)
    weekly_rhythm: str = Field(..., min_length=2, max_length=64)
    target_outcome: str | None = Field(default=None, max_length=180)
    context: str | None = Field(default=None, max_length=1200)
    constraints: List[str] = Field(default_factory=list, max_length=8)
    preferences: List[str] = Field(default_factory=list, max_length=12)
    current_status: str | None = Field(default=None, max_length=120)
    current_role: str | None = Field(default=None, max_length=160)
    target_roles: List[str] = Field(default_factory=list, max_length=4)
    existing_skills: List[str] = Field(default_factory=list, max_length=12)
    portfolio_status: str | None = Field(default=None, max_length=120)
    target_timeline: str | None = Field(default=None, max_length=80)
    learning_style: str | None = Field(default=None, max_length=120)
    support_style: str | None = Field(default=None, max_length=120)
    language_preference: str | None = Field(default=None, max_length=60)
    motivation_driver: str | None = Field(default=None, max_length=160)
    project_topic: str | None = Field(default=None, max_length=280)
    success_metric: str | None = Field(default=None, max_length=280)
    exercise_results: List[str] = Field(default_factory=list, max_length=12)


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


class TrajectoryCockpitTaskQuery(BaseModel):
    context_type: Literal["professional"]
    context_id: str


class TrajectoryCockpitTaskBinding(BaseModel):
    stage_key: str
    task_key: str
    title: str
    description: str
    proof_required: bool = False
    expected_proof_types: List[ProofType] = Field(default_factory=list)
    proof_count: int = 0
    validated_proof_count: int = 0
    next_action: str | None = None
    feature_gate: str | None = None


class TrajectoryCockpitStage(BaseModel):
    key: str
    title: str
    objective: str
    status: TaskStatus
    tasks: List[TrajectoryCockpitTaskBinding] = Field(default_factory=list)


class TrajectoryCockpitBindingSummary(BaseModel):
    binding_count: int = 0
    proof_required_count: int = 0


class TrajectoryCockpitActivationResponse(BaseModel):
    status: Literal["ready", "auth_required"]
    flow_id: str
    context_id: str
    task_query: TrajectoryCockpitTaskQuery
    redirect_url: str
    binding_count: int = 0
    created_task_count: int = 0


class TrajectoryCockpitContextResponse(BaseModel):
    flow_id: str
    context_id: str
    task_query: TrajectoryCockpitTaskQuery
    profile_summary: str
    recommended_trajectory: TrajectoryRecommendation
    recommended_partners: List[TrajectoryPartnerRecommendation] = Field(default_factory=list)
    next_actions: List[str] = Field(default_factory=list)
    benefits: List[str] = Field(default_factory=list)
    readiness: TrajectoryReadiness
    verified_profile: TrajectoryVerifiedProfile | None = None
    opportunity_targets: List[TrajectoryOpportunityTarget] = Field(default_factory=list)
    latest_proofs: List[TrajectoryProofItem] = Field(default_factory=list)
    execution_stages: List[TrajectoryCockpitStage] = Field(default_factory=list)
    binding_summary: TrajectoryCockpitBindingSummary


class TrajectoryDiagnostic(BaseModel):
    profile_summary: str
    recommended_trajectory: TrajectoryRecommendation
    recommended_resources: List[TrajectoryResource]
    recommended_partners: List[TrajectoryPartnerRecommendation]
    next_steps: List[str]
    readiness: TrajectoryReadiness


class TrajectoryFinalRecommendation(BaseModel):
    headline: str
    summary: str
    training_path_title: str
    training_path_steps: List[str] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list)


class TrajectoryLeadSubmitPayload(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=120)
    last_name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    whatsapp_country_code: str = Field(..., min_length=1, max_length=8)
    whatsapp_number: str = Field(..., min_length=6, max_length=32)


class TrajectoryFlowResponse(BaseModel):
    flow_id: str
    guest_id: str
    status: str
    onboarding: TrajectoryOnboardingPayload
    diagnostic: TrajectoryDiagnostic | None = None
    progress_plan: TrajectoryProgressPlan | None = None
    final_recommendation: TrajectoryFinalRecommendation | None = None
    submitted_to_team: bool = False
    proofs: List[TrajectoryProofItem] = Field(default_factory=list)
    verified_profile: TrajectoryVerifiedProfile | None = None
    opportunity_targets: List[TrajectoryOpportunityTarget] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

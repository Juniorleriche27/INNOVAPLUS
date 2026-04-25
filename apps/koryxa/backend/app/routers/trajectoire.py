from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.public_access import ensure_guest_id, get_guest_id
from app.deps.auth import get_current_user, get_current_user_optional
from app.repositories.trajectory_pg import (
    claim_flow_for_user,
    create_binding,
    create_flow,
    get_flow_for_guest,
    get_flow_for_user,
    list_bindings,
    mark_flow_enrolled,
    submit_flow_lead,
    update_flow_state,
)
from app.schemas.partner_public import PublicPartnerListResponse
from app.schemas.trajectory import (
    TrajectoryCockpitActivationResponse,
    TrajectoryCockpitContextResponse,
    TrajectoryFlowResponse,
    TrajectoryLeadSubmitPayload,
    TrajectoryOnboardingPayload,
    TrajectoryProofCreatePayload,
    TrajectoryProgressUpdatePayload,
)
from app.services.partner_registry import DEFAULT_PARTNERS, list_public_partners
from app.services.trajectory_service import (
    BlueprintAIGenerationError,
    build_trajectory_execution_stages,
    build_trajectory_experience,
    compute_blueprint_certificate,
    compute_sprint,
    create_proof_submission,
    recompute_trajectory_state,
    trajectory_context_id,
    trajectory_result_benefits,
    trajectory_result_next_actions,
)
router = APIRouter(prefix="/trajectoire", tags=["trajectoire"])


def _serialize_flow(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "flow_id": str(doc["_id"]),
        "guest_id": doc.get("guest_id") or "",
        "status": doc.get("status") or "draft",
        "onboarding": doc.get("onboarding") or {},
        "diagnostic": doc.get("diagnostic"),
        "progress_plan": doc.get("progress_plan"),
        "final_recommendation": doc.get("final_recommendation"),
        "submitted_to_team": bool(doc.get("submitted_to_team", False)),
        "proofs": list(doc.get("proofs") or []),
        "verified_profile": doc.get("verified_profile"),
        "opportunity_targets": list(doc.get("opportunity_targets") or []),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }


def _find_task(plan: dict[str, Any], task_key: str) -> dict[str, Any] | None:
    for stage in plan.get("stages") or []:
        for task in stage.get("tasks") or []:
            if task.get("key") == task_key:
                return task
    return None


def _cockpit_url(flow_id: str, context_id: str) -> str:
    return f"/trajectoire/espace?flow_id={flow_id}&context_id={context_id}"


def _cockpit_login_url(flow_id: str, context_id: str) -> str:
    return _cockpit_url(flow_id, context_id)


async def _resolve_flow(
    flow_id: str,
    request: Request,
    response: Response | None,
    current: dict | None,
) -> dict[str, Any]:
    guest_id = get_guest_id(request)

    if current:
        flow = get_flow_for_user(flow_id, str(current["_id"]))
        if flow:
            return flow
        if guest_id:
            flow = get_flow_for_guest(flow_id, guest_id)
            if flow and not flow.get("user_id"):
                claimed = claim_flow_for_user(flow_id, str(current["_id"]))
                if claimed:
                    return claimed
        flow = claim_flow_for_user(flow_id, str(current["_id"]))
        if flow:
            return flow
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")

    resolved_guest_id = ensure_guest_id(request, response) if response is not None else guest_id
    if not resolved_guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    flow = get_flow_for_guest(flow_id, resolved_guest_id)
    if not flow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flow trajectoire introuvable")
    return flow


async def _ensure_cockpit_bindings(
    flow: dict[str, Any],
    current: dict,
) -> tuple[str, dict[str, dict[str, Any]], int]:
    context_id = trajectory_context_id(str(flow["_id"]))
    existing = list_bindings(str(flow["_id"]), str(current["_id"]))
    binding_map = {str(item.get("koryxa_task_key") or ""): item for item in existing}
    created_task_count = 0
    now = datetime.now(timezone.utc)

    for stage in flow.get("progress_plan", {}).get("stages") or []:
        for task_index, task in enumerate(stage.get("tasks") or []):
            task_key = str(task.get("key") or "")
            if not task_key:
                continue
            binding = binding_map.get(task_key)
            if binding:
                continue

            created_task_count += 1
            binding_doc = {
                "flow_id": flow["_id"],
                "user_id": current["_id"],
                "context_id": context_id,
                "koryxa_stage_key": str(stage.get("key") or ""),
                "koryxa_task_key": task_key,
                "proof_required": bool(task.get("proof_required", False)),
                "feature_gate": str(task.get("feature_gate") or "") or None,
                "created_at": now,
                "updated_at": now,
            }
            created = create_binding(
                flow_id=str(flow["_id"]),
                user_id=str(current["_id"]),
                context_id=context_id,
                stage_key=str(stage.get("key") or ""),
                task_key=task_key,
                proof_required=bool(task.get("proof_required", False)),
                feature_gate=str(task.get("feature_gate") or "") or None,
                now=now,
            )
            if created:
                binding_doc["_id"] = created["id"]
        binding_map[task_key] = binding_doc

    return context_id, binding_map, created_task_count


def _serialize_cockpit_context(
    flow: dict[str, Any],
    context_id: str,
    binding_map: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    diagnostic = flow.get("diagnostic") or {}
    readiness = (diagnostic.get("readiness") or {})
    def _proof_sort_key(item: dict[str, Any]) -> datetime:
        submitted_at = item.get("submitted_at")
        if isinstance(submitted_at, datetime):
            return submitted_at
        try:
            return datetime.fromisoformat(str(submitted_at).replace("Z", "+00:00"))
        except Exception:
            return datetime.min.replace(tzinfo=timezone.utc)

    latest_proofs = sorted(
        list(flow.get("proofs") or []),
        key=_proof_sort_key,
        reverse=True,
    )[:5]
    execution_stages = build_trajectory_execution_stages(flow, binding_map=binding_map)
    proof_required_count = sum(
        1
        for stage in execution_stages
        for task in stage.get("tasks") or []
        if task.get("proof_required")
    )
    return {
        "flow_id": str(flow["_id"]),
        "context_id": context_id,
        "task_query": {"context_type": "professional", "context_id": context_id},
        "profile_summary": diagnostic.get("profile_summary") or "",
        "recommended_trajectory": diagnostic.get("recommended_trajectory") or {},
        "recommended_partners": list(diagnostic.get("recommended_partners") or []),
        "next_actions": trajectory_result_next_actions(flow, limit=3),
        "benefits": trajectory_result_benefits(flow, limit=3),
        "readiness": readiness,
        "verified_profile": flow.get("verified_profile"),
        "opportunity_targets": list(flow.get("opportunity_targets") or []),
        "latest_proofs": latest_proofs,
        "execution_stages": execution_stages,
        "binding_summary": {
            "binding_count": len(binding_map),
            "proof_required_count": proof_required_count,
        },
    }


@router.post("/onboarding", response_model=TrajectoryFlowResponse, status_code=status.HTTP_201_CREATED)
async def create_trajectory_onboarding(
    payload: TrajectoryOnboardingPayload,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    now = datetime.now(timezone.utc)
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    doc = create_flow(
        guest_id=guest_id,
        user_id=str(current["_id"]) if current else None,
        onboarding=payload.model_dump(),
        status="onboarded",
        now=now,
    )
    return _serialize_flow(doc)


def _build_final_recommendation(flow: dict[str, Any]) -> dict[str, Any]:
    diagnostic = flow.get("diagnostic") or {}
    progress_plan = flow.get("progress_plan") or {}
    recommended = diagnostic.get("recommended_trajectory") or {}
    return {
        "headline": str(recommended.get("title") or "Parcours Formation IA recommandé"),
        "summary": str(diagnostic.get("profile_summary") or "Votre diagnostic Formation IA est prêt."),
        "training_path_title": str(progress_plan.get("title") or recommended.get("title") or "Parcours recommandé"),
        "training_path_steps": [
            str(stage.get("title") or "").strip()
            for stage in (progress_plan.get("stages") or [])[:5]
            if str(stage.get("title") or "").strip()
        ],
        "next_steps": [
            str(item).strip()
            for item in (diagnostic.get("next_steps") or progress_plan.get("next_actions") or [])[:3]
            if str(item).strip()
        ],
    }


@router.post("/diagnostic", response_model=TrajectoryFlowResponse)
async def create_trajectory_diagnostic(
    payload: dict[str, str],
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    flow_id = (payload.get("flow_id") or "").strip()
    if not flow_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="flow_id requis")

    flow = await _resolve_flow(flow_id, request, response, current)
    partner_catalog = DEFAULT_PARTNERS
    try:
        experience = await build_trajectory_experience(flow.get("onboarding") or {}, partner_catalog=partner_catalog)
    except BlueprintAIGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    now = datetime.now(timezone.utc)
    update_doc = {
        "diagnostic": experience["diagnostic"],
        "progress_plan": experience["progress_plan"],
        "final_recommendation": _build_final_recommendation(experience),
        "proofs": experience["proofs"],
        "verified_profile": experience["verified_profile"],
        "opportunity_targets": experience["opportunity_targets"],
        "status": "diagnosed",
        "updated_at": now,
    }
    update_flow_state(
        str(flow["_id"]),
        diagnostic=experience["diagnostic"],
        progress_plan=experience["progress_plan"],
        final_recommendation=update_doc["final_recommendation"],
        proofs=experience["proofs"],
        verified_profile=experience["verified_profile"],
        opportunity_targets=experience["opportunity_targets"],
        status="diagnosed",
        updated_at=now,
    )
    flow.update(update_doc)
    return _serialize_flow(flow)


@router.get("/partners/public", response_model=PublicPartnerListResponse)
async def list_trajectory_partners(
):
    return {"items": DEFAULT_PARTNERS}


@router.get("/flows/{flow_id}", response_model=TrajectoryFlowResponse)
async def get_trajectory_flow(
    flow_id: str,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    flow = await _resolve_flow(flow_id, request, response, current)

    if flow.get("diagnostic") and flow.get("progress_plan"):
        refreshed = recompute_trajectory_state(flow)
        refreshed["updated_at"] = datetime.now(timezone.utc)
        update_flow_state(
            str(flow["_id"]),
            diagnostic=refreshed["diagnostic"],
            progress_plan=refreshed["progress_plan"],
            final_recommendation=_build_final_recommendation(refreshed),
            proofs=refreshed["proofs"],
            verified_profile=refreshed["verified_profile"],
            opportunity_targets=refreshed["opportunity_targets"],
            status=refreshed["status"],
            updated_at=refreshed["updated_at"],
        )
        flow = refreshed
    return _serialize_flow(flow)


@router.post("/flows/{flow_id}/submit-contact")
async def submit_trajectory_contact(
    flow_id: str,
    payload: TrajectoryLeadSubmitPayload,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    flow = await _resolve_flow(flow_id, request, response, current)
    if not flow.get("diagnostic") or not flow.get("progress_plan"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le diagnostic doit être généré avant l'envoi.")
    submitted_at = datetime.now(timezone.utc)
    submit_flow_lead(
        flow_id=str(flow["_id"]),
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=str(payload.email).strip().lower(),
        whatsapp_country_code=payload.whatsapp_country_code.strip(),
        whatsapp_number=payload.whatsapp_number.strip(),
        submitted_at=submitted_at,
    )
    return {"ok": True, "flow_id": str(flow["_id"]), "submitted_to_team": True}


@router.patch("/flows/{flow_id}/progress", response_model=TrajectoryFlowResponse)
async def update_trajectory_progress(
    flow_id: str,
    payload: TrajectoryProgressUpdatePayload,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="La logique apr?s diagnostic est supprim?e. Utilisez l'envoi des coordonn?es.")

@router.post("/flows/{flow_id}/proofs", response_model=TrajectoryFlowResponse)
async def submit_trajectory_proof(
    flow_id: str,
    payload: TrajectoryProofCreatePayload,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Les preuves apr?s diagnostic sont supprim?es.")

@router.post("/flows/{flow_id}/cockpit", response_model=TrajectoryCockpitActivationResponse)
async def activate_trajectory_cockpit(
    flow_id: str,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Le cockpit apr?s diagnostic est supprim?.")

@router.get("/flows/{flow_id}/cockpit", response_model=TrajectoryCockpitContextResponse)
async def get_trajectory_cockpit_context(
    flow_id: str,
    request: Request,
    current: dict = Depends(get_current_user),
):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Le contexte cockpit est supprim?.")

@router.get("/flows/{flow_id}/sprint")
async def get_blueprint_sprint(
    flow_id: str,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Le sprint apr?s diagnostic est supprim?.")

@router.get("/flows/{flow_id}/certificate")
async def get_blueprint_certificate(
    flow_id: str,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
) -> dict[str, Any]:
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Le certificat apr?s diagnostic est supprim?.")

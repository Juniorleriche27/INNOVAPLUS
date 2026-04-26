from __future__ import annotations

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.config import settings
from app.services.core_context_adapter import (
    get_guest_enterprise_summary,
    get_guest_summary,
    get_guest_trajectory_summary,
    get_user_chatlaya_entitlement,
    get_user_enterprise_summary,
    get_user_summary,
    get_user_trajectory_summary,
)


def _require_internal_token(x_internal_token: str | None = Header(default=None)) -> None:
    configured = (settings.INTERNAL_API_TOKEN or "").strip()
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Internal API token not configured",
        )
    provided = (x_internal_token or "").strip()
    if not provided or not hmac.compare_digest(provided, configured):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


router = APIRouter(
    prefix="/internal/core",
    tags=["internal-core"],
    dependencies=[Depends(_require_internal_token)],
)


@router.get("/users/{user_id}/summary")
def get_internal_user_summary(user_id: str):
    summary = get_user_summary(user_id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return summary


@router.get("/guests/{guest_id}/summary")
def get_internal_guest_summary(guest_id: str):
    return get_guest_summary(guest_id)


@router.get("/users/{user_id}/trajectory-summary")
def get_internal_user_trajectory_summary(user_id: str):
    summary = get_user_trajectory_summary(user_id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trajectory summary not found")
    return summary


@router.get("/guests/{guest_id}/trajectory-summary")
def get_internal_guest_trajectory_summary(guest_id: str):
    summary = get_guest_trajectory_summary(guest_id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trajectory summary not found")
    return summary


@router.get("/users/{user_id}/enterprise-summary")
def get_internal_user_enterprise_summary(user_id: str):
    summary = get_user_enterprise_summary(user_id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enterprise summary not found")
    return summary


@router.get("/guests/{guest_id}/enterprise-summary")
def get_internal_guest_enterprise_summary(guest_id: str):
    summary = get_guest_enterprise_summary(guest_id)
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enterprise summary not found")
    return summary


@router.get("/users/{user_id}/entitlements/chatlaya")
def get_internal_user_chatlaya_entitlement(user_id: str):
    entitlement = get_user_chatlaya_entitlement(user_id)
    if not entitlement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return entitlement

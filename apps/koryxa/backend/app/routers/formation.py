from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps.auth import get_current_user
from app.repositories.formation_pg import (
    get_module_by_id,
    get_track_by_key,
    get_user_certificate,
    list_public_tracks,
    list_track_modules,
    list_user_progress,
    maybe_issue_certificate,
    upsert_user_progress,
)
from app.schemas.formation import (
    FormationCertificateResponse,
    FormationModuleResponse,
    FormationProgressResponse,
    FormationProgressUpdatePayload,
    FormationTrackDetailResponse,
    FormationTrackResponse,
)


router = APIRouter(prefix="/trajectoire", tags=["formation"])


@router.get("/tracks", response_model=list[FormationTrackResponse])
async def get_public_tracks():
    return [FormationTrackResponse(**item) for item in list_public_tracks()]


@router.get("/tracks/{track_key}", response_model=FormationTrackDetailResponse)
async def get_track_detail(track_key: str):
    track = get_track_by_key(track_key)
    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parcours introuvable")
    modules = list_track_modules(track_key)
    return FormationTrackDetailResponse(**track, modules=[FormationModuleResponse(**item) for item in modules])


@router.get("/tracks/{track_key}/modules", response_model=list[FormationModuleResponse])
async def get_track_modules(track_key: str):
    track = get_track_by_key(track_key)
    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parcours introuvable")
    return [FormationModuleResponse(**item) for item in list_track_modules(track_key)]


@router.get("/modules/{module_id}", response_model=FormationModuleResponse)
async def get_module_detail(module_id: str):
    module = get_module_by_id(module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module introuvable")
    return FormationModuleResponse(**module)


@router.get("/progress/{track_key}", response_model=FormationProgressResponse)
async def get_my_track_progress(
    track_key: str,
    current: dict = Depends(get_current_user),
):
    progress = list_user_progress(track_key, str(current["_id"]))
    if not progress:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parcours introuvable")
    return FormationProgressResponse(**progress)


@router.post("/progress", response_model=FormationProgressResponse)
async def update_my_track_progress(
    payload: FormationProgressUpdatePayload,
    current: dict = Depends(get_current_user),
):
    now = datetime.now(timezone.utc)
    module = get_module_by_id(payload.module_id)
    if not module:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module introuvable")

    updated = upsert_user_progress(payload.module_id, str(current["_id"]), payload.completed, now)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module introuvable")

    track = get_track_by_key(module["track_key"])
    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parcours introuvable")

    track_key = track["track_key"]
    maybe_issue_certificate(track_key, str(current["_id"]), now)
    progress = list_user_progress(track_key, str(current["_id"]))
    if not progress:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parcours introuvable")
    return FormationProgressResponse(**progress)


@router.get("/certificates/{track_key}/me", response_model=FormationCertificateResponse)
async def get_my_track_certificate(
    track_key: str,
    current: dict = Depends(get_current_user),
):
    certificate = get_user_certificate(track_key, str(current["_id"]))
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificat non disponible. Complète tous les modules.",
        )
    return FormationCertificateResponse(**certificate)

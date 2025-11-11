from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.ai import generate_answer
from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.profiles import (
    DemandeurProfilePayload,
    PrestataireProfilePayload,
    TagSuggestionRequest,
    TagSuggestionResponse,
    WorkspaceProfileResponse,
)


router = APIRouter(prefix="/profiles", tags=["profiles"])
COLLECTION = "workspace_profiles"


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _upsert_profile_part(
    db: AsyncIOMotorDatabase,
    user_id: str,
    field: str,
    payload: Dict[str, Any],
) -> None:
    doc = {
        "user_id": user_id,
        field: payload,
        "updated_at": _timestamp(),
    }
    await db[COLLECTION].update_one({"user_id": user_id}, {"$set": doc}, upsert=True)

    if field == "prestataire":
        mirror = {
            "user_id": user_id,
            "skills": payload.get("skills", []),
            "languages": payload.get("languages", []),
            "country": (payload.get("zones") or [None])[0],
            "remote": payload.get("remote", True),
            "last_active_at": doc["updated_at"],
        }
        await db["profiles"].update_one({"user_id": user_id}, {"$set": mirror}, upsert=True)


def _normalize_list(items: List[str]) -> List[str]:
    seen = []
    for item in items:
        clean = item.strip()
        if clean and clean not in seen:
            seen.append(clean)
    return seen


@router.get("/me", response_model=WorkspaceProfileResponse)
async def get_my_profile(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current["_id"])
    doc = await db[COLLECTION].find_one({"user_id": user_id}) or {}
    return WorkspaceProfileResponse(
        user_id=user_id,
        workspace_role=current.get("workspace_role"),
        demandeur=doc.get("demandeur"),
        prestataire=doc.get("prestataire"),
        updated_at=doc.get("updated_at"),
    )


@router.put("/demandeur")
async def upsert_demandeur_profile(
    payload: DemandeurProfilePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current["_id"])
    data = payload.dict()
    data["languages"] = _normalize_list([lang.strip() for lang in data.get("languages", [])])
    data["preferred_channels"] = _normalize_list(data.get("preferred_channels", []))
    await _upsert_profile_part(db, user_id, "demandeur", data)
    return {"ok": True, "updated_at": _timestamp()}


@router.put("/prestataire")
async def upsert_prestataire_profile(
    payload: PrestataireProfilePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current["_id"])
    data = payload.dict()
    data["skills"] = _normalize_list([s.lower() for s in data.get("skills", [])])
    data["languages"] = _normalize_list([lang.strip() for lang in data.get("languages", [])])
    data["zones"] = _normalize_list(data.get("zones", []))
    data["channels"] = _normalize_list(data.get("channels", []))
    await _upsert_profile_part(db, user_id, "prestataire", data)
    return {"ok": True, "updated_at": _timestamp()}


def _parse_tag_response(raw: str) -> List[str]:
    try:
        parsed = json.loads(raw)
        tags = parsed.get("tags") if isinstance(parsed, dict) else None
        if isinstance(tags, list):
            return [str(t).strip() for t in tags if str(t).strip()]
    except Exception:
        pass
    matches = re.findall(r"[\"““']([\w\- ]+)[\"”’']", raw)
    if not matches:
        matches = re.split(r"[,\n]", raw)
    return [m.strip() for m in matches if m.strip()]


@router.post("/suggest-tags", response_model=TagSuggestionResponse)
async def suggest_tags(
    payload: TagSuggestionRequest,
    current: dict = Depends(get_current_user),  # noqa: ARG001
):
    prompt = (
        "Analyse la bio suivante et propose des tags (1 à 2 mots) décrivant les compétences clés. "
        "Retourne uniquement un JSON valide de la forme {\"tags\": [\"tag1\", \"tag2\"]} sans autre texte.\n\n"
        f"Bio:\n{payload.bio}\n"
    )
    raw = await run_in_threadpool(generate_answer, prompt, "local")
    tags = _parse_tag_response(raw)
    if len(tags) > payload.max_tags:
        tags = tags[: payload.max_tags]
    return TagSuggestionResponse(suggestions=_normalize_list(tags))


def _anonymize_profile(doc: Dict[str, Any], role: str) -> Dict[str, Any]:
    section = (doc or {}).get(role) or {}
    cleaned = {k: v for k, v in section.items() if k not in {"contact_email", "contact_phone", "preferred_channels", "channels"}}
    cleaned["user_id"] = "anonymized"
    return cleaned


@router.get("/export/demo")
async def export_demo_profiles(db: AsyncIOMotorDatabase = Depends(get_db)):
    demo_dem = await db[COLLECTION].find_one({"demandeur": {"$exists": True}})
    demo_prest = await db[COLLECTION].find_one({"prestataire": {"$exists": True}})
    return {
        "demandeur": _anonymize_profile(demo_dem or {}, "demandeur"),
        "prestataire": _anonymize_profile(demo_prest or {}, "prestataire"),
    }

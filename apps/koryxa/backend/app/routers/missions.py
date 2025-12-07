from __future__ import annotations

import json
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.ai import generate_answer
from app.core.config import settings
from app.core.email import send_email_async
from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.missions import (
    ConfirmSelectionPayload,
    DashboardFilters,
    MilestoneUpdatePayload,
    MissionClosePayload,
    MissionCreatePayload,
    MissionMessagePayload,
    MissionMilestonePayload,
    MissionWaveRequest,
    OfferResponsePayload,
)


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/missions", tags=["missions"])

COLL_MISSIONS = "missions"
COLL_EVENTS = "mission_events"
COLL_OFFERS = "mission_offers"
COLL_MESSAGES = "mission_messages"
COLL_MILESTONES = "mission_milestones"
COLL_ESCALATIONS = "mission_escalations"

def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=404, detail="Mission introuvable")


DEMO_PRESTATAIRES: List[Dict[str, Any]] = [
    {
        "user_id": "demo-presta-ml",
        "workspace_role": "prestataire",
        "prestataire": {
            "display_name": "DataCraft Africa",
            "bio": "Collectif ML pour dashboards frugaux, reporting et automation.",
            "skills": ["data analysis", "mlops", "power bi", "python"],
            "languages": ["fr", "en"],
            "availability": "Lun-Sam 9h-19h GMT",
            "availability_timezone": "Africa/Abidjan",
            "rate_min": 450,
            "rate_max": 1100,
            "currency": "EUR",
            "zones": ["CI", "remote"],
            "remote": True,
            "contact_email": "datacraft@example.org",
            "contact_phone": "+225050000002",
            "channels": ["email", "whatsapp"],
        },
        "updated_at": _iso_now(),
    },
    {
        "user_id": "demo-presta-creative",
        "workspace_role": "prestataire",
        "prestataire": {
            "display_name": "Studio Ataya",
            "bio": "Studio design & motion basé à Lomé pour apps fintech & civic tech.",
            "skills": ["ux", "ui", "motion", "brand"],
            "languages": ["fr"],
            "availability": "Mar-Dim 10h-18h GMT+1",
            "availability_timezone": "Africa/Lome",
            "rate_min": 300,
            "rate_max": 800,
            "currency": "EUR",
            "zones": ["TG", "BJ", "remote"],
            "remote": True,
            "contact_email": "studio.ataya@example.org",
            "contact_phone": "+22893000003",
            "channels": ["email"],
        },
        "updated_at": _iso_now(),
    },
    {
        "user_id": "demo-presta-field",
        "workspace_role": "prestataire",
        "prestataire": {
            "display_name": "Ground Ops Sahel",
            "bio": "Equipe terrain pour installations IoT, enquêtes rapides et supervision locale.",
            "skills": ["field ops", "installation", "training", "reporting"],
            "languages": ["fr", "ha"],
            "availability": "24/7 selon mission",
            "availability_timezone": "Africa/Niamey",
            "rate_min": 250,
            "rate_max": 650,
            "currency": "EUR",
            "zones": ["NE", "ML", "remote"],
            "remote": False,
            "contact_email": "ops.sahel@example.org",
            "contact_phone": "+22788000004",
            "channels": ["email", "whatsapp"],
        },
        "updated_at": _iso_now(),
    },
]


async def _log_event(
    db: AsyncIOMotorDatabase,
    mission_id: ObjectId,
    event_type: str,
    payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    doc = {
        "mission_id": str(mission_id),
        "type": event_type,
        "payload": payload or {},
        "ts": _iso_now(),
    }
    await db[COLL_EVENTS].insert_one(doc)
    return doc


def _estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


async def _summarize_need(payload: MissionCreatePayload) -> Dict[str, Any]:
    prompt = (
        "Tu es un PM IA pour KORYXA. Résume un besoin en 80-120 mots, "
        "liste 5 à 8 mots-clés (tags) et identifie 2 à 3 livrables clés. "
        "Retourne uniquement un JSON valide: {\"summary\": str, \"keywords\": [str], \"deliverables\": [str]}.")
    prompt += (
        f"\nTitre: {payload.title}\nLangue: {payload.language}\nMode: {payload.work_mode}\n"
        f"Description:\n{payload.description}\nLivrables attendus:\n{payload.deliverables}\n"
        f"Délai souhaité: {payload.deadline or 'N/A'}\nBudget: {payload.budget.dict()}"
    )
    # Utiliser Cohere en priorité pour la reformulation (fallback local)
    raw = await run_in_threadpool(generate_answer, prompt, "cohere")
    summary = raw.strip()
    keywords: List[str] = []
    deliverables: List[str] = []
    try:
        data = json.loads(raw)
        summary = str(data.get("summary") or summary)
        raw_kw = data.get("keywords") or data.get("tags") or []
        if isinstance(raw_kw, str):
            keywords = [part.strip() for part in raw_kw.split(",") if part.strip()]
        else:
            keywords = [str(part).strip() for part in raw_kw if str(part).strip()]
        raw_del = data.get("deliverables") or []
        deliverables = [str(part).strip() for part in raw_del if str(part).strip()]
    except Exception:  # noqa: BLE001
        pass
    if not keywords:
        keywords = [token.lower() for token in payload.title.split()[:4]]
    return {
        "summary": summary[:800],
        "keywords": keywords[:10],
        "deliverables": deliverables[:5],
    }


def _escalation_reasons(payload: MissionCreatePayload) -> List[str]:
    reasons: List[str] = []
    if _estimate_tokens(payload.description) > 4000:
        reasons.append("prompt>8k_tokens")
    if "," in payload.language or "/" in payload.language:
        reasons.append("multilingue")
    if payload.allow_expansion and payload.work_mode == "hybrid":
        reasons.append("scope_elargissable")
    return reasons


async def _log_escalations(
    db: AsyncIOMotorDatabase,
    mission_id: ObjectId,
    reasons: List[str],
    target_model: str = "hf-fallback",
) -> None:
    if not reasons:
        return
    doc = {
        "mission_id": str(mission_id),
        "reasons": reasons,
        "target": target_model,
        "decided_at": _iso_now(),
    }
    await db[COLL_ESCALATIONS].insert_one(doc)
    await _log_event(db, mission_id, "escalation", {"target": target_model, "reasons": reasons})


async def _fetch_mission(db: AsyncIOMotorDatabase, mission_id: str) -> Dict[str, Any]:
    doc = await db[COLL_MISSIONS].find_one({"_id": _oid(mission_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Mission introuvable")
    doc["mission_id"] = str(doc.pop("_id"))
    return doc


async def _ensure_owner(mission: Dict[str, Any], user_id: str) -> None:
    if mission.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Action réservée au demandeur")


def _serialize_offer(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "offer_id": str(doc.get("_id")),
        "mission_id": doc.get("mission_id"),
        "prestataire_id": doc.get("prestataire_id"),
        "wave": doc.get("wave"),
        "status": doc.get("status"),
        "message": doc.get("message"),
        "expires_at": doc.get("expires_at"),
        "responded_at": doc.get("responded_at"),
        "scores": doc.get("scores", {}),
    }


async def _list_offers(
    db: AsyncIOMotorDatabase,
    mission_id: str,
    prestataire_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {"mission_id": mission_id}
    if prestataire_id:
        query["prestataire_id"] = prestataire_id
    cur = db[COLL_OFFERS].find(query).sort("dispatched_at", 1)
    return [_serialize_offer(doc) async for doc in cur]


async def _mission_detail(
    db: AsyncIOMotorDatabase,
    mission_id: str,
) -> Dict[str, Any]:
    mission = await _fetch_mission(db, mission_id)
    offers = await _list_offers(db, mission_id)
    messages = [
        {
            "id": str(doc.get("_id")),
            "author_id": doc.get("author_id"),
            "role": doc.get("role"),
            "text": doc.get("text"),
            "attachment": doc.get("attachment"),
            "created_at": doc.get("created_at"),
        }
        async for doc in db[COLL_MESSAGES].find({"mission_id": mission_id}).sort("created_at", -1).limit(25)
    ]
    milestones = [
        {
            "id": str(doc.get("_id")),
            "title": doc.get("title"),
            "due_date": doc.get("due_date"),
            "status": doc.get("status"),
            "notes": doc.get("notes"),
            "history": doc.get("history", []),
        }
        async for doc in db[COLL_MILESTONES].find({"mission_id": mission_id}).sort("created_at", 1)
    ]
    events = [
        {
            **doc,
            "_id": str(doc.get("_id")),
        }
        async for doc in db[COLL_EVENTS].find({"mission_id": mission_id}).sort("ts", 1)
    ]
    mission.update({
        "offers": offers,
        "messages": messages[::-1],
        "milestones": milestones,
        "events": events,
    })
    return mission


async def _candidate_profiles(db: AsyncIOMotorDatabase) -> List[Dict[str, Any]]:
    await _ensure_demo_profiles(db)
    cur = db["workspace_profiles"].find({"prestataire": {"$exists": True}})
    return [doc async for doc in cur]


async def _ensure_demo_profiles(db: AsyncIOMotorDatabase) -> None:
    count = await db["workspace_profiles"].count_documents({})
    if count:
        return
    await db["workspace_profiles"].insert_many(DEMO_PRESTATAIRES)


def _list_notified(offers: List[Dict[str, Any]]) -> set[str]:
    return {offer["prestataire_id"] for offer in offers}


def _jaccard(a: List[str], b: List[str]) -> float:
    sa = {str(x).strip().lower() for x in a if str(x).strip()}
    sb = {str(x).strip().lower() for x in b if str(x).strip()}
    if not sa and not sb:
        return 0.0
    inter = len(sa & sb)
    union = len(sa | sb) or 1
    return inter / union


def _score_candidate(mission: Dict[str, Any], profile: Dict[str, Any]) -> float:
    prest = profile.get("prestataire") or {}
    skills = prest.get("skills") or []
    languages = [str(lang).lower() for lang in prest.get("languages", [])]
    remote = prest.get("remote", True)
    zones = [str(z).lower() for z in prest.get("zones", [])]
    score = 0.0
    score += 0.6 * _jaccard(skills, mission.get("ai", {}).get("keywords", []))
    lang = (mission.get("language") or "fr").lower()
    if lang in languages:
        score += 0.2
    elif languages:
        score += 0.1
    if mission.get("work_mode") == "remote" and remote:
        score += 0.2
    elif mission.get("work_mode") != "remote":
        hint = (mission.get("location_hint") or "").lower()
        if any(hint in zone for zone in zones if hint):
            score += 0.2
    availability = prest.get("availability") or ""
    if availability:
        score += 0.05
    return round(score, 4)


async def _generate_offer_message(mission: Dict[str, Any], prestataire: Dict[str, Any]) -> str:
    prompt = (
        "Rédige en français un message d'offre professionnel (<90 mots). "
        "Mentionne le nom du prestataire, le titre de la mission et invite à cliquer sur 'J'accepte'."
    )
    prompt += (
        f"\nPrestataire: {prestataire.get('prestataire', {}).get('display_name') or 'profil'}"
        f"\nMission: {mission.get('title')}"
        f"\nRésumé: {mission.get('ai', {}).get('summary')}"
        f"\nLivrables clés: {(mission.get('ai', {}).get('deliverables') or [])}"
        f"\nDélai: {mission.get('deadline') or 'non précisé'}"
    )
    raw = await run_in_threadpool(generate_answer, prompt, "local")
    return raw.strip()[:600]


async def _notify_prestataire(
    offer: Dict[str, Any],
    profile: Dict[str, Any],
    mission: Dict[str, Any],
    channel: str,
) -> None:
    prestataire = profile.get("prestataire", {})
    tasks = []
    subject = f"[KORYXA] Nouvelle mission: {mission.get('title')}"
    cta = f"{settings.FRONTEND_BASE_URL.rstrip('/')}/missions/offers"
    html = (
        f"<p>Bonjour {prestataire.get('display_name', 'talent')},</p>"
        f"<p>{offer.get('message')}</p>"
        f"<p><a href='{cta}' style='color:#0ea5e9;text-decoration:none;'>Répondre depuis mon espace</a></p>"
    )
    text_body = f"{offer.get('message')}\n\nRépondre: {cta}"
    if channel in {"email", "both"} and prestataire.get("contact_email"):
        tasks.append(
            send_email_async(
                subject=subject,
                recipient=prestataire["contact_email"],
                html_body=html,
                text_body=text_body,
            )
        )
    if channel in {"whatsapp", "both"} and prestataire.get("contact_phone"):
        tasks.append(_send_whatsapp(prestataire["contact_phone"], f"{mission.get('title')}: {offer.get('message')}"))
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)


async def _send_whatsapp(to_phone: str, body: str) -> bool:
    if not (settings.WHATSAPP_API_URL and settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_SENDER):
        logger.debug("WhatsApp gateway not configured; skipping message to %s", to_phone)
        return False
    payload = {"to": to_phone, "from": settings.WHATSAPP_SENDER, "message": body}
    headers = {"Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(settings.WHATSAPP_API_URL, json=payload, headers=headers)
            resp.raise_for_status()
        return True
    except Exception as exc:  # noqa: BLE001
        logger.warning("WhatsApp notification failed for %s: %s", to_phone, exc)
        return False


@router.post("", summary="Créer un besoin / mission")
async def create_mission(
    payload: MissionCreatePayload,
    simulate: bool = Query(False),
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    ai_block = await _summarize_need(payload)
    doc = {
        "user_id": str(current["_id"]),
        "workspace_role": current.get("workspace_role"),
        "title": payload.title,
        "description": payload.description,
        "deliverables": payload.deliverables,
        "deadline": payload.deadline,
        "duration_days": payload.duration_days,
        "budget": payload.budget.dict(),
        "language": payload.language,
        "work_mode": payload.work_mode,
        "allow_expansion": payload.allow_expansion,
        "collect_multiple_quotes": payload.collect_multiple_quotes,
        "location_hint": payload.location_hint,
        "status": "new",
        "ai": ai_block,
        "created_at": _iso_now(),
        "updated_at": _iso_now(),
    }
    if simulate:
        return {
            "mission_id": None,
            "status": "draft",
            "summary": ai_block,
            "tags": ai_block.get("keywords", []),
        }
    res = await db[COLL_MISSIONS].insert_one(doc)
    mission_id = res.inserted_id
    await _log_event(db, mission_id, "created", {"user_id": doc["user_id"]})
    reasons = _escalation_reasons(payload)
    await _log_escalations(db, mission_id, reasons)
    return {
        "mission_id": str(mission_id),
        "status": doc["status"],
        "summary": ai_block,
        "tags": ai_block.get("keywords", []),
    }


@router.get("", summary="Lister les missions pour le rôle courant")
async def list_missions(
    role: str = Query("demandeur", regex="^(demandeur|prestataire|admin)$"),
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = str(current["_id"])
    if role == "demandeur":
        cursor = db[COLL_MISSIONS].find({"user_id": user_id}).sort("created_at", -1)
        return [
            {
                "mission_id": str(doc["_id"]),
                "title": doc["title"],
                "status": doc["status"],
                "created_at": doc["created_at"],
                "last_update": doc.get("updated_at"),
                "tags": doc.get("ai", {}).get("keywords", []),
            }
            async for doc in cursor
        ]
    if role == "prestataire":
        results: List[Dict[str, Any]] = []
        async for offer in db[COLL_OFFERS].find({"prestataire_id": user_id}).sort("dispatched_at", -1):
            try:
                mission_doc = await db[COLL_MISSIONS].find_one({"_id": _oid(offer["mission_id"])})
            except HTTPException:
                mission_doc = None
            if not mission_doc:
                continue
            results.append({
                "mission_id": offer["mission_id"],
                "title": mission_doc.get("title"),
                "offer_id": str(offer["_id"]),
                "status": offer.get("status"),
                "expires_at": offer.get("expires_at"),
                "wave": offer.get("wave"),
            })
        return results
    cursor = db[COLL_MISSIONS].find({}).sort("created_at", -1).limit(50)
    return [
        {
            "mission_id": str(doc["_id"]),
            "title": doc["title"],
            "status": doc["status"],
            "owner": doc.get("user_id"),
        }
        async for doc in cursor
    ]


@router.get("/offers/public", summary="Liste publique des offres prestataires (démonstration)")
async def list_offers_public(
    prestataire_id: Optional[str] = None,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    q: Dict[str, Any] = {}
    if prestataire_id:
        q["prestataire_id"] = prestataire_id
    cur = db[COLL_OFFERS].find(q).sort("dispatched_at", -1).limit(min(limit, 100))
    items: List[Dict[str, Any]] = []
    async for offer in cur:
        mission_doc = await db[COLL_MISSIONS].find_one({"_id": _oid(offer["mission_id"])})
        if not mission_doc:
            continue
        items.append({
            "mission_id": offer["mission_id"],
            "title": mission_doc.get("title"),
            "offer_id": str(offer["_id"]),
            "status": offer.get("status"),
            "expires_at": offer.get("expires_at"),
            "wave": offer.get("wave"),
            "prestataire_id": offer.get("prestataire_id"),
        })
    return {"items": items, "total": len(items)}


@router.get("/{mission_id}", summary="Détail d'une mission")
async def mission_detail(
    mission_id: str,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    user_id = str(current["_id"])
    if mission.get("user_id") != user_id:
        offer = await db[COLL_OFFERS].find_one({"mission_id": mission_id, "prestataire_id": user_id})
        if not offer:
            raise HTTPException(status_code=403, detail="Accès refusé")
    return await _mission_detail(db, mission_id)


@router.post("/{mission_id}/waves", summary="Lancer une vague de matching")
async def dispatch_wave(
    mission_id: str,
    payload: MissionWaveRequest,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    await _ensure_owner(mission, str(current["_id"]))
    candidates = await _candidate_profiles(db)
    existing_offers = await _list_offers(db, mission_id)
    already = _list_notified(existing_offers)
    scored: List[Dict[str, Any]] = []
    for profile in candidates:
        uid = profile.get("user_id")
        if not uid or uid in already:
            continue
        score = _score_candidate(mission, profile)
        if score <= 0:
            continue
        scored.append({"user_id": uid, "score": score, "profile": profile})
    scored.sort(key=lambda item: item["score"], reverse=True)
    shortlist = scored[: payload.top_n]
    dispatch = shortlist[: payload.wave_size]
    if not dispatch:
        raise HTTPException(status_code=404, detail="Aucun profil compatible pour cette vague")

    wave_no = max((offer.get("wave") or 0) for offer in existing_offers) + 1 if existing_offers else 1
    inserted = []
    for item in dispatch:
        prest = item["profile"].get("prestataire", {})
        message = await _generate_offer_message(mission, item["profile"])
        doc = {
            "mission_id": mission_id,
            "prestataire_id": item["user_id"],
            "wave": wave_no,
            "status": "pending",
            "scores": {"match": item["score"]},
            "message": message,
            "channel": payload.channel,
            "dispatched_at": _iso_now(),
            "expires_at": (_iso_now()),
        }
        expiry = datetime.now(timezone.utc) + timedelta(minutes=payload.timeout_minutes)
        doc["expires_at"] = expiry.isoformat()
        res = await db[COLL_OFFERS].insert_one(doc)
        doc["offer_id"] = str(res.inserted_id)
        inserted.append(doc)
        await _notify_prestataire(doc, item["profile"], mission, payload.channel)

    await db[COLL_MISSIONS].update_one(
        {"_id": _oid(mission_id)},
        {"$set": {"status": "matching", "updated_at": _iso_now()}},
    )
    await _log_event(
        db,
        _oid(mission_id),
        "wave_dispatched",
        {"count": len(inserted), "timeout_min": payload.timeout_minutes},
    )
    return {"dispatched": len(inserted), "offers": inserted}


@router.post("/{mission_id}/offers/{offer_id}/respond", summary="Réponse prestataire à une offre")
async def respond_offer(
    mission_id: str,
    offer_id: str,
    payload: OfferResponsePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    offer = await db[COLL_OFFERS].find_one({"_id": _oid(offer_id)})
    if not offer or offer.get("mission_id") != mission_id:
        raise HTTPException(status_code=404, detail="Offre introuvable")
    if offer.get("prestataire_id") != str(current["_id"]):
        raise HTTPException(status_code=403, detail="Offre non attribuée")
    if offer.get("status") not in {"pending"}:
        raise HTTPException(status_code=400, detail="Offre déjà traitée")

    new_status = "accepted" if payload.action == "accept" else "refused"
    await db[COLL_OFFERS].update_one(
        {"_id": offer["_id"]},
        {"$set": {"status": new_status, "responded_at": _iso_now(), "comment": payload.comment}},
    )
    mission = await _fetch_mission(db, mission_id)
    if payload.action == "accept":
        if not mission.get("collect_multiple_quotes"):
            await db[COLL_MISSIONS].update_one(
                {"_id": _oid(mission_id)},
                {"$set": {"status": "accepted", "accepted_offer_id": offer_id, "updated_at": _iso_now()}},
            )
            await db[COLL_OFFERS].update_many(
                {"mission_id": mission_id, "status": "pending", "_id": {"$ne": offer["_id"]}},
                {"$set": {"status": "expired", "responded_at": _iso_now()}},
            )
        else:
            count = await db[COLL_OFFERS].count_documents({"mission_id": mission_id, "status": "accepted"})
            if count >= 3:
                await db[COLL_OFFERS].update_many(
                    {"mission_id": mission_id, "status": "pending"},
                    {"$set": {"status": "expired", "responded_at": _iso_now()}},
                )
        await _log_event(db, _oid(mission_id), "offer_response", {"offer_id": offer_id, "action": payload.action})
    else:
        await _log_event(db, _oid(mission_id), "offer_response", {"offer_id": offer_id, "action": payload.action})
    return {"status": new_status}


@router.post("/{mission_id}/confirm", summary="Confirmer le prestataire sélectionné")
async def confirm_selection(
    mission_id: str,
    payload: ConfirmSelectionPayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    await _ensure_owner(mission, str(current["_id"]))
    offer = await db[COLL_OFFERS].find_one({"_id": _oid(payload.offer_id), "mission_id": mission_id, "status": "accepted"})
    if not offer:
        raise HTTPException(status_code=404, detail="Offre non disponible")
    await db[COLL_MISSIONS].update_one(
        {"_id": _oid(mission_id)},
        {"$set": {"status": "confirmed", "confirmed_offer_id": payload.offer_id, "updated_at": _iso_now()}},
    )
    await db[COLL_OFFERS].update_many(
        {"mission_id": mission_id, "_id": {"$ne": offer["_id"]}},
        {"$set": {"status": "expired", "responded_at": _iso_now()}},
    )
    await db[COLL_OFFERS].update_one({"_id": offer["_id"]}, {"$set": {"status": "confirmed"}})
    await _log_event(db, _oid(mission_id), "status_change", {"status": "confirmed", "offer_id": payload.offer_id, "notes": payload.notes})
    return {"ok": True}


@router.post("/{mission_id}/messages", summary="Envoyer un message sur la mission")
async def post_message(
    mission_id: str,
    payload: MissionMessagePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    user_id = str(current["_id"])
    role = "demandeur" if mission.get("user_id") == user_id else "prestataire"
    if role == "prestataire":
        offer = await db[COLL_OFFERS].find_one({"mission_id": mission_id, "prestataire_id": user_id, "status": {"$in": ["accepted", "confirmed"]}})
        if not offer:
            raise HTTPException(status_code=403, detail="Mission non attribuée")
    doc = {
        "mission_id": mission_id,
        "author_id": user_id,
        "role": role,
        "text": payload.text,
        "attachment": payload.attachment,
        "created_at": _iso_now(),
    }
    await db[COLL_MESSAGES].insert_one(doc)
    await _log_event(db, _oid(mission_id), "message_posted", {"role": role})
    return {"ok": True}


@router.get("/{mission_id}/messages")
async def list_messages(
    mission_id: str,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    user_id = str(current["_id"])
    if mission.get("user_id") != user_id:
        offer = await db[COLL_OFFERS].find_one({"mission_id": mission_id, "prestataire_id": user_id})
        if not offer:
            raise HTTPException(status_code=403, detail="Accès refusé")
    cur = db[COLL_MESSAGES].find({"mission_id": mission_id}).sort("created_at", 1)
    return [
        {
            "id": str(doc.get("_id")),
            "author_id": doc.get("author_id"),
            "role": doc.get("role"),
            "text": doc.get("text"),
            "attachment": doc.get("attachment"),
            "created_at": doc.get("created_at"),
        }
        async for doc in cur
    ]


@router.post("/{mission_id}/milestones", summary="Créer un jalon")
async def create_milestone(
    mission_id: str,
    payload: MissionMilestonePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    await _ensure_owner(mission, str(current["_id"]))
    doc = {
        "mission_id": mission_id,
        "title": payload.title,
        "due_date": payload.due_date,
        "status": "todo",
        "notes": payload.notes,
        "history": [],
        "created_at": _iso_now(),
    }
    await db[COLL_MILESTONES].insert_one(doc)
    await _log_event(db, _oid(mission_id), "milestone_created", {"title": payload.title})
    return {"ok": True}


@router.patch("/{mission_id}/milestones/{milestone_id}")
async def update_milestone(
    mission_id: str,
    milestone_id: str,
    payload: MilestoneUpdatePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    await mission_detail(mission_id, current, db)
    milestone = await db[COLL_MILESTONES].find_one({"_id": _oid(milestone_id), "mission_id": mission_id})
    if not milestone:
        raise HTTPException(status_code=404, detail="Jalon introuvable")
    history = milestone.get("history", [])
    history.append({"status": payload.status, "at": _iso_now(), "notes": payload.notes})
    await db[COLL_MILESTONES].update_one(
        {"_id": milestone["_id"]},
        {"$set": {"status": payload.status, "history": history}},
    )
    await _log_event(db, _oid(mission_id), "milestone_update", {"milestone_id": milestone_id, "status": payload.status})
    return {"ok": True}


@router.post("/{mission_id}/close", summary="Clôturer la mission")
async def close_mission(
    mission_id: str,
    payload: MissionClosePayload,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    await _ensure_owner(mission, str(current["_id"]))
    await db[COLL_MISSIONS].update_one(
        {"_id": _oid(mission_id)},
        {"$set": {"status": "completed", "ratings": payload.dict(), "updated_at": _iso_now()}},
    )
    await _log_event(db, _oid(mission_id), "status_change", {"status": "completed"})
    return {"ok": True}


@router.get("/{mission_id}/export", summary="Export JSON anonymisé pour preuves")
async def export_mission(
    mission_id: str,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await mission_detail(mission_id, current, db)
    mission["user_id"] = "anonymized"
    for offer in mission.get("offers", []):
        offer["prestataire_id"] = "anonymized"
    return mission


@router.get("/{mission_id}/journal", summary="Journal simple des vagues")
async def mission_journal(
    mission_id: str,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    mission = await _fetch_mission(db, mission_id)
    user_id = str(current["_id"])
    if mission.get("user_id") != user_id:
        offer = await db[COLL_OFFERS].find_one({"mission_id": mission_id, "prestataire_id": user_id})
        if not offer:
            raise HTTPException(status_code=403, detail="Accès refusé")
    events = [
        doc
        async for doc in db[COLL_EVENTS].find({"mission_id": mission_id, "type": "wave_dispatched"}).sort("ts", 1)
    ]
    return events


@router.get("/dashboard", summary="KPI missions")
async def missions_dashboard(
    filters: DashboardFilters = Depends(),
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    # Simple guard: only demandeur/admin
    if current.get("workspace_role") not in {"admin", "ops", "pm"}:
        raise HTTPException(status_code=403, detail="Réservé à l'équipe KORYXA")
    window_start = datetime.now(timezone.utc) - timedelta(days=filters.window_days)
    window_iso = window_start.isoformat()
    missions = [
        doc
        async for doc in db[COLL_MISSIONS].find({"created_at": {"$gte": window_iso}})
    ]
    if not missions:
        return {"missions": 0, "time_to_first_offer": 0, "fill_rate": 0}
    t_first: List[float] = []
    t_accept: List[float] = []
    filled = 0
    wave_stats = {"v1": 0, "v2": 0}
    for mission in missions:
        mission_id = str(mission["_id"])
        created = datetime.fromisoformat(mission["created_at"])
        offers = await _list_offers(db, mission_id)
        offers.sort(key=lambda off: off.get("dispatched_at"))
        if offers:
            first = offers[0]
            if first.get("dispatched_at"):
                dt = datetime.fromisoformat(first["dispatched_at"]) - created
                t_first.append(dt.total_seconds())
            accepted = next((o for o in offers if o.get("status") in {"accepted", "confirmed"}), None)
            if accepted and accepted.get("responded_at"):
                dt = datetime.fromisoformat(accepted["responded_at"]) - created
                t_accept.append(dt.total_seconds())
            if mission.get("status") in {"accepted", "confirmed", "completed"}:
                filled += 1
            waves = [ev async for ev in db[COLL_EVENTS].find({"mission_id": mission_id, "type": "wave_dispatched"})]
            if waves:
                wave_stats["v1"] += 1
                if len(waves) > 1:
                    wave_stats["v2"] += 1
    avg_first = sum(t_first) / len(t_first) if t_first else 0
    avg_accept = sum(t_accept) / len(t_accept) if t_accept else 0
    total = len(missions)
    escalations = [doc async for doc in db[COLL_ESCALATIONS].find({"decided_at": {"$gte": window_iso}})]
    return {
        "missions": total,
        "time_to_first_offer": round(avg_first / 60, 2),
        "time_to_accept": round(avg_accept / 60, 2),
        "fill_rate": round((filled / total) * 100, 2),
        "wave_mix": wave_stats,
        "escalations": escalations,
    }

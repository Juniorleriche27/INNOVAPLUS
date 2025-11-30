from __future__ import annotations

from datetime import datetime, timezone
import json
import re
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.ai import generate_answer
from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.studio import (
    AcademyModule,
    AcademyModuleCreate,
    AcademyProgress,
    AcademyProgressUpdate,
    ContentBrief,
    ContentBriefCreate,
    ContentMission,
    ContentMissionCreate,
    DeliveryStatus,
    GeneratedContent,
    GeneratedContentCreate,
    MissionDelivery,
    MissionDeliveryCreate,
    MissionStatus,
    ProgressStatus,
)
from app.utils.ids import to_object_id

router = APIRouter(prefix="/studio", tags=["chatlaya-studio"])

COLL_BRIEFS = "content_briefs"
COLL_GENERATED = "content_generated"
COLL_MISSIONS = "content_missions"
COLL_DELIVERIES = "content_deliveries"
COLL_MODULES = "academy_modules"
COLL_PROGRESS = "academy_progress"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc["_id"] = str(doc.get("_id"))
    return doc


@router.post("/briefs", response_model=ContentBrief)
async def create_brief(
    payload: ContentBriefCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    doc = {
        **payload.dict(),
        "user_id": current["_id"],
        "created_at": _now(),
        "updated_at": _now(),
    }
    res = await db[COLL_BRIEFS].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.get("/briefs", response_model=List[ContentBrief])
async def list_briefs(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    cursor = db[COLL_BRIEFS].find({"user_id": current["_id"]}).sort("updated_at", -1)
    items: List[dict] = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return items


@router.get("/briefs/{brief_id}", response_model=ContentBrief)
async def get_brief(
    brief_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    oid = to_object_id(brief_id)
    doc = await db[COLL_BRIEFS].find_one({"_id": oid, "user_id": current["_id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Brief introuvable")
    return _serialize(doc)


def _build_redaction_prompt(brief: dict) -> str:
    """Prompt système pour le mode rédaction assistée (réponse en blocs lisibles)."""
    parts = [
        "Tu es CHATLAYA, assistant IA de la plateforme KORYXA, spécialisé dans la rédaction de contenus (articles, fiches, pages de site, posts, emails, annonces d’opportunités).",
        "Tu reçois un brief avec : type de contenu, contexte/activité, public cible, objectif, ton souhaité, longueur approximative (en mots).",
        "Tu dois répondre en français et retourner exactement les 4 blocs suivants, sans JSON, sans dictionnaire technique, sans puces ni markdown (*, **, -, •).",
        "Format attendu (exemple) :",
        "Plan :",
        "1. Introduction : …",
        "2. Partie 1 : …",
        "3. Partie 2 : …",
        "4. Conclusion : …",
        "",
        "Texte :",
        "Paragraphe 1… Paragraphe 2… Paragraphe 3…",
        "",
        "Titres :",
        "Titre 1",
        "Titre 2",
        "Titre 3",
        "",
        "Mots-clés :",
        "mot clé 1, mot clé 2, mot clé 3, mot clé 4, mot clé 5",
        "",
        "Consignes de fond :",
        "- Plan : lisible, numéroté, pas de puces ni d’astérisques.",
        "- Texte : plusieurs paragraphes, longueur proche de la demande.",
        "- Titres : 3 propositions, une par ligne, pas de puces.",
        "- Mots-clés : 5 à 10, séparés par des virgules, obligatoires même si tu dois les inférer.",
        "",
        f"Type de contenu : {brief.get('content_type')}",
        f"Titre (optionnel) : {brief.get('title') or 'N/A'}",
        f"Contexte / activité : {brief.get('context')}",
        f"Public cible : {brief.get('target_audience')}",
        f"Objectif : {brief.get('objective')}",
        f"Ton : {brief.get('tone')}",
        f"Longueur approximative : {brief.get('length_hint') or 'standard'}",
    ]
    return "\n".join(parts)


def _extract_block(raw: str, label: str) -> str:
    pattern = rf"{label}\s*:\s*(.*?)(?=\n[A-ZÉÈÎÔÂÙÇ].*?:|\Z)"
    match = re.search(pattern, raw, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    group = match.group(1)
    return group.strip() if isinstance(group, str) else str(group).strip()


def _parse_blocks(raw: str) -> dict:
    raw_text = raw if isinstance(raw, str) else str(raw or "")
    plan = _extract_block(raw_text, "Plan")
    texte = _extract_block(raw_text, "Texte")
    titres_block = _extract_block(raw_text, "Titres") or ""
    keywords_block = _extract_block(raw_text, "Mots[- ]?cl[eé]s|Mots[- ]?clés suggérés") or ""

    def _clean_line(line: str) -> str:
        return line.strip().strip("*-•— ").strip()

    titres = [_clean_line(line) for line in titres_block.splitlines() if _clean_line(line)]
    mots_cles = [_clean_line(kw) for kw in re.split(r"[;,]", keywords_block) if _clean_line(kw)]

    # Nettoyage du plan : retirer marquages markdown ou mentions "Texte :"
    if isinstance(plan, str):
        plan = re.sub(r"\*\*", "", plan)
        plan = re.sub(r"Texte\s*:.*", "", plan, flags=re.IGNORECASE | re.DOTALL).strip()

    # Si le bloc texte est vide, essayer de l'extraire directement du texte brut
    if not texte:
        match_txt = re.search(r"Texte\s*:\s*(.*?)(?:Titres\s*:|Mots[- ]?cl[eé]s\s*:|\Z)", raw_text, re.IGNORECASE | re.DOTALL)
        if match_txt:
            texte = match_txt.group(1).strip()

    # Si un des titres contient "Mots-clés", le rerouter vers mots_cles
    cleaned_titres: list[str] = []
    for line in titres:
        low = line.lower()
        if low.startswith("mots-cl") or low.startswith("mots clés"):
            extracted = line.split(":", 1)[1] if ":" in line else ""
            extra_kw = [_clean_line(kw) for kw in re.split(r"[;,]", extracted) if _clean_line(kw)]
            if extra_kw:
                mots_cles.extend(extra_kw)
        else:
            cleaned_titres.append(line)
    titres = cleaned_titres

    # Si mots_cles reste vide, tenter un grep global
    if not mots_cles:
        global_kw = re.search(r"Mots[- ]?cl[eé]s\s*:\s*([^\n]+)", raw_text, re.IGNORECASE)
        if global_kw:
            mots_cles = [_clean_line(kw) for kw in re.split(r"[;,]", global_kw.group(1)) if _clean_line(kw)]

    # Fallback: si texte vide mais plan contient du texte, l'utiliser pour peupler texte
    if not texte and plan:
        texte = plan

    # Fallback extra: si aucune info utile (plan/titres/mots_cles vides) mais qu'on a un texte brut, mettre l'intégralité
    if not any([plan, texte, titres, mots_cles]) and raw_text:
        texte = raw_text.strip()

    return {
        "plan": plan.strip() if isinstance(plan, str) else plan,
        "texte": texte.strip() if isinstance(texte, str) else texte,
        "titres": titres,
        "mots_cles": mots_cles,
    }


def _build_json_prompt(brief: dict) -> str:
    return "\n".join(
        [
            "Tu es CHATLAYA, assistant spécialisé en rédaction & opportunités pour KORYXA.",
            "Retourne un plan (liste de titres), un texte structuré, 3 titres alternatifs et 5 mots-clés.",
            f"Type de contenu: {brief.get('content_type')}",
            f"Public cible: {brief.get('target_audience')}",
            f"Objectif: {brief.get('objective')}",
            f"Ton: {brief.get('tone')}",
            f"Longueur: {brief.get('length_hint') or 'standard'}",
            f"Contexte/activité: {brief.get('context')}",
            f"Titre proposé: {brief.get('title') or 'N/A'}",
            'Réponds en JSON compact: {"plan":[...],"body":str,"titles":[...],"keywords":[...]}',
        ]
    )

@router.post("/assistant/generate")
async def assistant_generate(
    payload: dict,
    db: AsyncIOMotorDatabase = Depends(get_db),  # noqa: ARG001
    current: dict = Depends(get_current_user),  # noqa: ARG001
):
    """
    Endpoint dédié pour l'assistant de rédaction : reçoit un brief et renvoie plan/texte/titres/mots-clés.
    """
    # Construire le prompt systématique
    system_msg = (
        "Tu es CHATLAYA, assistant IA de la plateforme KORYXA, spécialisé dans la rédaction de contenus (articles, fiches, pages de site, posts, emails, annonces d’opportunités).\n"
        "Tu reçois un brief avec : type de contenu, contexte/activité, public cible, objectif, ton souhaité, longueur approximative (en mots).\n"
        "Tu dois répondre en français et retourner exactement les 4 éléments suivants, sans JSON, sans dictionnaire technique, sans puces ni markdown (*, **, -, •) :\n"
        "Plan : un plan lisible sur plusieurs lignes, numéroté (Introduction, Partie 1, Partie 2, Conclusion…).\n"
        "Texte : le texte complet, structuré en plusieurs paragraphes, adapté au type de contenu et au public cible. Vise une longueur proche de la demande.\n"
        "Titres possibles : 3 propositions de titres, chacune sur une ligne.\n"
        "Mots-clés suggérés : 5 à 10 mots-clés séparés par des virgules. Si rien n’est évident, propose tout de même 5 mots-clés pertinents.\n"
        "Tu ne dois pas renvoyer de JSON ni de balises Markdown, uniquement ces 4 blocs dans cet ordre :\n"
        "Plan : ...\n"
        "Texte : ...\n"
        "Titres : ...\n"
        "Mots-clés : ..."
    )
    brief_text = (
        f"Type de contenu : {payload.get('content_type')}\n"
        f"Titre (optionnel) : {payload.get('title') or 'N/A'}\n"
        f"Contexte / activité : {payload.get('context')}\n"
        f"Public cible : {payload.get('target_audience')}\n"
        f"Objectif : {payload.get('objective')}\n"
        f"Ton : {payload.get('tone')}\n"
        f"Longueur approximative : {payload.get('length_hint') or 'standard'}"
    )
    prompt = f"{system_msg}\n\n{brief_text}"
    try:
        raw = await run_in_threadpool(generate_answer, prompt, "local", None, 90)
        if not isinstance(raw, str):
            raw = str(raw)
        parsed = _parse_blocks(raw)
        if any(parsed.values()):
            return parsed
        # Fallback JSON si l'IA n'a pas respecté le format blocs
        legacy_prompt = _build_json_prompt(
            {
                "content_type": payload.get("content_type"),
                "target_audience": payload.get("target_audience"),
                "objective": payload.get("objective"),
                "tone": payload.get("tone"),
                "length_hint": payload.get("length_hint"),
                "context": payload.get("context"),
                "title": payload.get("title"),
            }
        )
        raw_json = await run_in_threadpool(generate_answer, legacy_prompt, "local", None, 90)
        if isinstance(raw_json, str):
            try:
                parsed_json = json.loads(raw_json)
            except Exception:
                match = re.search(r"\{.*\}", raw_json, re.DOTALL)
                parsed_json = json.loads(match.group(0)) if match else {}
        else:
            parsed_json = {}
        plan = parsed_json.get("plan") or ""
        texte = parsed_json.get("body") or parsed_json.get("texte") or ""
        titres = parsed_json.get("titles") or parsed_json.get("titres") or []
        mots_cles = parsed_json.get("keywords") or parsed_json.get("mots_cles") or []
        if not isinstance(titres, list):
            titres = [str(titres)]
        if not isinstance(mots_cles, list):
            mots_cles = [str(mots_cles)]
        cleaned = {
            "plan": str(plan),
            "texte": str(texte),
            "titres": [str(t).strip() for t in titres if str(t).strip()],
            "mots_cles": [str(m).strip() for m in mots_cles if str(m).strip()],
        }
        if not any(cleaned.values()):
            raise ValueError("Réponse IA vide ou illisible")
        return cleaned
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Génération échouée: {exc}") from exc


@router.post("/generate", response_model=GeneratedContent)
async def generate_content(
    payload: GeneratedContentCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    brief_oid = to_object_id(payload.brief_id)
    brief = await db[COLL_BRIEFS].find_one({"_id": brief_oid, "user_id": current["_id"]})
    if not brief:
        raise HTTPException(status_code=404, detail="Brief introuvable")

    prompt = _build_redaction_prompt(brief)
    raw = await run_in_threadpool(generate_answer, prompt, "local", None, 90)
    plan: List[str] = []
    body: str = raw
    titles: List[str] = []
    keywords: List[str] = []
    try:
        parsed: Dict[str, Any] = json.loads(raw) if isinstance(raw, str) else {}
        plan = [str(p).strip() for p in parsed.get("plan", []) if str(p).strip()]
        body = str(parsed.get("body") or raw)
        titles = [str(t).strip() for t in parsed.get("titles", []) if str(t).strip()]
        keywords = [str(k).strip() for k in parsed.get("keywords", []) if str(k).strip()]
    except Exception:
        pass
    doc = {
        "brief_id": str(brief_oid),
        "user_id": current["_id"],
        "plan": plan,
        "body": body,
        "titles": titles or [brief.get("title") or "Titre proposé"],
        "keywords": keywords,
        "created_at": _now(),
    }
    res = await db[COLL_GENERATED].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.get("/generated", response_model=List[GeneratedContent])
async def list_generated(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    cursor = db[COLL_GENERATED].find({"user_id": current["_id"]}).sort("created_at", -1)
    items: List[dict] = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return items


@router.post("/missions", response_model=ContentMission)
async def create_mission(
    payload: ContentMissionCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    doc = {
        **payload.dict(),
        "client_id": current["_id"],
        "status": MissionStatus.ouverte.value,
        "created_at": _now(),
        "updated_at": _now(),
        "redacteur_id": None,
    }
    res = await db[COLL_MISSIONS].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.get("/missions", response_model=List[ContentMission])
async def list_missions(
    role: Optional[str] = Query(None, description="client|redacteur|all"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    criteria: Dict[str, Any] = {}
    if role == "client":
        criteria["client_id"] = current["_id"]
    elif role == "redacteur":
        criteria["redacteur_id"] = current["_id"]
    else:
        criteria["$or"] = [{"client_id": current["_id"]}, {"redacteur_id": current["_id"]}]
    cursor = db[COLL_MISSIONS].find(criteria).sort("created_at", -1)
    items: List[dict] = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return items


@router.get("/missions/open", response_model=List[ContentMission])
async def list_open_missions(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),  # noqa: ARG001
):
    cursor = db[COLL_MISSIONS].find({"status": MissionStatus.ouverte.value}).sort("created_at", -1)
    items: List[dict] = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return items


@router.post("/missions/{mission_id}/take", response_model=ContentMission)
async def take_mission(
    mission_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    oid = to_object_id(mission_id)
    doc = await db[COLL_MISSIONS].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Mission introuvable")
    if doc.get("status") not in {MissionStatus.ouverte.value}:
        raise HTTPException(status_code=400, detail="Mission non disponible")
    await db[COLL_MISSIONS].update_one(
        {"_id": oid},
        {"$set": {"redacteur_id": current["_id"], "status": MissionStatus.prise.value, "updated_at": _now()}},
    )
    updated = await db[COLL_MISSIONS].find_one({"_id": oid})
    return _serialize(updated)


@router.post("/missions/{mission_id}/submit", response_model=MissionDelivery)
async def submit_delivery(
    mission_id: str,
    payload: MissionDeliveryCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    oid = to_object_id(mission_id)
    mission = await db[COLL_MISSIONS].find_one({"_id": oid})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission introuvable")
    if mission.get("redacteur_id") not in {None, current["_id"]}:
        raise HTTPException(status_code=403, detail="Non autorisé")
    # version auto
    last = await db[COLL_DELIVERIES].find({"mission_id": mission_id}).sort("version", -1).to_list(1)
    next_version = (last[0].get("version", 0) + 1) if last else 1
    doc = {
        "mission_id": mission_id,
        "redacteur_id": current["_id"],
        "version": payload.version or next_version,
        "content": payload.content,
        "note": payload.note,
        "status": DeliveryStatus.soumis.value,
        "created_at": _now(),
    }
    res = await db[COLL_DELIVERIES].insert_one(doc)
    await db[COLL_MISSIONS].update_one({"_id": oid}, {"$set": {"status": MissionStatus.soumise.value, "updated_at": _now(), "redacteur_id": current["_id"]}})
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.post("/missions/{mission_id}/deliveries/{delivery_id}/accept", response_model=MissionDelivery)
async def accept_delivery(
    mission_id: str,
    delivery_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    mid = to_object_id(mission_id)
    did = to_object_id(delivery_id)
    mission = await db[COLL_MISSIONS].find_one({"_id": mid, "client_id": current["_id"]})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission introuvable ou non autorisée")
    delivery = await db[COLL_DELIVERIES].find_one({"_id": did, "mission_id": mission_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison introuvable")
    await db[COLL_DELIVERIES].update_one({"_id": did}, {"$set": {"status": DeliveryStatus.accepte.value}})
    await db[COLL_MISSIONS].update_one({"_id": mid}, {"$set": {"status": MissionStatus.validee.value, "updated_at": _now()}})
    updated = await db[COLL_DELIVERIES].find_one({"_id": did})
    return _serialize(updated)


@router.post("/missions/{mission_id}/deliveries/{delivery_id}/revision", response_model=MissionDelivery)
async def request_revision(
    mission_id: str,
    delivery_id: str,
    note: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    mid = to_object_id(mission_id)
    did = to_object_id(delivery_id)
    mission = await db[COLL_MISSIONS].find_one({"_id": mid, "client_id": current["_id"]})
    if not mission:
        raise HTTPException(status_code=404, detail="Mission introuvable ou non autorisée")
    delivery = await db[COLL_DELIVERIES].find_one({"_id": did, "mission_id": mission_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Livraison introuvable")
    await db[COLL_DELIVERIES].update_one({"_id": did}, {"$set": {"status": DeliveryStatus.a_reviser.value, "note": note}})
    await db[COLL_MISSIONS].update_one({"_id": mid}, {"$set": {"status": MissionStatus.a_reviser.value, "updated_at": _now()}})
    updated = await db[COLL_DELIVERIES].find_one({"_id": did})
    return _serialize(updated)


@router.get("/missions/{mission_id}/deliveries", response_model=List[MissionDelivery])
async def list_deliveries(
    mission_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),  # noqa: ARG001
):
    cursor = db[COLL_DELIVERIES].find({"mission_id": mission_id}).sort("version", -1)
    items: List[dict] = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return items


@router.post("/academy/modules", response_model=AcademyModule)
async def create_module(
    payload: AcademyModuleCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),  # noqa: ARG001
):
    doc = {**payload.dict(), "created_at": _now(), "updated_at": _now()}
    res = await db[COLL_MODULES].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.get("/academy/modules", response_model=List[AcademyModule])
async def list_modules(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),  # noqa: ARG001
):
    cursor = db[COLL_MODULES].find().sort("order", 1)
    items: List[dict] = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return items


@router.get("/academy/modules/{module_id}", response_model=AcademyModule)
async def get_module(
    module_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),  # noqa: ARG001
):
    oid = to_object_id(module_id)
    doc = await db[COLL_MODULES].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Module introuvable")
    return _serialize(doc)


@router.post("/academy/progress", response_model=AcademyProgress)
async def update_progress(
    payload: AcademyProgressUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    module_oid = to_object_id(payload.module_id)
    module = await db[COLL_MODULES].find_one({"_id": module_oid})
    if not module:
        raise HTTPException(status_code=404, detail="Module introuvable")
    existing = await db[COLL_PROGRESS].find_one({"module_id": payload.module_id, "user_id": current["_id"]})
    now = _now()
    completed_at = now if payload.status == ProgressStatus.termine else None
    if existing:
        await db[COLL_PROGRESS].update_one(
            {"_id": existing["_id"]},
            {"$set": {"status": payload.status.value, "completed_at": completed_at, "updated_at": now}},
        )
        updated = await db[COLL_PROGRESS].find_one({"_id": existing["_id"]})
        return _serialize(updated)
    doc = {
        "user_id": current["_id"],
        "module_id": payload.module_id,
        "status": payload.status.value,
        "completed_at": completed_at,
        "updated_at": now,
        "created_at": now,
    }
    res = await db[COLL_PROGRESS].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.get("/academy/progress", response_model=List[AcademyProgress])
async def list_progress(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    cursor = db[COLL_PROGRESS].find({"user_id": current["_id"]})
    items: List[dict] = []
    async for doc in cursor:
        items.append(_serialize(doc))
    return items

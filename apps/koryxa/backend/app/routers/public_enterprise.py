from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.core.config import settings
from app.core.public_access import ensure_guest_id, get_guest_id
from app.db.mongo import get_db, get_db_instance
from app.deps.auth import get_current_user_optional
from app.repositories.enterprise_pg import (
    claim_need_for_user,
    create_mission,
    create_need,
    create_opportunity,
    create_task_binding,
    get_mission_for_need,
    get_need_for_guest,
    get_need_for_user,
    get_opportunity_for_need,
    list_public_opportunities,
    list_task_bindings,
    list_user_needs,
    sync_need_related_user,
)
from app.schemas.enterprise_public import (
    EnterpriseCockpitActivationResponse,
    EnterpriseCockpitContextResponse,
    EnterpriseFileAiAnalysisRequest,
    EnterpriseFileAiAnalysisResponse,
    EnterpriseNeedCreatePayload,
    EnterpriseOpportunityListResponse,
    EnterpriseSubmissionResponse,
)
from app.services.ai_json import generate_structured_json
from app.services.enterprise_service import (
    adaptive_answers_to_need_payload,
    derive_statuses,
    generate_next_enterprise_question,
    structure_enterprise_need,
)
from app.services.matching_service import find_matches_for_need
router = APIRouter(prefix="/enterprise", tags=["public-enterprise"])


def _serialize_need(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "company_name": str(doc.get("company_name") or "Entreprise non precise"),
        "primary_goal": doc["primary_goal"],
        "need_type": doc["need_type"],
        "expected_result": doc["expected_result"],
        "urgency": doc["urgency"],
        "treatment_preference": doc["treatment_preference"],
        "recommended_treatment_mode": doc["recommended_treatment_mode"],
        "team_context": doc["team_context"],
        "support_preference": doc["support_preference"],
        "short_brief": doc.get("short_brief"),
        "status": doc["status"],
        "qualification_score": doc["qualification_score"],
        "clarity_level": doc["clarity_level"],
        "structured_summary": doc["structured_summary"],
        "next_recommended_action": doc["next_recommended_action"],
        "created_at": doc["created_at"],
    }


def _serialize_mission(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "need_id": str(doc["need_id"]),
        "title": doc["title"],
        "summary": doc["summary"],
        "deliverable": doc["deliverable"],
        "execution_mode": doc["execution_mode"],
        "status": doc["status"],
        "steps": list(doc.get("steps") or []),
        "created_at": doc["created_at"],
    }


def _serialize_opportunity(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "need_id": str(doc["need_id"]),
        "mission_id": str(doc["mission_id"]),
        "type": doc["type"],
        "title": doc["title"],
        "summary": doc["summary"],
        "status": doc["status"],
        "highlights": list(doc.get("highlights") or []),
        "published_at": doc.get("published_at"),
    }


def _enterprise_context_id(need_id: str) -> str:
    return f"koryxa-enterprise:{need_id}"


def _cockpit_url(need_id: str, context_id: str) -> str:
    return f"/entreprise/espace?need_id={need_id}&context_id={context_id}"


def _cockpit_login_url(need_id: str, context_id: str) -> str:
    return _cockpit_url(need_id, context_id)


async def _resolve_need(
    need_id: str,
    request: Request,
    response: Response | None,
    current: dict | None,
) -> dict[str, Any]:
    if not settings.REQUIRE_MONGO:
        guest_id = get_guest_id(request)
        if current:
            need = get_need_for_user(need_id, str(current["_id"]))
            if need:
                return need
            if guest_id:
                need = get_need_for_guest(need_id, guest_id)
                if need and not need.get("user_id"):
                    claimed = claim_need_for_user(need_id, str(current["_id"]))
                    if claimed:
                        sync_need_related_user(need_id, str(current["_id"]))
                        return claimed
            need = claim_need_for_user(need_id, str(current["_id"]))
            if need:
                sync_need_related_user(need_id, str(current["_id"]))
                return need
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Besoin introuvable")

        resolved_guest_id = ensure_guest_id(request, response) if response is not None else guest_id
        if not resolved_guest_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
        need = get_need_for_guest(need_id, resolved_guest_id)
        if not need:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Besoin introuvable")
        return need

    db = get_db_instance()
    from app.utils.ids import to_object_id

    try:
        need_oid = to_object_id(need_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Identifiant de besoin invalide") from exc
    guest_id = get_guest_id(request)

    if current:
        need = await db["enterprise_needs"].find_one({"_id": need_oid, "user_id": current["_id"]})
        if need:
            return need
        if guest_id:
            need = await db["enterprise_needs"].find_one(
                {
                    "_id": need_oid,
                    "guest_id": guest_id,
                    "$or": [{"user_id": None}, {"user_id": current["_id"]}],
                }
            )
            if need:
                now = datetime.now(timezone.utc)
                await db["enterprise_needs"].update_one(
                    {"_id": need_oid},
                    {"$set": {"user_id": current["_id"], "updated_at": now}},
                )
                await db["enterprise_missions"].update_one(
                    {"need_id": need_oid},
                    {"$set": {"user_id": current["_id"], "updated_at": now}},
                )
                await db["enterprise_opportunities"].update_one(
                    {"need_id": need_oid},
                    {"$set": {"user_id": current["_id"], "updated_at": now}},
                )
                need["user_id"] = current["_id"]
                need["updated_at"] = now
                return need
        need = await db["enterprise_needs"].find_one({"_id": need_oid, "user_id": None})
        if need:
            now = datetime.now(timezone.utc)
            await db["enterprise_needs"].update_one(
                {"_id": need_oid, "user_id": None},
                {"$set": {"user_id": current["_id"], "updated_at": now}},
            )
            await db["enterprise_missions"].update_one(
                {"need_id": need_oid, "user_id": None},
                {"$set": {"user_id": current["_id"], "updated_at": now}},
            )
            await db["enterprise_opportunities"].update_one(
                {"need_id": need_oid},
                {"$set": {"updated_at": now, "user_id": current["_id"]}},
            )
            need["user_id"] = current["_id"]
            need["updated_at"] = now
            return need
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Besoin introuvable")

    resolved_guest_id = ensure_guest_id(request, response) if response is not None else guest_id
    if not resolved_guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    need = await db["enterprise_needs"].find_one({"_id": need_oid, "guest_id": resolved_guest_id})
    if not need:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Besoin introuvable")
    return need


async def _ensure_cockpit_bindings(
    need: dict[str, Any],
    mission: dict[str, Any],
    current: dict,
) -> tuple[str, dict[str, dict[str, Any]], int]:
    context_id = _enterprise_context_id(str(need["_id"]))
    if not settings.REQUIRE_MONGO:
        existing = list_task_bindings(str(need["_id"]), str(current["_id"]))
    else:
        db = get_db_instance()
        existing = await db["enterprise_task_bindings"].find(
            {"need_id": need["_id"], "user_id": current["_id"]}
        ).to_list(length=50)
    binding_map = {str(item.get("step_key") or ""): item for item in existing}
    created_task_count = 0
    now = datetime.now(timezone.utc)

    for step_index, step_text in enumerate(mission.get("steps") or [], start=1):
        step_key = f"step_{step_index}"
        binding = binding_map.get(step_key)
        if binding:
            continue

        created_task_count += 1
        binding_doc = {
            "need_id": need["_id"],
            "user_id": current["_id"],
            "context_id": context_id,
            "step_key": step_key,
            "step_title": str(step_text),
            "created_at": now,
            "updated_at": now,
        }
        if not settings.REQUIRE_MONGO:
            created = create_task_binding(
                need_id=str(need["_id"]),
                user_id=str(current["_id"]),
                context_id=context_id,
                step_key=step_key,
                step_title=str(step_text),
                now=now,
            )
            if created:
                binding_doc["_id"] = created["id"]
        else:
            db = get_db_instance()
            result = await db["enterprise_task_bindings"].insert_one(binding_doc)
            binding_doc["_id"] = result.inserted_id
        binding_map[step_key] = binding_doc

    return context_id, binding_map, created_task_count


def _serialize_cockpit_context(
    need: dict[str, Any],
    mission: dict[str, Any],
    opportunity: dict[str, Any] | None,
    context_id: str,
    binding_map: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    next_actions = [str(need.get("next_recommended_action") or "").strip()]
    next_actions.extend([str(step).strip() for step in (mission.get("steps") or [])[:2]])
    execution_steps = []
    for step_index, step_text in enumerate(mission.get("steps") or [], start=1):
        step_key = f"step_{step_index}"
        binding = binding_map.get(step_key) or {}
        execution_steps.append(
            {
                "step_key": step_key,
                "title": f"Étape {step_index}",
                "description": str(step_text),
                "status": "todo",
            }
        )

    return {
        "need_id": str(need["_id"]),
        "context_id": context_id,
        "task_query": {"context_type": "professional", "context_id": context_id},
        "need": _serialize_need(need),
        "mission": _serialize_mission(mission),
        "opportunity": _serialize_opportunity(opportunity),
        "next_actions": [item for item in next_actions if item][:3],
        "execution_steps": execution_steps,
        "binding_summary": {"binding_count": len(binding_map)},
    }


def _trim_text(value: Any, fallback: str = "") -> str:
    text = str(value or "").strip()
    return text or fallback


def _clean_list(value: Any, limit: int = 5) -> list[str]:
    if isinstance(value, str):
        values = [value]
    elif isinstance(value, list):
        values = value
    else:
        values = []

    cleaned: list[str] = []
    for item in values:
        text = str(item or "").strip()
        if not text or text in cleaned:
            continue
        cleaned.append(text[:240])
        if len(cleaned) >= limit:
            break
    return cleaned


def _has_keywords(columns: list[str], keywords: tuple[str, ...]) -> bool:
    normalized = [column.strip().lower() for column in columns]
    return any(any(keyword in column for keyword in keywords) for column in normalized)


def _build_upload_ai_fallback(
    payload: EnterpriseFileAiAnalysisRequest,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    business_diagnosis: list[str] = []
    key_risks: list[str] = []
    suggested_kpis: list[str] = []
    recommended_visualizations: list[str] = []
    priority_actions = _clean_list(payload.recommendations, limit=4)
    questions_to_clarify: list[str] = []

    row_count = payload.row_count
    column_count = payload.column_count
    completeness = round(payload.completeness_rate)
    columns = payload.columns

    sales_dataset = _has_keywords(
        columns,
        ("vente", "deal", "pipeline", "revenue", "ca", "chiffre", "opportun", "client"),
    )
    people_dataset = _has_keywords(
        columns,
        ("equipe", "manager", "presence", "member", "membre", "departement", "workspace"),
    )

    business_diagnosis.append(
        f"Jeu de donnees {payload.file_type.upper()} avec {row_count} lignes et {column_count} colonnes, utilisable pour une lecture management rapide."
    )
    if payload.numeric_columns:
        business_diagnosis.append(
            f"{len(payload.numeric_columns)} colonnes numeriques permettent deja de construire des KPI fiables."
        )
    if payload.date_columns:
        business_diagnosis.append(
            f"{len(payload.date_columns)} colonnes date ouvrent une lecture temporelle des tendances et des variations."
        )
    if sales_dataset:
        business_diagnosis.append(
            "La structure ressemble a une base commerciale exploitable pour le pilotage du pipeline, des conversions et du revenu."
        )
    elif people_dataset:
        business_diagnosis.append(
            "La structure ressemble a une base d'organisation ou d'execution, adaptee au pilotage des equipes, des espaces et de la presence."
        )
    else:
        business_diagnosis.append(
            "Le fichier semble transverse: il peut alimenter un reporting operationnel ou une base de decision si le grain d'analyse est clarifie."
        )

    if payload.completeness_rate < 90:
        key_risks.append(
            f"Completude limitee a {completeness}%: le reporting risque de produire des angles morts sur certains indicateurs."
        )
    if payload.duplicate_headers:
        key_risks.append(
            "Des en-tetes dupliques compliquent le mapping et peuvent fausser les KPI calcules."
        )
    key_risks.extend(_clean_list(payload.anomalies, limit=4))
    if not payload.numeric_columns:
        key_risks.append(
            "Aucune colonne numerique evidente: il faudra confirmer les champs qui portent la valeur a suivre."
        )
    if not payload.date_columns:
        key_risks.append(
            "Aucune colonne date claire: les comparaisons temporelles resteront faibles tant qu'un axe temps n'est pas stabilise."
        )

    if sales_dataset:
        suggested_kpis.extend(
            [
                "Pipeline total par etape commerciale",
                "Taux de conversion par etape",
                "Valeur moyenne par deal ou opportunite",
                "Revenu gagne sur la periode",
            ]
        )
        recommended_visualizations.extend(
            [
                "Funnel commercial par etape",
                "Courbe d'evolution du pipeline sur le temps",
                "Barres des deals par commercial, equipe ou segment",
            ]
        )
    elif people_dataset:
        suggested_kpis.extend(
            [
                "Taux de presence ou d'activite par espace",
                "Charge par equipe ou departement",
                "Taux de completion des actions managers",
                "Volume d'execution par periode",
            ]
        )
        recommended_visualizations.extend(
            [
                "Heatmap de presence par equipe et par jour",
                "Barres des espaces ou departements les plus actifs",
                "Courbe d'evolution de l'engagement sur la periode",
            ]
        )
    else:
        suggested_kpis.extend(
            [
                "Volume de lignes exploitables par segment",
                "Taux de completude par colonne critique",
                "Part des anomalies structurelles dans le fichier",
                "Evolution des volumes sur la periode",
            ]
        )
        recommended_visualizations.extend(
            [
                "Barres des categories principales",
                "Courbe d'evolution sur la dimension temps",
                "Tableau de qualite des champs critiques",
            ]
        )

    if payload.numeric_columns and payload.date_columns:
        recommended_visualizations.append(
            f"Serie temporelle sur {payload.numeric_columns[0]} pour suivre la tendance principale."
        )

    if not priority_actions:
        priority_actions = [
            "Verifier les champs obligatoires et corriger les cellules vides sur les dimensions critiques.",
            "Confirmer le grain d'analyse attendu: ligne par deal, par client, par jour, par membre ou par espace.",
            "Stabiliser les nomenclatures de colonnes avant toute automatisation de dashboard.",
            "Brancher ensuite le fichier aux modules Ventes, Setup ou Cockpit selon le besoin metier.",
        ]

    questions_to_clarify.extend(
        [
            "Quel est le KPI principal que l'equipe dirigeante veut lire en premier ?",
            "A quelle frequence ce fichier est-il mis a jour et par qui ?",
        ]
    )
    if sales_dataset:
        questions_to_clarify.append(
            "Les etapes commerciales et la definition d'un deal gagne sont-elles deja normalisees ?"
        )
    elif people_dataset:
        questions_to_clarify.append(
            "Le suivi se fait-il par organisation, par workspace, par departement ou par manager ?"
        )
    else:
        questions_to_clarify.append(
            "Quel niveau de detail doit servir de base au reporting: ligne brute, aggregation journaliere ou synthese management ?"
        )

    executive_summary = (
        f"Le fichier {payload.file_name} est suffisamment structure pour une premiere lecture decisionnelle. "
        f"KORYXA detecte {row_count} lignes, {column_count} colonnes et une completude de {completeness}%, "
        "avec un potentiel immediate pour des KPI, des alertes et des recommandations actionnables."
    )

    return {
        "generated_at": now,
        "executive_summary": executive_summary,
        "business_diagnosis": business_diagnosis[:4],
        "key_risks": key_risks[:5],
        "suggested_kpis": suggested_kpis[:5],
        "recommended_visualizations": recommended_visualizations[:5],
        "priority_actions": priority_actions[:4],
        "questions_to_clarify": questions_to_clarify[:4],
        "ai_confidence": "low",
    }


def _build_upload_ai_prompt(payload: EnterpriseFileAiAnalysisRequest) -> str:
    source_payload = json.dumps(payload.model_dump(), ensure_ascii=False)
    return f"""
Tu es l'analyste principal de KORYXA pour les donnees enterprise.
Tu dois produire une lecture executive, metier et orientee action d'un fichier importe.

Contraintes:
- Reponds uniquement en JSON valide.
- Aucun markdown.
- Francais professionnel, concret, sobre.
- N'invente pas de chiffres absents.
- Appuie-toi sur les anomalies et recommandations deja detectees.
- Donne 3 a 5 items par liste quand c'est pertinent.

Schema JSON strict:
{{
  "executive_summary": "string",
  "business_diagnosis": ["string"],
  "key_risks": ["string"],
  "suggested_kpis": ["string"],
  "recommended_visualizations": ["string"],
  "priority_actions": ["string"],
  "questions_to_clarify": ["string"],
  "ai_confidence": "high|medium|low"
}}

Resume structure du fichier:
{source_payload}
""".strip()


def _normalize_upload_ai_response(
    payload: EnterpriseFileAiAnalysisRequest,
    generated: dict[str, Any] | None,
) -> dict[str, Any]:
    fallback = _build_upload_ai_fallback(payload)
    if not generated:
        return fallback

    confidence = str(generated.get("ai_confidence") or "").strip().lower()
    if confidence not in {"high", "medium", "low"}:
        confidence = "medium"

    return {
        "generated_at": datetime.now(timezone.utc),
        "executive_summary": _trim_text(
            generated.get("executive_summary"),
            fallback["executive_summary"],
        ),
        "business_diagnosis": _clean_list(
            generated.get("business_diagnosis"),
            limit=5,
        )
        or fallback["business_diagnosis"],
        "key_risks": _clean_list(generated.get("key_risks"), limit=5)
        or fallback["key_risks"],
        "suggested_kpis": _clean_list(
            generated.get("suggested_kpis"),
            limit=5,
        )
        or fallback["suggested_kpis"],
        "recommended_visualizations": _clean_list(
            generated.get("recommended_visualizations"),
            limit=5,
        )
        or fallback["recommended_visualizations"],
        "priority_actions": _clean_list(
            generated.get("priority_actions"),
            limit=5,
        )
        or fallback["priority_actions"],
        "questions_to_clarify": _clean_list(
            generated.get("questions_to_clarify"),
            limit=5,
        )
        or fallback["questions_to_clarify"],
        "ai_confidence": confidence,
    }


@router.post("/needs", response_model=EnterpriseSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_enterprise_need(
    payload: EnterpriseNeedCreatePayload,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    now = datetime.now(timezone.utc)
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    structured = await structure_enterprise_need(payload.model_dump())
    recommended_mode = str(structured["recommended_treatment_mode"])
    statuses = derive_statuses(recommended_mode)

    need_payload: dict[str, Any] = {
        **payload.model_dump(),
        "title": structured["title"],
        "recommended_treatment_mode": recommended_mode,
        "status": statuses["need_status"],
        "qualification_score": structured["qualification_score"],
        "clarity_level": structured["clarity_level"],
        "structured_summary": structured["need_summary"],
        "next_recommended_action": structured["next_recommended_action"],
    }
    if not settings.REQUIRE_MONGO:
        need_doc = create_need(payload=need_payload, guest_id=guest_id, user_id=str(current["_id"]) if current else None, now=now)
        mission_doc = create_mission(
            need_id=str(need_doc["_id"]),
            guest_id=guest_id,
            user_id=str(current["_id"]) if current else None,
            payload=structured["mission"],
            status=statuses["mission_status"],
            now=now,
        )
    else:
        db = get_db_instance()
        need_doc = {**need_payload, "guest_id": guest_id, "user_id": current["_id"] if current else None, "created_at": now, "updated_at": now}
        need_result = await db["enterprise_needs"].insert_one(need_doc)
        need_doc["_id"] = need_result.inserted_id
        mission_doc = {
            "need_id": need_doc["_id"],
            "guest_id": guest_id,
            "user_id": current["_id"] if current else None,
            "title": structured["mission"]["title"],
            "summary": structured["mission"]["summary"],
            "deliverable": structured["mission"]["deliverable"],
            "execution_mode": structured["mission"]["execution_mode"],
            "status": statuses["mission_status"],
            "steps": structured["mission"]["steps"],
            "created_at": now,
            "updated_at": now,
        }
        mission_result = await db["enterprise_missions"].insert_one(mission_doc)
        mission_doc["_id"] = mission_result.inserted_id

    opportunity_doc: dict[str, Any] | None = None
    if recommended_mode == "publie":
        if not settings.REQUIRE_MONGO:
            opportunity_doc = create_opportunity(
                need_id=str(need_doc["_id"]),
                mission_id=str(mission_doc["_id"]),
                payload=structured["opportunity"],
                status=statuses["opportunity_status"],
                now=now,
            )
        else:
            opportunity_doc = {
                "need_id": need_doc["_id"],
                "mission_id": mission_doc["_id"],
                "type": structured["opportunity"]["type"],
                "title": structured["opportunity"]["title"],
                "summary": structured["opportunity"]["summary"],
                "status": statuses["opportunity_status"],
                "highlights": structured["opportunity"]["highlights"],
                "published_at": now,
                "created_at": now,
                "updated_at": now,
            }
            opportunity_result = await db["enterprise_opportunities"].insert_one(opportunity_doc)
            opportunity_doc["_id"] = opportunity_result.inserted_id

    return {
        "need": _serialize_need(need_doc),
        "mission": _serialize_mission(mission_doc),
        "opportunity": _serialize_opportunity(opportunity_doc),
    }


@router.post("/needs/next-question")
async def get_next_enterprise_question(request: Request):
    """Return the next adaptive question based on previous answers."""
    payload = await request.json()
    answers = payload.get("answers", [])
    result = await generate_next_enterprise_question(answers)
    return result


@router.post("/needs/adaptive", response_model=EnterpriseSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_enterprise_need_adaptive(
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    """Create an enterprise need from adaptive Q&A answers."""
    payload = await request.json()
    adaptive_answers = payload.get("adaptive_answers", [])
    if not adaptive_answers:
        raise HTTPException(status_code=422, detail="adaptive_answers required")

    now = datetime.now(timezone.utc)
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    need_payload = adaptive_answers_to_need_payload(adaptive_answers)
    structured = await structure_enterprise_need(need_payload)
    recommended_mode = str(structured["recommended_treatment_mode"])
    statuses = derive_statuses(recommended_mode)

    need_payload_db: dict[str, Any] = {
        **need_payload,
        "title": structured["title"],
        "recommended_treatment_mode": recommended_mode,
        "status": statuses["need_status"],
        "qualification_score": structured["qualification_score"],
        "clarity_level": structured["clarity_level"],
        "structured_summary": structured["need_summary"],
        "next_recommended_action": structured["next_recommended_action"],
    }
    if not settings.REQUIRE_MONGO:
        need_doc = create_need(payload=need_payload_db, guest_id=guest_id, user_id=str(current["_id"]) if current else None, now=now)
        mission_doc = create_mission(
            need_id=str(need_doc["_id"]),
            guest_id=guest_id,
            user_id=str(current["_id"]) if current else None,
            payload=structured["mission"],
            status=statuses["mission_status"],
            now=now,
        )
    else:
        db = get_db_instance()
        need_doc = {**need_payload_db, "guest_id": guest_id, "user_id": current["_id"] if current else None, "created_at": now, "updated_at": now}
        need_result = await db["enterprise_needs"].insert_one(need_doc)
        need_doc["_id"] = need_result.inserted_id
        mission_doc = {
            "need_id": need_doc["_id"],
            "guest_id": guest_id,
            "user_id": current["_id"] if current else None,
            "title": structured["mission"]["title"],
            "summary": structured["mission"]["summary"],
            "deliverable": structured["mission"]["deliverable"],
            "execution_mode": structured["mission"]["execution_mode"],
            "status": statuses["mission_status"],
            "steps": structured["mission"]["steps"],
            "created_at": now,
            "updated_at": now,
        }
        mission_result = await db["enterprise_missions"].insert_one(mission_doc)
        mission_doc["_id"] = mission_result.inserted_id

    opportunity_doc: dict[str, Any] | None = None
    if recommended_mode == "publie":
        if not settings.REQUIRE_MONGO:
            opportunity_doc = create_opportunity(
                need_id=str(need_doc["_id"]),
                mission_id=str(mission_doc["_id"]),
                payload=structured["opportunity"],
                status=statuses["opportunity_status"],
                now=now,
            )
        else:
            opportunity_doc = {
                "need_id": need_doc["_id"],
                "mission_id": mission_doc["_id"],
                "type": structured["opportunity"]["type"],
                "title": structured["opportunity"]["title"],
                "summary": structured["opportunity"]["summary"],
                "status": statuses["opportunity_status"],
                "highlights": structured["opportunity"]["highlights"],
                "published_at": now,
                "created_at": now,
                "updated_at": now,
            }
            opportunity_result = await db["enterprise_opportunities"].insert_one(opportunity_doc)
            opportunity_doc["_id"] = opportunity_result.inserted_id

    return {
        "need": _serialize_need(need_doc),
        "mission": _serialize_mission(mission_doc),
        "opportunity": _serialize_opportunity(opportunity_doc),
    }


@router.get("/needs/{need_id}/matches")
async def get_need_matches(
    need_id: str,
    limit: int = 5,
):
    """Retourne les meilleurs profils talents matchant un besoin entreprise."""
    if not settings.REQUIRE_MONGO:
        return {"need_id": need_id, "matches": [], "count": 0}
    db = get_db_instance()
    result = await find_matches_for_need(need_id, db, limit=min(limit, 20))
    if result.get("error") == "need not found":
        raise HTTPException(status_code=404, detail="need not found")
    if result.get("error") == "invalid need_id":
        raise HTTPException(status_code=400, detail="invalid need_id")
    return result


@router.post("/analyse/ai", response_model=EnterpriseFileAiAnalysisResponse)
async def analyze_enterprise_file_with_ai(
    payload: EnterpriseFileAiAnalysisRequest,
):
    generated = await generate_structured_json(_build_upload_ai_prompt(payload))
    return _normalize_upload_ai_response(payload, generated)


@router.get("/opportunities/public", response_model=EnterpriseOpportunityListResponse)
async def list_public_enterprise_opportunities(
):
    if not settings.REQUIRE_MONGO:
        items = list_public_opportunities()
        return {"items": [_serialize_opportunity(item) for item in items if item]}
    db = get_db_instance()
    items = await db["enterprise_opportunities"].find({"status": "published"}).sort("published_at", -1).to_list(length=24)
    return {"items": [_serialize_opportunity(item) for item in items if item]}


@router.get("/needs")
async def list_enterprise_needs(
    current: dict | None = Depends(get_current_user_optional),
):
    """Retourne tous les besoins soumis par l'utilisateur authentifié."""
    if not current:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Connexion requise")
    if not settings.REQUIRE_MONGO:
        docs = list_user_needs(str(current["_id"]))
        return {"needs": [_serialize_need(doc) for doc in docs]}
    db = get_db_instance()
    docs = await db["enterprise_needs"].find({"user_id": current["_id"]}).sort("created_at", -1).to_list(length=50)
    return {"needs": [_serialize_need(doc) for doc in docs]}


@router.get("/needs/{need_id}", response_model=EnterpriseSubmissionResponse)
async def get_enterprise_need(
    need_id: str,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    need = await _resolve_need(need_id, request, response, current)
    if not settings.REQUIRE_MONGO:
        mission = get_mission_for_need(str(need["_id"]))
    else:
        db = get_db_instance()
        mission = await db["enterprise_missions"].find_one({"need_id": need["_id"]})
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable pour ce besoin")
    opportunity = get_opportunity_for_need(str(need["_id"])) if not settings.REQUIRE_MONGO else await db["enterprise_opportunities"].find_one({"need_id": need["_id"]})
    return {
        "need": _serialize_need(need),
        "mission": _serialize_mission(mission),
        "opportunity": _serialize_opportunity(opportunity),
    }


@router.post("/needs/{need_id}/cockpit", response_model=EnterpriseCockpitActivationResponse)
async def activate_enterprise_cockpit(
    need_id: str,
    request: Request,
    response: Response,
    current: dict | None = Depends(get_current_user_optional),
):
    need = await _resolve_need(need_id, request, response, current)
    mission = get_mission_for_need(str(need["_id"])) if not settings.REQUIRE_MONGO else await get_db_instance()["enterprise_missions"].find_one({"need_id": need["_id"]})
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable pour ce besoin")

    context_id = _enterprise_context_id(str(need["_id"]))
    redirect_url = _cockpit_url(str(need["_id"]), context_id)
    if not current:
        return {
            "status": "auth_required",
            "need_id": str(need["_id"]),
            "context_id": context_id,
            "task_query": {"context_type": "professional", "context_id": context_id},
            "redirect_url": _cockpit_login_url(str(need["_id"]), context_id),
            "binding_count": 0,
            "created_task_count": 0,
        }

    _, binding_map, created_task_count = await _ensure_cockpit_bindings(need, mission, current)
    return {
        "status": "ready",
        "need_id": str(need["_id"]),
        "context_id": context_id,
        "task_query": {"context_type": "professional", "context_id": context_id},
        "redirect_url": redirect_url,
        "binding_count": len(binding_map),
        "created_task_count": created_task_count,
    }


@router.get("/needs/{need_id}/cockpit", response_model=EnterpriseCockpitContextResponse)
async def get_enterprise_cockpit_context(
    need_id: str,
    request: Request,
    current: dict | None = Depends(get_current_user_optional),
):
    if not current:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Connexion requise pour le cockpit entreprise")

    need = await _resolve_need(need_id, request, None, current)
    mission = get_mission_for_need(str(need["_id"])) if not settings.REQUIRE_MONGO else await get_db_instance()["enterprise_missions"].find_one({"need_id": need["_id"]})
    if not mission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mission introuvable pour ce besoin")
    opportunity = get_opportunity_for_need(str(need["_id"])) if not settings.REQUIRE_MONGO else await get_db_instance()["enterprise_opportunities"].find_one({"need_id": need["_id"]})
    context_id, binding_map, _ = await _ensure_cockpit_bindings(need, mission, current)
    return _serialize_cockpit_context(need, mission, opportunity, context_id, binding_map)

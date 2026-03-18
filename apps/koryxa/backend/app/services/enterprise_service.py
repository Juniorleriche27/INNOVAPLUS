from __future__ import annotations

from typing import Any

from app.services.ai_json import generate_structured_json


def _derive_opportunity_type(need_type: str) -> str:
    normalized = (need_type or "").strip().lower()
    if normalized == "stage":
        return "stage"
    if normalized == "collaboration":
        return "collaboration"
    if normalized in {"recherche", "coordination", "automatisation"}:
        return "project"
    if normalized == "support":
        return "accompagnement"
    return "mission"


def _treatment_need_status(treatment_mode: str) -> str:
    if treatment_mode == "publie":
        return "published"
    return "qualified"


def _treatment_mission_status(treatment_mode: str) -> str:
    if treatment_mode == "accompagne":
        return "in_progress"
    if treatment_mode == "publie":
        return "ready"
    return "structured"


def _fallback_structure(payload: dict[str, Any]) -> dict[str, Any]:
    treatment_mode = payload["treatment_mode"]
    opportunity_type = _derive_opportunity_type(payload["need_type"])
    qualification_score = 78 if treatment_mode == "accompagne" else 72 if treatment_mode == "publie" else 68
    clarity_level = "strong" if treatment_mode == "accompagne" else "qualified"
    need_summary = (
        f"Besoin {payload['need_type']} pour {payload['organisation']} : {payload['title']}. "
        f"Le contexte principal est {payload['context'].strip().rstrip('.')}. "
        f"Le livrable attendu est {payload['expected_deliverable'].strip().rstrip('.')}"
    )
    mission_title = payload["title"].strip()
    opportunity_title = mission_title
    return {
        "need_summary": need_summary,
        "qualification_score": qualification_score,
        "clarity_level": clarity_level,
        "mission": {
            "title": mission_title,
            "summary": f"Mission structurée autour de {payload['need_type']} avec un résultat attendu clair pour {payload['organisation']}.",
            "deliverable": payload["expected_deliverable"],
            "execution_mode": treatment_mode,
            "steps": [
                "Clarifier le périmètre exact",
                "Lancer le lot de travail prioritaire",
                "Restituer un livrable exploitable",
            ],
        },
        "opportunity": {
            "type": opportunity_type,
            "title": opportunity_title,
            "summary": f"Opportunité publiée issue d'un besoin déjà cadré pour {payload['organisation']}.",
            "highlights": [
                opportunity_type,
                payload["expected_deliverable"],
                payload["urgency"],
            ],
        },
    }


def _coerce_structure(generated: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    mission = generated.get("mission") if isinstance(generated.get("mission"), dict) else {}
    opportunity = generated.get("opportunity") if isinstance(generated.get("opportunity"), dict) else {}
    steps = mission.get("steps") if isinstance(mission.get("steps"), list) else []
    highlights = opportunity.get("highlights") if isinstance(opportunity.get("highlights"), list) else []

    qualification_score = generated.get("qualification_score")
    if not isinstance(qualification_score, int):
        qualification_score = fallback["qualification_score"]

    return {
        "need_summary": str(generated.get("need_summary") or "").strip() or fallback["need_summary"],
        "qualification_score": max(0, min(100, qualification_score)),
        "clarity_level": str(generated.get("clarity_level") or "").strip() or fallback["clarity_level"],
        "mission": {
            "title": str(mission.get("title") or "").strip() or fallback["mission"]["title"],
            "summary": str(mission.get("summary") or "").strip() or fallback["mission"]["summary"],
            "deliverable": str(mission.get("deliverable") or "").strip() or fallback["mission"]["deliverable"],
            "execution_mode": str(mission.get("execution_mode") or "").strip() or fallback["mission"]["execution_mode"],
            "steps": [str(step).strip() for step in steps if str(step).strip()] or fallback["mission"]["steps"],
        },
        "opportunity": {
            "type": (
                str(opportunity.get("type") or "").strip().lower()
                if str(opportunity.get("type") or "").strip().lower() in {"mission", "stage", "collaboration", "project", "accompagnement"}
                else fallback["opportunity"]["type"]
            ),
            "title": str(opportunity.get("title") or "").strip() or fallback["opportunity"]["title"],
            "summary": str(opportunity.get("summary") or "").strip() or fallback["opportunity"]["summary"],
            "highlights": [str(item).strip() for item in highlights if str(item).strip()] or fallback["opportunity"]["highlights"],
        },
    }


async def structure_enterprise_need(payload: dict[str, Any]) -> dict[str, Any]:
    fallback = _fallback_structure(payload)
    prompt = f"""
Tu aides KORYXA Entreprise a transformer un besoin en mission structurée.
Retourne uniquement un JSON objet.

Besoin brut:
- organisation: {payload["organisation"]}
- pays: {payload["country"]}
- domaine: {payload["domain"]}
- titre: {payload["title"]}
- type de besoin: {payload["need_type"]}
- urgence: {payload["urgency"]}
- mode de traitement: {payload["treatment_mode"]}
- contexte: {payload["context"]}
- description: {payload["description"]}
- livrable attendu: {payload["expected_deliverable"]}

JSON attendu:
{{
  "need_summary": "string",
  "qualification_score": 0,
  "clarity_level": "initial|qualified|strong",
  "mission": {{
    "title": "string",
    "summary": "string",
    "deliverable": "string",
    "execution_mode": "prive|publie|accompagne",
    "steps": ["string", "string", "string"]
  }},
  "opportunity": {{
    "type": "mission|stage|collaboration|project|accompagnement",
    "title": "string",
    "summary": "string",
    "highlights": ["string", "string", "string"]
  }}
}}

Exigences:
- besoin distinct de la mission
- mission exploitable et plus claire que le brief initial
- opportunite seulement si le besoin peut etre publie
- pas de texte hors JSON
""".strip()
    generated = await generate_structured_json(prompt)
    if not generated:
        return fallback
    return _coerce_structure(generated, fallback)


def derive_statuses(payload: dict[str, Any]) -> dict[str, str]:
    return {
        "need_status": _treatment_need_status(payload["treatment_mode"]),
        "mission_status": _treatment_mission_status(payload["treatment_mode"]),
        "opportunity_status": "published" if payload["treatment_mode"] == "publie" else "draft",
    }

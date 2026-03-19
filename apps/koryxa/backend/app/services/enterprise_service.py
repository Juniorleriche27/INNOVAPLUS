from __future__ import annotations

from typing import Any

from app.services.ai_json import generate_structured_json


def _normalized(value: str | None) -> str:
    return " ".join((value or "").strip().split())


def _recommended_treatment_mode(preference: str) -> str:
    normalized = _normalized(preference).lower()
    if "priv" in normalized:
        return "prive"
    if "publ" in normalized or "opportunit" in normalized:
        return "publie"
    return "accompagne"


def _derive_opportunity_type(need_type: str) -> str:
    normalized = _normalized(need_type).lower()
    if "stage" in normalized:
        return "stage"
    if "collaboration" in normalized:
        return "collaboration"
    if "automatisation" in normalized or "projet" in normalized:
        return "project"
    if "appui" in normalized:
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


def _derived_title(payload: dict[str, Any]) -> str:
    primary_goal = _normalized(payload["primary_goal"])
    expected_result = _normalized(payload["expected_result"])
    return f"{primary_goal} • {expected_result}"


def _fallback_next_action(recommended_mode: str) -> str:
    if recommended_mode == "publie":
        return "Relire la mission structurée avant publication et ouvrir le cockpit entreprise."
    if recommended_mode == "prive":
        return "Valider le besoin structuré puis ouvrir le cockpit pour organiser l'exécution."
    return "Passer par un cadrage accompagné puis ouvrir le cockpit d'exécution."


def _fallback_structure(payload: dict[str, Any]) -> dict[str, Any]:
    recommended_mode = _recommended_treatment_mode(payload["treatment_preference"])
    opportunity_type = _derive_opportunity_type(payload["need_type"])
    qualification_score = 82 if recommended_mode == "accompagne" else 76 if recommended_mode == "publie" else 70
    clarity_level = "strong" if recommended_mode == "accompagne" else "qualified"
    title = _derived_title(payload)
    need_summary = (
        f"L'objectif principal est {_normalized(payload['primary_goal']).lower()}. "
        f"Le besoin ressemble à {_normalized(payload['need_type']).lower()} avec un résultat attendu centré sur "
        f"{_normalized(payload['expected_result']).lower()}. "
        f"Le cadre actuel correspond à {_normalized(payload['team_context']).lower()}."
    )
    return {
        "title": title,
        "need_summary": need_summary,
        "qualification_score": qualification_score,
        "clarity_level": clarity_level,
        "recommended_treatment_mode": recommended_mode,
        "next_recommended_action": _fallback_next_action(recommended_mode),
        "mission": {
            "title": f"Mission : {title}",
            "summary": "Mission structurée à partir d'un objectif business clarifié et d'un besoin opérationnel qualifié.",
            "deliverable": _normalized(payload["expected_result"]),
            "execution_mode": recommended_mode,
            "steps": [
                "Clarifier le périmètre et les critères de réussite",
                "Lancer le lot de travail prioritaire",
                "Restituer un livrable exploitable et relire la suite",
            ],
        },
        "opportunity": {
            "type": opportunity_type,
            "title": title,
            "summary": "Opportunité publiée à partir d'un besoin déjà structuré et lisible.",
            "highlights": [
                _normalized(payload["need_type"]),
                _normalized(payload["expected_result"]),
                _normalized(payload["urgency"]),
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

    recommended_mode = _normalized(str(generated.get("recommended_treatment_mode") or ""))
    if recommended_mode not in {"prive", "publie", "accompagne"}:
        recommended_mode = fallback["recommended_treatment_mode"]

    return {
        "title": _normalized(str(generated.get("title") or "")) or fallback["title"],
        "need_summary": _normalized(str(generated.get("need_summary") or "")) or fallback["need_summary"],
        "qualification_score": max(0, min(100, qualification_score)),
        "clarity_level": _normalized(str(generated.get("clarity_level") or "")) or fallback["clarity_level"],
        "recommended_treatment_mode": recommended_mode,
        "next_recommended_action": _normalized(str(generated.get("next_recommended_action") or "")) or fallback["next_recommended_action"],
        "mission": {
            "title": _normalized(str(mission.get("title") or "")) or fallback["mission"]["title"],
            "summary": _normalized(str(mission.get("summary") or "")) or fallback["mission"]["summary"],
            "deliverable": _normalized(str(mission.get("deliverable") or "")) or fallback["mission"]["deliverable"],
            "execution_mode": (
                _normalized(str(mission.get("execution_mode") or ""))
                if _normalized(str(mission.get("execution_mode") or "")) in {"prive", "publie", "accompagne"}
                else fallback["mission"]["execution_mode"]
            ),
            "steps": [_normalized(str(step)) for step in steps if _normalized(str(step))] or fallback["mission"]["steps"],
        },
        "opportunity": {
            "type": (
                _normalized(str(opportunity.get("type") or "")).lower()
                if _normalized(str(opportunity.get("type") or "")).lower() in {"mission", "stage", "collaboration", "project", "accompagnement"}
                else fallback["opportunity"]["type"]
            ),
            "title": _normalized(str(opportunity.get("title") or "")) or fallback["opportunity"]["title"],
            "summary": _normalized(str(opportunity.get("summary") or "")) or fallback["opportunity"]["summary"],
            "highlights": [_normalized(str(item)) for item in highlights if _normalized(str(item))] or fallback["opportunity"]["highlights"],
        },
    }


async def structure_enterprise_need(payload: dict[str, Any]) -> dict[str, Any]:
    fallback = _fallback_structure(payload)
    prompt = f"""
Tu aides KORYXA Entreprise a transformer un objectif business en besoin clair et mission exploitable.
Retourne uniquement un JSON objet.

Profil entreprise:
- objectif principal: {payload["primary_goal"]}
- type de besoin: {payload["need_type"]}
- resultat attendu: {payload["expected_result"]}
- urgence: {payload["urgency"]}
- preference de traitement: {payload["treatment_preference"]}
- contexte d'equipe: {payload["team_context"]}
- accompagnement souhaite: {payload["support_preference"]}
- brief libre: {payload.get("short_brief") or "non precise"}

JSON attendu:
{{
  "title": "string",
  "need_summary": "string",
  "qualification_score": 0,
  "clarity_level": "initial|qualified|strong",
  "recommended_treatment_mode": "prive|publie|accompagne",
  "next_recommended_action": "string",
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
- partir d'un objectif business ou operationnel, pas d'un besoin RH par defaut
- besoin distinct de la mission
- mission plus claire et exploitable que le brief initial
- publication seulement si pertinente
- pas de texte hors JSON
""".strip()
    generated = await generate_structured_json(prompt)
    if not generated:
        return fallback
    return _coerce_structure(generated, fallback)


def derive_statuses(recommended_treatment_mode: str) -> dict[str, str]:
    return {
        "need_status": _treatment_need_status(recommended_treatment_mode),
        "mission_status": _treatment_mission_status(recommended_treatment_mode),
        "opportunity_status": "published" if recommended_treatment_mode == "publie" else "draft",
    }

from __future__ import annotations

import logging
from typing import Any

from app.services.ai_json import generate_structured_json


logger = logging.getLogger(__name__)


def _clean_list(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for value in values:
        item = " ".join((value or "").strip().split())
        if not item:
            continue
        lowered = item.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        cleaned.append(item)
    return cleaned[:5]


def _score_level(level: str) -> int:
    normalized = (level or "").strip().lower()
    if "av" in normalized or "expert" in normalized:
        return 72
    if "inter" in normalized or "confirm" in normalized:
        return 54
    return 36


def _score_rhythm(rhythm: str) -> int:
    normalized = (rhythm or "").strip().lower()
    if "10" in normalized or "+" in normalized:
        return 18
    if "7" in normalized:
        return 13
    if "4" in normalized or "5" in normalized or "6" in normalized:
        return 9
    return 5


def _build_readiness(score: int) -> tuple[str, str]:
    if score >= 75:
        return "Prêt à activer une mission", "validated"
    if score >= 58:
        return "Base crédible à consolider", "in_progress"
    return "Socle à structurer", "initial"


def _fallback_resource_types(domain_interest: str, preferences: list[str]) -> list[dict[str, str]]:
    domain = (domain_interest or "général").strip()
    pref_set = {p.lower() for p in preferences}
    items = [
        {
            "type": "Organisme partenaire",
            "label": f"Organisme orienté {domain}",
            "reason": "Utile pour cadrer un socle méthodique et une progression plus régulière.",
        },
        {
            "type": "Plateforme partenaire",
            "label": f"Plateforme pratique {domain}",
            "reason": "Pertinente pour avancer sur des cas concrets et des missions courtes.",
        },
    ]
    if any("coach" in pref or "feedback" in pref for pref in pref_set):
        items.append(
            {
                "type": "Coach indépendant",
                "label": f"Coach de progression {domain}",
                "reason": "Adapté si le besoin principal est le feedback, le rythme et la validation.",
            }
        )
    else:
        items.append(
            {
                "type": "Coach indépendant",
                "label": "Coach de cadrage hebdomadaire",
                "reason": "Utile pour garder le cap, prioriser les étapes et rendre la progression visible.",
            }
        )
    return items


def build_fallback_diagnostic(onboarding: dict[str, Any]) -> dict[str, Any]:
    constraints = _clean_list(list(onboarding.get("constraints") or []))
    preferences = _clean_list(list(onboarding.get("preferences") or []))
    objective = (onboarding.get("objective") or "").strip()
    domain_interest = (onboarding.get("domain_interest") or "").strip()
    target_outcome = (onboarding.get("target_outcome") or "").strip()
    current_level = (onboarding.get("current_level") or "").strip()
    weekly_rhythm = (onboarding.get("weekly_rhythm") or "").strip()
    name = (onboarding.get("name") or "").strip()

    score = max(25, min(92, _score_level(current_level) + _score_rhythm(weekly_rhythm) - min(len(constraints) * 4, 12) + min(len(preferences) * 2, 6)))
    readiness_label, validation_status = _build_readiness(score)
    trajectory_title = f"Trajectoire {domain_interest or 'orientée action'}"
    objective_suffix = f" pour {target_outcome}" if target_outcome else ""
    greeting = f"{name}, " if name else ""

    return {
        "profile_summary": (
            f"{greeting}vous cherchez à progresser en {domain_interest or 'compétences utiles'} avec un objectif centré sur "
            f"{objective.lower() if objective else 'une montée en compétence actionnable'}. "
            f"Votre niveau actuel est évalué comme {current_level.lower() or 'à préciser'} et votre rythme disponible ressemble à {weekly_rhythm.lower() or 'un rythme progressif'}."
        ),
        "recommended_trajectory": {
            "title": trajectory_title,
            "rationale": (
                f"La priorité est de transformer l'objectif en étapes concrètes, de sécuriser un rythme réaliste et de "
                f"relier rapidement la progression à des missions ou opportunités utiles{objective_suffix}."
            ),
            "mission_focus": "Cas réels, preuves de progression et préparation à une mission courte.",
        },
        "recommended_resources": _fallback_resource_types(domain_interest, preferences),
        "next_steps": _clean_list(
            [
                f"Clarifier le premier livrable concret lié à {objective or 'votre objectif'}",
                f"Activer une ressource partenaire adaptée au domaine {domain_interest or 'ciblé'}",
                "Planifier un point de validation intermédiaire avec preuves de progression",
                f"Préparer une première exposition à une mission ou opportunité {target_outcome.lower() if target_outcome else 'pertinente'}",
            ]
        ),
        "readiness": {
            "score": score,
            "label": readiness_label,
            "validation_status": validation_status,
        },
        "target_opportunities": _clean_list(
            [
                f"Mission {domain_interest or 'opérationnelle'} courte",
                "Stage orienté exécution",
                "Collaboration encadrée",
            ]
        ),
        "progress_steps": [
            {
                "key": "onboarding",
                "title": "Onboarding finalisé",
                "status": "done",
                "detail": "Le profil, l'objectif et les contraintes ont été capturés.",
            },
            {
                "key": "diagnostic",
                "title": "Diagnostic initial produit",
                "status": "done",
                "detail": "La trajectoire recommandée et le score initial sont disponibles.",
            },
            {
                "key": "resource_activation",
                "title": "Activer la première ressource partenaire",
                "status": "todo",
                "detail": "Choisir l'organisme, la plateforme ou le coach le plus pertinent.",
            },
            {
                "key": "validation",
                "title": "Préparer une première validation",
                "status": "todo",
                "detail": "Structurer une preuve de progression ou un livrable défendable.",
            },
            {
                "key": "opportunity_readiness",
                "title": "Viser une opportunité cible",
                "status": "todo",
                "detail": "Relier la progression à une mission, un stage ou une collaboration.",
            },
        ],
    }


def _coerce_diagnostic(payload: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    readiness = payload.get("readiness") if isinstance(payload.get("readiness"), dict) else {}
    recommended = payload.get("recommended_trajectory") if isinstance(payload.get("recommended_trajectory"), dict) else {}
    resources = payload.get("recommended_resources") if isinstance(payload.get("recommended_resources"), list) else []
    next_steps = payload.get("next_steps") if isinstance(payload.get("next_steps"), list) else []
    target_opportunities = payload.get("target_opportunities") if isinstance(payload.get("target_opportunities"), list) else []
    progress_steps = payload.get("progress_steps") if isinstance(payload.get("progress_steps"), list) else []

    score = readiness.get("score")
    if not isinstance(score, int):
        score = fallback["readiness"]["score"]
    score = max(0, min(100, score))
    readiness_label = readiness.get("label") if isinstance(readiness.get("label"), str) and readiness.get("label").strip() else fallback["readiness"]["label"]
    validation_status = readiness.get("validation_status") if isinstance(readiness.get("validation_status"), str) and readiness.get("validation_status").strip() else fallback["readiness"]["validation_status"]

    normalized_resources = []
    for item in resources[:3]:
        if not isinstance(item, dict):
            continue
        normalized_resources.append(
            {
                "type": str(item.get("type") or "").strip() or "Ressource partenaire",
                "label": str(item.get("label") or "").strip() or "Ressource recommandée",
                "reason": str(item.get("reason") or "").strip() or "Pertinente pour avancer avec un cadre plus clair.",
            }
        )
    if not normalized_resources:
        normalized_resources = fallback["recommended_resources"]

    normalized_steps = []
    for item in progress_steps[:5]:
        if not isinstance(item, dict):
            continue
        normalized_steps.append(
            {
                "key": str(item.get("key") or "").strip() or "custom_step",
                "title": str(item.get("title") or "").strip() or "Étape",
                "status": str(item.get("status") or "").strip() if str(item.get("status") or "").strip() in {"todo", "in_progress", "done"} else "todo",
                "detail": str(item.get("detail") or "").strip() or "Étape de progression.",
                "proof": str(item.get("proof") or "").strip() or None,
            }
        )
    if not normalized_steps:
        normalized_steps = fallback["progress_steps"]

    return {
        "profile_summary": str(payload.get("profile_summary") or "").strip() or fallback["profile_summary"],
        "recommended_trajectory": {
            "title": str(recommended.get("title") or "").strip() or fallback["recommended_trajectory"]["title"],
            "rationale": str(recommended.get("rationale") or "").strip() or fallback["recommended_trajectory"]["rationale"],
            "mission_focus": str(recommended.get("mission_focus") or "").strip() or fallback["recommended_trajectory"]["mission_focus"],
        },
        "recommended_resources": normalized_resources,
        "next_steps": _clean_list([str(item) for item in next_steps]) or fallback["next_steps"],
        "readiness": {
            "score": score,
            "label": readiness_label,
            "validation_status": validation_status,
        },
        "target_opportunities": _clean_list([str(item) for item in target_opportunities]) or fallback["target_opportunities"],
        "progress_steps": normalized_steps,
    }


async def build_trajectory_diagnostic(onboarding: dict[str, Any]) -> dict[str, Any]:
    fallback = build_fallback_diagnostic(onboarding)
    constraints = ", ".join(onboarding.get("constraints") or []) or "aucune contrainte précisée"
    preferences = ", ".join(onboarding.get("preferences") or []) or "aucune préférence précisée"
    prompt = f"""
Tu aides KORYXA a produire un diagnostic de trajectoire. Retourne uniquement un JSON objet.

Profil:
- objectif: {onboarding.get("objective")}
- niveau actuel: {onboarding.get("current_level")}
- domaine d'interet: {onboarding.get("domain_interest")}
- rythme disponible: {onboarding.get("weekly_rhythm")}
- objectif final: {onboarding.get("target_outcome") or "non precise"}
- contexte: {onboarding.get("context") or "non precise"}
- contraintes: {constraints}
- preferences: {preferences}

Le JSON doit suivre strictement cette structure:
{{
  "profile_summary": "string",
  "recommended_trajectory": {{
    "title": "string",
    "rationale": "string",
    "mission_focus": "string"
  }},
  "recommended_resources": [
    {{"type": "string", "label": "string", "reason": "string"}}
  ],
  "next_steps": ["string", "string", "string"],
  "readiness": {{
    "score": 0,
    "label": "string",
    "validation_status": "initial|in_progress|validated"
  }},
  "target_opportunities": ["string", "string"],
  "progress_steps": [
    {{"key": "string", "title": "string", "status": "todo|in_progress|done", "detail": "string"}}
  ]
}}

Exigences:
- resultat lisible et concret
- orientation vers partenaires/types de ressources
- prochaines etapes actionnables
- opportunites cibles plausibles
- pas de texte hors JSON
""".strip()

    generated = await generate_structured_json(prompt)
    if not generated:
        return fallback
    return _coerce_diagnostic(generated, fallback)

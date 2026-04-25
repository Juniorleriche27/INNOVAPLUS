from __future__ import annotations

import copy
import json
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.core.config import settings
from app.services.partner_registry import recommend_partners_from_catalog
from app.services.ai_json import generate_structured_json


logger = logging.getLogger(__name__)

VALIDATION_LEVEL_ORDER = {
    "initial": 0,
    "building": 1,
    "validated": 2,
    "advanced": 3,
}


class BlueprintAIGenerationError(RuntimeError):
    """Raised when Blueprint cannot produce a real AI diagnostic."""


def _resolve_blueprint_provider() -> str:
    provider_name = (settings.CHAT_PROVIDER or settings.LLM_PROVIDER or "cohere").strip().lower()
    if provider_name in {"local", "smollm", "chatlaya"}:
        return "cohere" if settings.COHERE_API_KEY else "echo"
    return provider_name or "echo"


def _ensure_blueprint_ai_ready() -> None:
    provider_name = _resolve_blueprint_provider()
    if provider_name != "cohere":
        raise BlueprintAIGenerationError(
            f"Blueprint requiert Cohere. Provider actuel: {provider_name or 'inconnu'}."
        )
    if not settings.COHERE_API_KEY:
        raise BlueprintAIGenerationError(
            "Blueprint requiert Cohere, mais COHERE_API_KEY n'est pas configure cote backend."
        )


def _clean_list(values: list[str], limit: int = 5) -> list[str]:
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
    return cleaned[:limit]


def _clean_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _onboarding_list(onboarding: dict[str, Any], key: str, *, limit: int = 12) -> list[str]:
    raw = onboarding.get(key)
    if not isinstance(raw, list):
        return []
    return _clean_list([str(item) for item in raw], limit=limit)


def _primary_target_role(onboarding: dict[str, Any]) -> str:
    target_roles = _onboarding_list(onboarding, "target_roles", limit=2)
    exercise_signal = _exercise_role_signal(onboarding)
    if exercise_signal and (not target_roles or target_roles[0].lower() in {"je ne sais pas encore", "role a clarifier"}):
        return exercise_signal
    if target_roles:
        return target_roles[0]
    target_outcome = _clean_text(onboarding.get("target_outcome"))
    if target_outcome:
        return target_outcome
    return _clean_text(onboarding.get("domain_interest"))


def _exercise_role_signal(onboarding: dict[str, Any]) -> str:
    results = " ".join(_onboarding_list(onboarding, "exercise_results", limit=12)).lower()
    if not results:
        return ""

    scores = {
        "Data Analyst IA": 0,
        "AI Automation Builder": 0,
        "AI Marketing Operator": 0,
        "Consultant ou Freelance IA": 0,
    }

    if any(token in results for token in {"data_first", "seek_data_signal", "dashboard_reflex"}):
        scores["Data Analyst IA"] += 3
    if any(token in results for token in {"workflow_first", "seek_process_signal", "automation_reflex"}):
        scores["AI Automation Builder"] += 3
    if any(token in results for token in {"content_first", "seek_message_signal"}):
        scores["AI Marketing Operator"] += 3
    if "client_reflex" in results:
        scores["Consultant ou Freelance IA"] += 3
    if "no_response" in results:
        scores["Consultant ou Freelance IA"] -= 1

    role, score = max(scores.items(), key=lambda item: item[1])
    return role if score >= 3 else ""


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


def _readiness_label(score: int) -> tuple[str, str]:
    if score >= 80:
        return "Prêt à activer une mission qualifiée", "validated"
    if score >= 62:
        return "Base crédible à consolider", "in_progress"
    return "Socle à structurer", "initial"


def _validation_level(progress_score: int, readiness_score: int, validated_proofs: int) -> str:
    if readiness_score >= 82 and validated_proofs >= 4:
        return "advanced"
    if readiness_score >= 68 and validated_proofs >= 2:
        return "validated"
    if progress_score >= 28 or validated_proofs >= 1:
        return "building"
    return "initial"


def _fallback_resource_types(domain_interest: str, preferences: list[str]) -> list[dict[str, str]]:
    domain = (domain_interest or "général").strip()
    pref_set = {p.lower() for p in preferences}
    items = [
        {
            "type": "Ressource guidée",
            "label": f"Cadre méthodique {domain}",
            "reason": "Utile pour clarifier les bases et fixer un rythme réaliste.",
        },
        {
            "type": "Ressource pratique",
            "label": f"Cas réels {domain}",
            "reason": "Pertinente pour produire des livrables concrets et des preuves exploitables.",
        },
    ]
    if any("coach" in pref or "feedback" in pref for pref in pref_set):
        items.append(
            {
                "type": "Ressource d'accompagnement",
                "label": "Boucle de feedback régulière",
                "reason": "Adaptée si la progression a besoin d'accompagnement et de retours fréquents.",
            }
        )
    else:
        items.append(
            {
                "type": "Ressource d'exécution",
                "label": "Sprint de progression pilotée",
                "reason": "Utile pour transformer rapidement l'objectif en étapes actionnables.",
            }
        )
    return items


def _fallback_partner_recommendations(onboarding: dict[str, Any]) -> list[dict[str, Any]]:
    domain = (onboarding.get("domain_interest") or "général").strip()
    rhythm = (onboarding.get("weekly_rhythm") or "").strip() or "Rythme adaptable"
    preferences = [item.lower() for item in onboarding.get("preferences") or []]
    proof_fit = ["link", "summary_note", "project_submission"]
    return [
        {
            "type": "organisme",
            "label": f"Organisme partenaire {domain}",
            "reason": "Pertinent pour couvrir le socle méthodique et des validations structurées.",
            "match_score": 82,
            "formats": ["cohorte", "distanciel"],
            "languages": ["français"],
            "price_hint": "budget intermédiaire",
            "proof_fit": proof_fit,
        },
        {
            "type": "plateforme",
            "label": f"Plateforme pratique {domain}",
            "reason": "Recommandée pour avancer sur des cas concrets à votre rythme.",
            "match_score": 76,
            "formats": ["asynchrone", rhythm.lower()],
            "languages": ["français", "anglais"],
            "price_hint": "budget flexible",
            "proof_fit": ["link", "project_submission", "screenshot"],
        },
        {
            "type": "coach",
            "label": f"Coach de progression {domain}",
            "reason": "Utile pour relire les preuves, garder le cap et accélérer la validation.",
            "match_score": 79 if any("feedback" in pref or "coach" in pref for pref in preferences) else 71,
            "formats": ["1:1", "visio"],
            "languages": ["français"],
            "price_hint": "budget ciblé",
            "proof_fit": ["structured_answer", "summary_note", "mini_deliverable"],
        },
    ]


def _build_fallback_plan(onboarding: dict[str, Any], target_goal: str) -> dict[str, Any]:
    domain = (onboarding.get("domain_interest") or "orientation").strip()
    objective = (onboarding.get("objective") or "").strip()
    return {
        "title": f"Plan de progression {domain}",
        "target_goal": target_goal,
        "access_level": "free",
        "plan_tier": "starter",
        "skills_to_cover": _clean_list(
            [
                f"Priorisation {domain}",
                f"Exécution {domain}",
                "Structuration d'un livrable",
                "Validation par preuves",
            ],
            limit=6,
        ),
        "stages": [
            {
                "key": "cadrage",
                "title": "Cadrer la trajectoire",
                "objective": "Transformer l'objectif en première ligne d'action claire.",
                "order": 1,
                "access_level": "free",
                "tasks": [
                    {
                        "key": "align_goal",
                        "title": "Fixer l'objectif prioritaire",
                        "description": f"Transformer {objective.lower() if objective else 'l’objectif'} en cible opérationnelle.",
                        "proof_required": False,
                        "expected_proof_types": [],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Formuler le premier résultat concret attendu.",
                    },
                    {
                        "key": "select_support",
                        "title": "Choisir le bon partenaire ou support",
                        "description": "Activer l'organisme, la plateforme ou le coach le plus pertinent pour démarrer.",
                        "proof_required": True,
                        "expected_proof_types": ["link", "structured_answer", "summary_note"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Sélectionner une ressource et justifier ce choix.",
                    },
                ],
            },
            {
                "key": "execution",
                "title": "Produire des preuves de progression",
                "objective": "Transformer la trajectoire en tâches concrètes et en premières preuves.",
                "order": 2,
                "access_level": "free",
                "tasks": [
                    {
                        "key": "first_deliverable",
                        "title": "Construire un premier mini-livrable",
                        "description": "Produire une sortie simple mais défendable liée à la trajectoire.",
                        "proof_required": True,
                        "expected_proof_types": ["mini_deliverable", "project_submission", "file", "link"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Soumettre un premier livrable ou un lien de démonstration.",
                    },
                    {
                        "key": "reflection_note",
                        "title": "Formaliser ce qui a été appris",
                        "description": "Décrire ce qui a été fait, ce qui manque encore et la suite logique.",
                        "proof_required": True,
                        "expected_proof_types": ["short_text", "structured_answer", "summary_note"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Rédiger une note courte de progression.",
                    },
                ],
            },
            {
                "key": "validation",
                "title": "Valider et ouvrir vers l'opportunité",
                "objective": "Mesurer la readiness et préparer un profil vérifié KORYXA.",
                "order": 3,
                "access_level": "premium",
                "tasks": [
                    {
                        "key": "validation_checkpoint",
                        "title": "Atteindre un premier jalon validé",
                        "description": "Consolider au moins deux preuves validées pour renforcer la readiness.",
                        "proof_required": True,
                        "expected_proof_types": ["project_submission", "summary_note", "link"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Ajouter des preuves assez solides pour passer en éligible.",
                    },
                    {
                        "key": "verified_profile_export",
                        "title": "Préparer le profil vérifié KORYXA",
                        "description": "Débloquer le profil ou CV vérifié lorsque les critères sont remplis.",
                        "proof_required": False,
                        "expected_proof_types": [],
                        "access_level": "premium",
                        "feature_gate": "verified_profile_export",
                        "next_action": "Débloquer l'export quand l'état eligible ou verified est atteint.",
                    },
                ],
            },
        ],
        "milestones": [
            "Objectif cadré",
            "Première preuve validée",
            "Éligibilité opportunités",
            "Profil KORYXA Verified",
        ],
    }


def _build_blueprint_fallback_plan(onboarding: dict[str, Any], target_goal: str) -> dict[str, Any]:
    domain = _clean_text(onboarding.get("domain_interest")) or "orientation"
    objective = _clean_text(onboarding.get("objective"))
    project_topic = _clean_text(onboarding.get("project_topic"))
    success_metric = _clean_text(onboarding.get("success_metric"))
    target_role = _primary_target_role(onboarding) or domain
    existing_skills = {item.lower() for item in _onboarding_list(onboarding, "existing_skills")}
    portfolio_status = _clean_text(onboarding.get("portfolio_status")).lower()

    suggested_skills = [
        f"Fondamentaux {target_role}",
        "Construction de preuves",
        "Execution sur cas reel",
        "Narration de progression",
    ]
    if "data analyst" in target_role.lower():
        if "sql" not in existing_skills:
            suggested_skills.append("SQL applique")
        if "python" not in existing_skills:
            suggested_skills.append("Python pour l'analyse")
    if "automation" in target_role.lower() or "ops" in target_role.lower():
        suggested_skills.append("Automatisation et workflows IA")
    if "marketing" in target_role.lower() or "content" in target_role.lower():
        suggested_skills.append("Production de contenu assistee par IA")

    proof_task_title = "Construire une premiere preuve visible"
    proof_task_description = "Produire une sortie simple mais defendable liee a votre trajectoire."
    if portfolio_status:
        if "aucun" in portfolio_status or "rien" in portfolio_status:
            proof_task_title = "Creer un premier livrable visible"
            proof_task_description = "Transformer les apprentissages en preuve concrete meme si vous partez sans portfolio."
        elif "mini" in portfolio_status or "projet" in portfolio_status or "note" in portfolio_status:
            proof_task_title = "Renforcer un actif existant"
            proof_task_description = "Reprendre un element deja cree et le faire monter au niveau d'une preuve defendable."

    return {
        "title": f"Blueprint {target_role}",
        "target_goal": target_goal,
        "access_level": "free",
        "plan_tier": "starter",
        "skills_to_cover": _clean_list(suggested_skills, limit=6),
        "stages": [
            {
                "key": "cadrage",
                "title": "Cadrer le role cible",
                "objective": "Transformer le diagnostic en plan realiste, calibre a votre contexte et a votre objectif.",
                "order": 1,
                "access_level": "free",
                "tasks": [
                    {
                        "key": "align_goal",
                        "title": "Fixer le cap des 90 prochains jours",
                        "description": (
                            f"Transformer {objective.lower() if objective else 'votre objectif'} en cible operationnelle, "
                            f"avec un resultat concret {success_metric.lower() if success_metric else 'a rendre visible'}."
                        ),
                        "proof_required": False,
                        "expected_proof_types": [],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Formuler le premier resultat concret et le signal de reussite attendu.",
                    },
                    {
                        "key": "select_support",
                        "title": "Choisir le cadre de progression",
                        "description": "Activer le bon support, la bonne cadence et les bonnes ressources pour demarrer sans dispersion.",
                        "proof_required": True,
                        "expected_proof_types": ["link", "structured_answer", "summary_note"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Selectionner une ressource de reference et expliquer pourquoi elle correspond a votre rythme.",
                    },
                ],
            },
            {
                "key": "execution",
                "title": "Executer sur un cas reel",
                "objective": "Produire des preuves utiles a partir d'un cas reel, d'un besoin metier ou d'un mini-projet.",
                "order": 2,
                "access_level": "free",
                "tasks": [
                    {
                        "key": "first_deliverable",
                        "title": proof_task_title,
                        "description": (
                            f"{proof_task_description} "
                            f"{('Le sujet prioritaire est ' + project_topic.lower() + '.') if project_topic else ''}"
                        ).strip(),
                        "proof_required": True,
                        "expected_proof_types": ["mini_deliverable", "project_submission", "file", "link"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Soumettre un livrable, une capture ou un lien de demonstration defendable.",
                    },
                    {
                        "key": "reflection_note",
                        "title": "Formaliser ce qui est maitrise",
                        "description": "Decrire ce qui a ete fait, ce qui manque encore et la suite logique pour monter en credibilite.",
                        "proof_required": True,
                        "expected_proof_types": ["short_text", "structured_answer", "summary_note"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Rediger une note courte qui relie apprentissage, preuve et prochaine marche.",
                    },
                ],
            },
            {
                "key": "validation",
                "title": "Valider et exposer le profil",
                "objective": "Mesurer la readiness, renforcer les preuves et preparer l'exposition a une vraie opportunite.",
                "order": 3,
                "access_level": "premium",
                "tasks": [
                    {
                        "key": "validation_checkpoint",
                        "title": "Atteindre un jalon valide",
                        "description": "Consolider au moins deux preuves validees pour renforcer la readiness et la lisibilite du profil.",
                        "proof_required": True,
                        "expected_proof_types": ["project_submission", "summary_note", "link"],
                        "access_level": "free",
                        "feature_gate": None,
                        "next_action": "Ajouter des preuves suffisamment solides pour passer en eligible.",
                    },
                    {
                        "key": "verified_profile_export",
                        "title": "Preparer le profil verifie KORYXA",
                        "description": "Debloquer le profil, l'attestation ou le CV signe lorsque les criteres sont remplis.",
                        "proof_required": False,
                        "expected_proof_types": [],
                        "access_level": "premium",
                        "feature_gate": "verified_profile_export",
                        "next_action": "Debloquer l'export quand l'etat eligible ou verified est atteint.",
                    },
                ],
            },
        ],
        "milestones": [
            "Cap des 90 jours defini",
            "Premiere preuve defendable",
            "Eligibilite opportunites",
            "Profil KORYXA Verified",
        ],
    }


def _fallback_opportunity_targets(onboarding: dict[str, Any]) -> list[dict[str, Any]]:
    domain = (onboarding.get("domain_interest") or "général").strip()
    target = (onboarding.get("target_outcome") or "opportunité utile").strip()
    return [
        {
            "label": f"Mission {domain} courte",
            "type": "mission",
            "reason": "Première exposition utile pour appliquer la trajectoire sur un besoin réel.",
            "criteria": {
                "minimum_readiness_score": 45,
                "minimum_validated_proofs": 0,
                "minimum_validation_level": "initial",
            },
        },
        {
            "label": f"Stage ou collaboration {domain}",
            "type": "stage",
            "reason": "Accessible quand la progression produit déjà des preuves crédibles.",
            "criteria": {
                "minimum_readiness_score": 62,
                "minimum_validated_proofs": 1,
                "minimum_validation_level": "building",
            },
        },
        {
            "label": target.title(),
            "type": "collaboration",
            "reason": "Doit être priorisé lorsque la readiness et la validation deviennent solides.",
            "criteria": {
                "minimum_readiness_score": 74,
                "minimum_validated_proofs": 2,
                "minimum_validation_level": "validated",
            },
        },
    ]


def _coerce_resources(resources: list[Any], fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in resources[:4]:
        if not isinstance(item, dict):
            continue
        normalized.append(
            {
                "type": str(item.get("type") or "").strip() or "Ressource recommandée",
                "label": str(item.get("label") or "").strip() or "Ressource partenaire",
                "reason": str(item.get("reason") or "").strip() or "Pertinente pour avancer avec un cadre plus clair.",
            }
        )
    return normalized or fallback


def _coerce_partners(partners: list[Any], fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in partners[:4]:
        if not isinstance(item, dict):
            continue
        partner_type = str(item.get("type") or "").strip().lower()
        if partner_type not in {"organisme", "plateforme", "coach"}:
            partner_type = "plateforme"
        match_score = item.get("match_score")
        if not isinstance(match_score, int):
            match_score = 72
        proof_fit = _clean_list([str(value) for value in item.get("proof_fit") or []], limit=4)
        normalized.append(
            {
                "type": partner_type,
                "label": str(item.get("label") or "").strip() or "Partenaire recommandé",
                "reason": str(item.get("reason") or "").strip() or "Recommandé pour cette trajectoire.",
                "match_score": max(0, min(100, match_score)),
                "formats": _clean_list([str(value) for value in item.get("formats") or []], limit=4),
                "languages": _clean_list([str(value) for value in item.get("languages") or []], limit=4),
                "price_hint": str(item.get("price_hint") or "").strip() or None,
                "proof_fit": [value for value in proof_fit if value in {
                    "link",
                    "file",
                    "short_text",
                    "structured_answer",
                    "mini_deliverable",
                    "screenshot",
                    "project_submission",
                    "summary_note",
                }],
            }
        )
    return normalized or fallback


def _coerce_plan(plan: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    stages = plan.get("stages") if isinstance(plan.get("stages"), list) else []
    normalized_stages: list[dict[str, Any]] = []
    for stage_index, stage in enumerate(stages[:4], start=1):
        if not isinstance(stage, dict):
            continue
        tasks = stage.get("tasks") if isinstance(stage.get("tasks"), list) else []
        normalized_tasks: list[dict[str, Any]] = []
        for task in tasks[:4]:
            if not isinstance(task, dict):
                continue
            expected_proof_types = _clean_list([str(value) for value in task.get("expected_proof_types") or []], limit=4)
            normalized_tasks.append(
                {
                    "key": str(task.get("key") or "").strip() or f"task_{len(normalized_tasks) + 1}",
                    "title": str(task.get("title") or "").strip() or "Tâche",
                    "description": str(task.get("description") or "").strip() or "Action à compléter.",
                    "proof_required": bool(task.get("proof_required", False)),
                    "expected_proof_types": [
                        value for value in expected_proof_types if value in {
                            "link",
                            "file",
                            "short_text",
                            "structured_answer",
                            "mini_deliverable",
                            "screenshot",
                            "project_submission",
                            "summary_note",
                        }
                    ],
                    "access_level": str(task.get("access_level") or "").strip() if str(task.get("access_level") or "").strip() in {"free", "premium"} else "free",
                    "feature_gate": str(task.get("feature_gate") or "").strip() or None,
                    "next_action": str(task.get("next_action") or "").strip() or None,
                    "status": "todo",
                }
            )
        if not normalized_tasks:
            continue
        normalized_stages.append(
            {
                "key": str(stage.get("key") or "").strip() or f"stage_{stage_index}",
                "title": str(stage.get("title") or "").strip() or f"Étape {stage_index}",
                "objective": str(stage.get("objective") or "").strip() or "Objectif à atteindre.",
                "order": stage_index,
                "access_level": str(stage.get("access_level") or "").strip() if str(stage.get("access_level") or "").strip() in {"free", "premium"} else "free",
                "status": "todo",
                "tasks": normalized_tasks,
            }
        )

    if not normalized_stages:
        return fallback

    return {
        "title": str(plan.get("title") or "").strip() or fallback["title"],
        "target_goal": str(plan.get("target_goal") or "").strip() or fallback["target_goal"],
        "access_level": str(plan.get("access_level") or "").strip() if str(plan.get("access_level") or "").strip() in {"free", "premium"} else fallback["access_level"],
        "plan_tier": str(plan.get("plan_tier") or "").strip() or fallback["plan_tier"],
        "skills_to_cover": _clean_list([str(value) for value in plan.get("skills_to_cover") or []], limit=6) or fallback["skills_to_cover"],
        "stages": normalized_stages,
        "milestones": _clean_list([str(value) for value in plan.get("milestones") or []], limit=6) or fallback["milestones"],
        "next_actions": [],
        "progress_score": 0,
        "readiness_score": 0,
        "validation_level": "initial",
    }


def _coerce_opportunities(items: list[Any], fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for item in items[:5]:
        if not isinstance(item, dict):
            continue
        criteria = item.get("criteria") if isinstance(item.get("criteria"), dict) else {}
        opportunity_type = str(item.get("type") or "").strip().lower()
        if opportunity_type not in {"mission", "stage", "collaboration", "project", "accompagnement"}:
            opportunity_type = "mission"
        level = str(criteria.get("minimum_validation_level") or "").strip().lower()
        if level not in VALIDATION_LEVEL_ORDER:
            level = "initial"
        readiness_score = criteria.get("minimum_readiness_score")
        if not isinstance(readiness_score, int):
            readiness_score = 45
        min_proofs = criteria.get("minimum_validated_proofs")
        if not isinstance(min_proofs, int):
            min_proofs = 0
        normalized.append(
            {
                "label": str(item.get("label") or "").strip() or "Opportunité cible",
                "type": opportunity_type,
                "reason": str(item.get("reason") or "").strip() or "Direction plausible après progression.",
                "criteria": {
                    "minimum_readiness_score": max(0, min(100, readiness_score)),
                    "minimum_validated_proofs": max(0, min(10, min_proofs)),
                    "minimum_validation_level": level,
                },
            }
        )
    return normalized or fallback


def _base_score(onboarding: dict[str, Any]) -> int:
    constraints = list(onboarding.get("constraints") or [])
    preferences = list(onboarding.get("preferences") or [])
    existing_skills = _onboarding_list(onboarding, "existing_skills")
    exercise_results = _onboarding_list(onboarding, "exercise_results", limit=12)
    portfolio_status = _clean_text(onboarding.get("portfolio_status")).lower()
    target_roles = _onboarding_list(onboarding, "target_roles", limit=2)
    support_style = _clean_text(onboarding.get("support_style")).lower()
    skill_bonus = min(len(existing_skills) * 2, 10)
    exercise_bonus = min(sum(1 for item in exercise_results if "no_response" not in item.lower()) * 2, 6)
    portfolio_bonus = 0
    if portfolio_status:
        if "mission" in portfolio_status or "client" in portfolio_status or "reel" in portfolio_status:
            portfolio_bonus = 8
        elif "mini" in portfolio_status or "projet" in portfolio_status or "portfolio" in portfolio_status:
            portfolio_bonus = 5
        elif "note" in portfolio_status or "exercice" in portfolio_status:
            portfolio_bonus = 2
    guidance_bonus = 2 if "guide" in support_style or "validation" in support_style else 0
    role_bonus = 2 if target_roles else 0
    return max(
        25,
        min(
            92,
            _score_level(onboarding.get("current_level") or "")
            + _score_rhythm(onboarding.get("weekly_rhythm") or "")
            - min(len(constraints) * 4, 12)
            + min(len(preferences) * 2, 6)
            + skill_bonus
            + exercise_bonus
            + portfolio_bonus
            + guidance_bonus
            + role_bonus
        ),
    )


def _fallback_package(onboarding: dict[str, Any], partner_catalog: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    objective = (onboarding.get("objective") or "").strip()
    domain_interest = (onboarding.get("domain_interest") or "").strip()
    target_outcome = (onboarding.get("target_outcome") or "").strip()
    current_level = (onboarding.get("current_level") or "").strip()
    weekly_rhythm = (onboarding.get("weekly_rhythm") or "").strip()
    name = (onboarding.get("name") or "").strip()
    current_status = _clean_text(onboarding.get("current_status"))
    current_role = _clean_text(onboarding.get("current_role"))
    target_roles = _onboarding_list(onboarding, "target_roles", limit=2)
    target_role = target_roles[0] if target_roles else domain_interest
    project_topic = _clean_text(onboarding.get("project_topic"))
    success_metric = _clean_text(onboarding.get("success_metric"))
    support_style = _clean_text(onboarding.get("support_style"))
    portfolio_status = _clean_text(onboarding.get("portfolio_status"))
    target_goal = target_outcome or "première opportunité crédible"
    greeting = f"{name}, " if name else ""
    target_goal = target_outcome or success_metric or target_role or "premiere opportunite credible"

    recommended_partners = (
        recommend_partners_from_catalog(partner_catalog, onboarding, limit=3)
        if partner_catalog
        else _fallback_partner_recommendations(onboarding)
    )
    fallback_summary = (
        f"{greeting}vous partez de {current_status.lower() if current_status else 'votre situation actuelle'}"
        f"{(' comme ' + current_role.lower()) if current_role else ''}, "
        f"avec un objectif centre sur {objective.lower() if objective else 'une progression actionnable'}. "
        f"Le profil suggere une trajectoire {target_role or domain_interest or 'ia appliquee'} adaptee a un niveau "
        f"{current_level.lower() or 'a preciser'} et a un rythme {weekly_rhythm.lower() or 'progressif'}."
    )
    trajectory_title = target_role or f"Trajectoire {domain_interest or 'orientee action'}"
    mission_focus = project_topic or "Cas reels, preuves de progression et preparation a une mission utile."
    next_steps = _clean_list(
        [
            f"Clarifier le premier livrable lie a {project_topic or objective or 'votre objectif'}",
            f"Selectionner un cadre de progression {support_style.lower() if support_style else 'adapté'}",
            f"Produire une premiere preuve defendable {('a partir de ' + portfolio_status.lower()) if portfolio_status else ''}".strip(),
            f"Preparer une exposition a {target_goal}",
        ],
        limit=4,
    )

    return {
        "diagnostic": {
            "profile_summary": fallback_summary,
            "recommended_trajectory": {
                "title": trajectory_title,
                "rationale": (
                    "La priorite est de transformer le contexte reel, les blocages et le rythme disponible en etapes concretes, "
                    "en preuves visibles et en readiness credible."
                ),
                "mission_focus": mission_focus,
            },
            "recommended_resources": _fallback_resource_types(domain_interest, list(onboarding.get("preferences") or [])),
            "recommended_partners": recommended_partners,
            "next_steps": next_steps,
        },
        "progress_plan": _build_blueprint_fallback_plan(onboarding, target_goal),
        "opportunity_targets": _fallback_opportunity_targets(onboarding),
    }

    return {
        "diagnostic": {
            "profile_summary": (
                f"{greeting}vous cherchez à progresser en {domain_interest or 'compétences utiles'} avec un objectif centré sur "
                f"{objective.lower() if objective else 'une montée en compétence actionnable'}. "
                f"Votre niveau actuel ressemble à {current_level.lower() or 'un niveau à préciser'} et votre rythme disponible à "
                f"{weekly_rhythm.lower() or 'un rythme progressif'}."
            ),
            "recommended_trajectory": {
                "title": f"Trajectoire {domain_interest or 'orientée action'}",
                "rationale": (
                    "La priorité est de transformer l'objectif en étapes concrètes, d'activer les bons partenaires, "
                    "de générer des preuves et de sécuriser une readiness crédible."
                ),
                "mission_focus": "Cas réels, preuves de progression et préparation à une mission utile.",
            },
            "recommended_resources": _fallback_resource_types(domain_interest, list(onboarding.get("preferences") or [])),
            "recommended_partners": recommended_partners,
            "next_steps": _clean_list(
                [
                    f"Clarifier le premier livrable lié à {objective or 'votre objectif'}",
                    "Sélectionner le support de progression le plus pertinent",
                    "Produire une première preuve défendable",
                    f"Préparer une exposition à {target_goal}",
                ],
                limit=4,
            ),
        },
        "progress_plan": _build_fallback_plan(onboarding, target_goal),
        "opportunity_targets": _fallback_opportunity_targets(onboarding),
    }


def _coerce_package(generated: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    diagnostic = generated.get("diagnostic") if isinstance(generated.get("diagnostic"), dict) else {}
    recommendation = diagnostic.get("recommended_trajectory") if isinstance(diagnostic.get("recommended_trajectory"), dict) else {}
    fallback_diagnostic = fallback["diagnostic"]
    return {
        "diagnostic": {
            "profile_summary": str(diagnostic.get("profile_summary") or "").strip() or fallback_diagnostic["profile_summary"],
            "recommended_trajectory": {
                "title": str(recommendation.get("title") or "").strip() or fallback_diagnostic["recommended_trajectory"]["title"],
                "rationale": str(recommendation.get("rationale") or "").strip() or fallback_diagnostic["recommended_trajectory"]["rationale"],
                "mission_focus": str(recommendation.get("mission_focus") or "").strip() or fallback_diagnostic["recommended_trajectory"]["mission_focus"],
            },
            "recommended_resources": _coerce_resources(
                diagnostic.get("recommended_resources") if isinstance(diagnostic.get("recommended_resources"), list) else [],
                fallback_diagnostic["recommended_resources"],
            ),
            "recommended_partners": _coerce_partners(
                diagnostic.get("recommended_partners") if isinstance(diagnostic.get("recommended_partners"), list) else [],
                fallback_diagnostic["recommended_partners"],
            ),
            "next_steps": _clean_list([str(item) for item in diagnostic.get("next_steps") or []], limit=5) or fallback_diagnostic["next_steps"],
        },
        "progress_plan": _coerce_plan(
            generated.get("progress_plan") if isinstance(generated.get("progress_plan"), dict) else {},
            fallback["progress_plan"],
        ),
        "opportunity_targets": _coerce_opportunities(
            generated.get("opportunity_targets") if isinstance(generated.get("opportunity_targets"), list) else [],
            fallback["opportunity_targets"],
        ),
    }


def _proof_status(proof_type: str, value: str, summary: str | None) -> tuple[str, str]:
    combined_length = len((value or "").strip()) + len((summary or "").strip())
    if proof_type in {"link", "file", "mini_deliverable", "project_submission"} and len((value or "").strip()) >= 8:
        return "validated", "Preuve exploitable détectée pour cette tâche."
    if proof_type in {"short_text", "structured_answer", "summary_note"} and combined_length >= 80:
        return "validated", "Preuve textuelle suffisamment détaillée pour compter dans le score."
    if proof_type == "screenshot" and len((value or "").strip()) >= 8:
        return "reviewed", "Capture reçue, mais une preuve plus robuste renforcera la validation."
    return "submitted", "Preuve reçue. Une preuve plus complète ou plus structurée peut être demandée."


def _count_task_proofs(proofs: list[dict[str, Any]], task_key: str, *, validated_only: bool = False) -> int:
    return sum(
        1
        for proof in proofs
        if proof.get("task_key") == task_key and (not validated_only or proof.get("status") == "validated")
    )


def _find_task(plan: dict[str, Any], task_key: str) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    for stage in plan.get("stages") or []:
        for task in stage.get("tasks") or []:
            if task.get("key") == task_key:
                return stage, task
    return None, None


def _update_task_status(plan: dict[str, Any], task_key: str, status: str) -> None:
    _, task = _find_task(plan, task_key)
    if task:
        task["status"] = status


def _compute_next_actions(plan: dict[str, Any]) -> list[str]:
    actions: list[str] = []
    for stage in plan.get("stages") or []:
        for task in stage.get("tasks") or []:
            if task.get("status") != "done":
                action = task.get("next_action") or task.get("description") or task.get("title")
                if action:
                    actions.append(str(action))
    return _clean_list(actions, limit=4)


def _derive_opportunity_visibility(
    opportunity: dict[str, Any],
    readiness_score: int,
    validated_proofs: int,
    validation_level: str,
) -> str:
    criteria = opportunity.get("criteria") or {}
    min_readiness = int(criteria.get("minimum_readiness_score") or 0)
    min_proofs = int(criteria.get("minimum_validated_proofs") or 0)
    min_level = str(criteria.get("minimum_validation_level") or "initial")
    current_level_rank = VALIDATION_LEVEL_ORDER.get(validation_level, 0)
    min_level_rank = VALIDATION_LEVEL_ORDER.get(min_level, 0)

    if readiness_score >= min_readiness + 10 and validated_proofs >= min_proofs + 1 and current_level_rank >= min_level_rank + 1:
        return "prioritized"
    if readiness_score >= min_readiness and validated_proofs >= min_proofs and current_level_rank >= min_level_rank:
        return "unlocked"
    return "recommended"


def recompute_trajectory_state(flow: dict[str, Any]) -> dict[str, Any]:
    diagnostic = copy.deepcopy(flow.get("diagnostic") or {})
    progress_plan = copy.deepcopy(flow.get("progress_plan") or {})
    proofs = copy.deepcopy(list(flow.get("proofs") or []))
    opportunity_targets = copy.deepcopy(list(flow.get("opportunity_targets") or []))

    readiness = diagnostic.get("readiness") if isinstance(diagnostic.get("readiness"), dict) else {}
    initial_score = int(readiness.get("initial_score") or _base_score(flow.get("onboarding") or {}))

    total_tasks = 0
    done_tasks = 0
    in_progress_tasks = 0
    validated_proofs = 0
    reviewed_proofs = 0
    for proof in proofs:
        if proof.get("status") == "validated":
            validated_proofs += 1
        elif proof.get("status") == "reviewed":
            reviewed_proofs += 1

    for stage in progress_plan.get("stages") or []:
        stage_done = 0
        stage_in_progress = 0
        stage_tasks = stage.get("tasks") or []
        for task in stage_tasks:
            total_tasks += 1
            proof_count = _count_task_proofs(proofs, str(task.get("key") or ""))
            validated_for_task = _count_task_proofs(proofs, str(task.get("key") or ""), validated_only=True)
            task["proof_count"] = proof_count
            task["validated_proof_count"] = validated_for_task
            current_status = str(task.get("status") or "todo")

            if task.get("proof_required"):
                if validated_for_task > 0:
                    current_status = "done"
                elif proof_count > 0:
                    current_status = "in_progress"
                elif current_status == "done":
                    current_status = "todo"

            task["status"] = current_status
            if current_status == "done":
                done_tasks += 1
                stage_done += 1
            elif current_status == "in_progress":
                in_progress_tasks += 1
                stage_in_progress += 1
        if stage_done == len(stage_tasks) and stage_tasks:
            stage["status"] = "done"
        elif stage_in_progress > 0 or stage_done > 0:
            stage["status"] = "in_progress"
        else:
            stage["status"] = "todo"

    progress_ratio = done_tasks / total_tasks if total_tasks else 0
    progress_score = max(0, min(100, round(progress_ratio * 60 + validated_proofs * 8 + reviewed_proofs * 3)))
    readiness_score = max(0, min(100, round(initial_score * 0.45 + progress_score * 0.55 + min(validated_proofs * 4, 12))))
    label, validation_status = _readiness_label(readiness_score)
    validation_level = _validation_level(progress_score, readiness_score, validated_proofs)

    progress_plan["progress_score"] = progress_score
    progress_plan["readiness_score"] = readiness_score
    progress_plan["validation_level"] = validation_level
    progress_plan["next_actions"] = _compute_next_actions(progress_plan)

    diagnostic["readiness"] = {
        "initial_score": initial_score,
        "progress_score": progress_score,
        "readiness_score": readiness_score,
        "label": label,
        "validation_status": validation_status,
        "validation_level": validation_level,
    }
    diagnostic["next_steps"] = progress_plan["next_actions"] or diagnostic.get("next_steps") or []

    normalized_opportunities: list[dict[str, Any]] = []
    for item in opportunity_targets:
        item["visibility_status"] = _derive_opportunity_visibility(item, readiness_score, validated_proofs, validation_level)
        normalized_opportunities.append(item)

    verified_status = "not_ready"
    if validated_proofs >= 4 and readiness_score >= 82 and VALIDATION_LEVEL_ORDER.get(validation_level, 0) >= VALIDATION_LEVEL_ORDER["validated"]:
        verified_status = "verified"
    elif validated_proofs >= 2 and readiness_score >= 66 and VALIDATION_LEVEL_ORDER.get(validation_level, 0) >= VALIDATION_LEVEL_ORDER["validated"]:
        verified_status = "eligible"

    recommended_trajectory = diagnostic.get("recommended_trajectory") or {}
    verified_profile = {
        "profile_status": verified_status,
        "progress_score": progress_score,
        "readiness_score": readiness_score,
        "validation_level": validation_level,
        "validated_proof_count": validated_proofs,
        "minimum_validated_proofs": 2,
        "minimum_readiness_score": 66,
        "shareable_headline": (
            f"{recommended_trajectory.get('title') or 'Trajectoire KORYXA'} • "
            f"{'Profil vérifié' if verified_status == 'verified' else 'Profil éligible' if verified_status == 'eligible' else 'Progression en cours'}"
        ),
        "summary": (
            "KORYXA vérifie uniquement les éléments suivis, prouvés ou validés dans son propre cadre. "
            f"État actuel : {verified_status}. {validated_proofs} preuve(s) validée(s), "
            f"readiness {readiness_score}/100, niveau {validation_level}."
        ),
        "included_fields": [
            "objectif cible",
            "trajectoire suivie",
            "compétences travaillées",
            "étapes validées",
            "preuves associées",
            "scores de progression et de préparation",
            "orientation vers opportunités",
        ],
    }

    flow["diagnostic"] = diagnostic
    flow["progress_plan"] = progress_plan
    flow["proofs"] = proofs
    flow["verified_profile"] = verified_profile
    flow["opportunity_targets"] = normalized_opportunities
    flow["status"] = "verified" if verified_status == "verified" else "eligible" if verified_status == "eligible" else "in_progress" if (done_tasks or in_progress_tasks) else flow.get("status") or "diagnosed"
    return flow


def trajectory_context_id(flow_id: str) -> str:
    return f"koryxa-flow:{flow_id}"


def trajectory_result_next_actions(flow: dict[str, Any], limit: int = 3) -> list[str]:
    progress_plan = flow.get("progress_plan") or {}
    diagnostic = flow.get("diagnostic") or {}
    items = [str(item) for item in progress_plan.get("next_actions") or []]
    if not items:
        items = [str(item) for item in diagnostic.get("next_steps") or []]
    return _clean_list(items, limit=limit)


def trajectory_result_benefits(flow: dict[str, Any], limit: int = 3) -> list[str]:
    diagnostic = flow.get("diagnostic") or {}
    opportunity_targets = list(flow.get("opportunity_targets") or [])
    verified_profile = flow.get("verified_profile") or {}
    items: list[str] = []

    mission_focus = str((diagnostic.get("recommended_trajectory") or {}).get("mission_focus") or "").strip()
    if mission_focus:
        items.append(mission_focus)

    for item in opportunity_targets[:3]:
        label = str(item.get("label") or "").strip()
        if label:
            items.append(label)

    profile_status = str(verified_profile.get("profile_status") or "").strip()
    if profile_status in {"eligible", "verified"}:
        items.append("Débloquer un profil vérifié KORYXA plus crédible pour les opportunités.")
    else:
        items.append("Construire un profil KORYXA prêt pour les validations et les opportunités.")

    return _clean_list(items, limit=limit)


def build_trajectory_execution_stages(
    flow: dict[str, Any],
    binding_map: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    progress_plan = flow.get("progress_plan") or {}
    normalized_stages: list[dict[str, Any]] = []
    bindings = binding_map or {}

    for stage in progress_plan.get("stages") or []:
        tasks: list[dict[str, Any]] = []
        for task in stage.get("tasks") or []:
            binding = bindings.get(str(task.get("key") or "")) or {}
            tasks.append(
                {
                    "stage_key": str(stage.get("key") or ""),
                    "task_key": str(task.get("key") or ""),
                    "title": str(task.get("title") or ""),
                    "description": str(task.get("description") or ""),
                    "proof_required": bool(task.get("proof_required", False)),
                    "expected_proof_types": list(task.get("expected_proof_types") or []),
                    "proof_count": int(task.get("proof_count") or 0),
                    "validated_proof_count": int(task.get("validated_proof_count") or 0),
                    "next_action": str(task.get("next_action") or "") or None,
                    "feature_gate": str(task.get("feature_gate") or "") or None,
                }
            )

        normalized_stages.append(
            {
                "key": str(stage.get("key") or ""),
                "title": str(stage.get("title") or ""),
                "objective": str(stage.get("objective") or ""),
                "status": str(stage.get("status") or "todo"),
                "tasks": tasks,
            }
        )

    return normalized_stages


async def build_trajectory_experience(
    onboarding: dict[str, Any],
    partner_catalog: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    _ensure_blueprint_ai_ready()
    fallback = _fallback_package(onboarding, partner_catalog)
    constraints = ", ".join(onboarding.get("constraints") or []) or "aucune contrainte précisée"
    preferences = ", ".join(onboarding.get("preferences") or []) or "aucune préférence précisée"
    prompt = f"""
Tu aides KORYXA Blueprint à produire un diagnostic personnalisé et un plan de progression concret.
Retourne UNIQUEMENT un objet JSON valide, sans aucun texte avant ou après.

Profil de l'utilisateur:
- objectif: {onboarding.get("objective")}
- niveau actuel: {onboarding.get("current_level")}
- domaine d'intérêt: {onboarding.get("domain_interest")}
- rythme disponible par semaine: {onboarding.get("weekly_rhythm")}
- objectif final: {onboarding.get("target_outcome") or "non précisé"}
- contexte personnel: {onboarding.get("context") or "non précisé"}
- contraintes: {constraints}
- préférences d'apprentissage: {preferences}

Structure JSON attendue (respecter EXACTEMENT ces champs):
{{
  "diagnostic": {{
    "profile_summary": "Résumé personnalisé du profil en 2-3 phrases",
    "recommended_trajectory": {{
      "title": "Nom du métier IA visé (ex: Data Analyst IA, ML Engineer, Prompt Engineer)",
      "rationale": "Pourquoi ce métier correspond au profil",
      "mission_focus": "Focus principal de la mission une fois certifié"
    }},
    "recommended_resources": [
      {{"type": "video|article|outil|formation", "label": "Nom de la ressource", "reason": "Pourquoi utile"}}
    ],
    "recommended_partners": [
      {{
        "type": "organisme|plateforme|coach",
        "label": "Nom du partenaire",
        "reason": "Pourquoi recommandé",
        "match_score": 85,
        "formats": ["en ligne", "présentiel"],
        "languages": ["fr"],
        "price_hint": "gratuit|payant|freemium",
        "proof_fit": ["link", "project_submission"]
      }}
    ],
    "next_steps": ["Action immédiate 1", "Action immédiate 2", "Action immédiate 3"]
  }},
  "progress_plan": {{
    "title": "Titre du parcours (ex: Data Analyst IA - 12 semaines)",
    "target_goal": "Objectif certifiable final",
    "access_level": "free",
    "plan_tier": "standard",
    "skills_to_cover": ["Compétence 1", "Compétence 2", "Compétence 3"],
    "milestones": ["Jalon semaine 2", "Jalon semaine 6", "Certification finale"],
    "total_weeks": 12,
    "stages": [
      {{
        "key": "stage_1",
        "title": "Nom du module (ex: Fondations)",
        "objective": "Ce que l'utilisateur maîtrise à la fin de ce module",
        "week_number": 1,
        "duration_weeks": 2,
        "access_level": "free",
        "tasks": [
          {{
            "key": "task_1_1",
            "title": "Titre court de l'étape",
            "description": "Description claire de ce que l'utilisateur doit faire (2-3 phrases)",
            "ai_tip": "Conseil pratique de l'IA pour réussir cette étape en 1 phrase",
            "youtube_keywords": [
              "requête YouTube courte et précise 1",
              "requête YouTube courte et précise 2",
              "requête YouTube courte et précise 3"
            ],
            "estimated_hours": 2,
            "proof_required": true,
            "expected_proof_types": ["short_text", "link"],
            "access_level": "free",
            "next_action": "Action concrète immédiate pour démarrer"
          }}
        ]
      }}
    ]
  }},
  "opportunity_targets": [
    {{
      "label": "Type d'opportunité (ex: Mission Data Analyst junior)",
      "type": "mission|stage|collaboration|project|accompagnement",
      "reason": "Pourquoi ce profil peut viser cette opportunité",
      "criteria": {{
        "minimum_readiness_score": 66,
        "minimum_validated_proofs": 2,
        "minimum_validation_level": "building"
      }}
    }}
  ]
}}

Règles impératives:
- Générer 4 à 6 stages (modules) avec 3 à 5 tasks chacun
- Les week_number doivent être consécutifs et cohérents avec duration_weeks
- youtube_keywords = requêtes de recherche YouTube réelles et précises (pas des titres de vidéos)
- ai_tip = conseil actionnable court, personnel, motivant
- estimated_hours = nombre réaliste d'heures pour compléter l'étape (1 à 8)
- Le dernier stage doit avoir un task de type "project_submission" pour la certification
- Adapter le nombre total de semaines au rythme disponible de l'utilisateur
- Pas de texte hors JSON
    """.strip()

    profile_context = json.dumps(
        {
            "objective": _clean_text(onboarding.get("objective")),
            "current_level": _clean_text(onboarding.get("current_level")),
            "current_status": _clean_text(onboarding.get("current_status")),
            "current_role": _clean_text(onboarding.get("current_role")),
            "domain_interest": _clean_text(onboarding.get("domain_interest")),
            "weekly_rhythm": _clean_text(onboarding.get("weekly_rhythm")),
            "target_outcome": _clean_text(onboarding.get("target_outcome")),
            "target_roles": _onboarding_list(onboarding, "target_roles", limit=4),
            "existing_skills": _onboarding_list(onboarding, "existing_skills", limit=12),
            "portfolio_status": _clean_text(onboarding.get("portfolio_status")),
            "target_timeline": _clean_text(onboarding.get("target_timeline")),
            "learning_style": _clean_text(onboarding.get("learning_style")),
            "support_style": _clean_text(onboarding.get("support_style")),
            "language_preference": _clean_text(onboarding.get("language_preference")),
            "motivation_driver": _clean_text(onboarding.get("motivation_driver")),
            "project_topic": _clean_text(onboarding.get("project_topic")),
            "success_metric": _clean_text(onboarding.get("success_metric")),
            "exercise_results": _onboarding_list(onboarding, "exercise_results", limit=12),
            "context": _clean_text(onboarding.get("context")),
            "constraints": constraints,
            "preferences": preferences,
        },
        ensure_ascii=False,
        indent=2,
    )
    prompt = f"""
Tu aides KORYXA Blueprint a produire un diagnostic personnalise et un plan de progression concret.
Retourne UNIQUEMENT un objet JSON valide, sans aucun texte avant ou apres.

Le tunnel Blueprint a collecte un profil structure. Tu dois t'appuyer sur TOUTES ces informations, pas seulement sur l'objectif final.

Profil structure utilisateur:
{profile_context}

Attentes produit KORYXA:
- Nous ne proposons pas une formation classique.
- Nous faisons un onboarding qui determine le parcours IA le plus adapte a la realite, a la mission, a l'objectif et a la capacite de la personne.
- Le plan doit mener vers une progression observable, des validations, puis une attestation, un badge et un CV signe si les criteres sont atteints.
- Les ressources externes doivent surtout orienter vers des recherches YouTube concretes, pas des cours fictifs.
- Les mini-exercices servent a detecter le type de raisonnement, la zone de confort et le role dans lequel la personne sera naturellement plus a l'aise.
- Tu peux recommander un autre role que celui vise initialement si les signaux d'exercice, le contexte et la capacite reelle pointent ailleurs.

Structure JSON attendue (respecter EXACTEMENT ces champs):
{{
  "diagnostic": {{
    "profile_summary": "Resume personnalise du profil en 2-3 phrases",
    "recommended_trajectory": {{
      "title": "Nom du role ou metier IA recommande, realiste pour ce profil",
      "rationale": "Pourquoi ce role correspond au profil, au contexte et au niveau",
      "mission_focus": "Type de mission ou resultat concret vise a terme"
    }},
    "recommended_resources": [
      {{"type": "video|article|outil|formation", "label": "Nom de la ressource", "reason": "Pourquoi utile"}}
    ],
    "recommended_partners": [
      {{
        "type": "organisme|plateforme|coach",
        "label": "Nom du partenaire",
        "reason": "Pourquoi recommande",
        "match_score": 85,
        "formats": ["en ligne", "presentiel"],
        "languages": ["fr"],
        "price_hint": "gratuit|payant|freemium",
        "proof_fit": ["link", "project_submission"]
      }}
    ],
    "next_steps": ["Action immediate 1", "Action immediate 2", "Action immediate 3"]
  }},
  "progress_plan": {{
    "title": "Titre du parcours (ex: Blueprint Data Analyst IA - 12 semaines)",
    "target_goal": "Objectif certifiable final",
    "access_level": "free",
    "plan_tier": "standard",
    "skills_to_cover": ["Competence 1", "Competence 2", "Competence 3"],
    "milestones": ["Jalon semaine 2", "Jalon semaine 6", "Certification finale"],
    "total_weeks": 12,
    "stages": [
      {{
        "key": "stage_1",
        "title": "Nom du module",
        "objective": "Ce que l'utilisateur maitrise a la fin de ce module",
        "week_number": 1,
        "duration_weeks": 2,
        "access_level": "free",
        "tasks": [
          {{
            "key": "task_1_1",
            "title": "Titre court de l'etape",
            "description": "Description claire de ce que l'utilisateur doit faire (2-3 phrases)",
            "ai_tip": "Conseil pratique de l'IA pour reussir cette etape en 1 phrase",
            "youtube_keywords": [
              "requete YouTube courte et precise 1",
              "requete YouTube courte et precise 2",
              "requete YouTube courte et precise 3"
            ],
            "estimated_hours": 2,
            "proof_required": true,
            "expected_proof_types": ["short_text", "link"],
            "access_level": "free",
            "next_action": "Action concrete immediate pour demarrer"
          }}
        ]
      }}
    ]
  }},
  "opportunity_targets": [
    {{
      "label": "Type d'opportunite visee",
      "type": "mission|stage|collaboration|project|accompagnement",
      "reason": "Pourquoi ce profil peut viser cette opportunite",
      "criteria": {{
        "minimum_readiness_score": 66,
        "minimum_validated_proofs": 2,
        "minimum_validation_level": "building"
      }}
    }}
  ]
}}

Regles imperatives:
- Generer 4 a 6 stages avec 3 a 5 tasks chacun.
- Les week_number doivent etre consecutifs et coherents avec duration_weeks.
- youtube_keywords doit contenir de vraies recherches YouTube adaptees au niveau, au role vise, a la langue preferee et au style d'apprentissage.
- ai_tip doit etre court, personnel et actionnable.
- estimated_hours doit rester realiste (1 a 8).
- Le dernier stage doit inclure au moins une task de type project_submission pour la certification.
- Adapter le nombre total de semaines au rythme disponible de l'utilisateur.
- Si le role vise n'est pas clair, le premier stage doit servir a clarifier la bonne direction avant d'entrer dans l'execution.
- Si la personne declare peu ou pas de preuves existantes, les premiers stages doivent construire rapidement une preuve visible.
- Si le rythme est faible, proposer moins de charge hebdomadaire et des preuves plus compactes.
- Les tasks doivent tenir compte du projet reel, du contexte metier et des blocages declares.
- Les exercise_results doivent influencer la recommandation finale, surtout s'ils montrent un reflexe analytique, automation, contenu ou cadrage client.
- Si plusieurs exercices sont en "no_response", eviter une recommandation trop technique ou trop ambitieuse d'emblee.
- Pas de texte hors JSON.
""".strip()

    generated = await generate_structured_json(prompt)
    if not generated:
        raise BlueprintAIGenerationError(
            "L'IA Blueprint n'a pas produit de reponse JSON exploitable. Aucun fallback n'est autorise."
        )
    package = _coerce_package(generated, fallback)
    flow = {
        "status": "diagnosed",
        "onboarding": onboarding,
        "diagnostic": {
            **package["diagnostic"],
            "readiness": {
                "initial_score": _base_score(onboarding),
                "progress_score": 0,
                "readiness_score": _base_score(onboarding),
                "label": _readiness_label(_base_score(onboarding))[0],
                "validation_status": _readiness_label(_base_score(onboarding))[1],
                "validation_level": "initial",
            },
        },
        "progress_plan": package["progress_plan"],
        "proofs": [],
        "verified_profile": None,
        "opportunity_targets": package["opportunity_targets"],
    }
    return recompute_trajectory_state(flow)


def create_proof_submission(payload: dict[str, Any]) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    status, impact_note = _proof_status(
        str(payload.get("proof_type") or ""),
        str(payload.get("value") or ""),
        payload.get("summary"),
    )
    return {
        "proof_id": f"proof_{uuid4().hex}",
        "stage_key": payload["stage_key"],
        "task_key": payload["task_key"],
        "proof_type": payload["proof_type"],
        "value": payload["value"],
        "summary": payload.get("summary"),
        "status": status,
        "impact_note": impact_note,
        "submitted_at": now,
        "validated_at": now if status == "validated" else None,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Blueprint Sprint & Certificate
# ──────────────────────────────────────────────────────────────────────────────

def compute_sprint(flow: dict[str, Any]) -> dict[str, Any]:
    """Compute the current week's sprint: today's focus task + week tasks."""
    enrolled_at = flow.get("enrolled_at") or flow.get("created_at")
    if enrolled_at:
        if hasattr(enrolled_at, "tzinfo") and enrolled_at.tzinfo is None:
            enrolled_at = enrolled_at.replace(tzinfo=timezone.utc)
        days_elapsed = max(0, (datetime.now(timezone.utc) - enrolled_at).days)
        current_week = days_elapsed // 7 + 1
    else:
        days_elapsed = 0
        current_week = 1

    plan = flow.get("progress_plan") or {}
    stages = plan.get("stages") or []

    # Collect tasks for the current week based on week_number + duration_weeks
    week_tasks: list[dict[str, Any]] = []
    for stage in stages:
        stage_week = int(stage.get("week_number") or 1)
        stage_duration = max(1, int(stage.get("duration_weeks") or 1))
        in_window = stage_week <= current_week < stage_week + stage_duration
        # Also include overdue stages that still have pending tasks
        is_overdue = stage_week + stage_duration <= current_week
        if in_window or is_overdue:
            for task in stage.get("tasks") or []:
                if task.get("status") == "done":
                    continue
                week_tasks.append({
                    **task,
                    "stage_key": stage.get("key", ""),
                    "stage_title": stage.get("title", ""),
                    "in_current_week": in_window,
                })
            if week_tasks and not in_window:
                break  # only carry one overdue stage

    # If still no tasks, fall back to any pending task globally
    if not week_tasks:
        for stage in stages:
            for task in stage.get("tasks") or []:
                if task.get("status") != "done":
                    week_tasks.append({
                        **task,
                        "stage_key": stage.get("key", ""),
                        "stage_title": stage.get("title", ""),
                        "in_current_week": False,
                    })

    today_task = week_tasks[0] if week_tasks else None

    # Overall completion
    total_tasks = sum(len(s.get("tasks") or []) for s in stages)
    done_tasks = sum(
        1 for s in stages for t in (s.get("tasks") or []) if t.get("status") == "done"
    )
    progress_pct = round(done_tasks / total_tasks * 100) if total_tasks > 0 else 0

    # Streak: consecutive days with at least one validation (simplified via proof dates)
    proofs = flow.get("proofs") or []
    validated_dates: set[str] = set()
    for p in proofs:
        if p.get("status") in ("validated", "reviewed"):
            ts = p.get("validated_at") or p.get("submitted_at")
            if ts:
                try:
                    d = ts if isinstance(ts, datetime) else datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
                    validated_dates.add(d.strftime("%Y-%m-%d"))
                except Exception:
                    pass
    streak = 0
    check = datetime.now(timezone.utc).date()
    while check.strftime("%Y-%m-%d") in validated_dates:
        streak += 1
        check = check.replace(day=check.day - 1) if check.day > 1 else check

    return {
        "current_week": current_week,
        "days_elapsed": days_elapsed,
        "today_task": today_task,
        "week_tasks": week_tasks[:6],
        "progress_pct": progress_pct,
        "total_tasks": total_tasks,
        "done_tasks": done_tasks,
        "streak_days": streak,
        "path_title": plan.get("title", "Parcours Blueprint"),
        "total_weeks": int(plan.get("total_weeks") or 12),
    }


def compute_blueprint_certificate(flow: dict[str, Any]) -> dict[str, Any]:
    """Compute the certificate state for a Blueprint flow."""
    vp = flow.get("verified_profile") or {}
    plan = flow.get("progress_plan") or {}
    stages = plan.get("stages") or []

    total_tasks = sum(len(s.get("tasks") or []) for s in stages)
    done_tasks = sum(
        1 for s in stages for t in (s.get("tasks") or []) if t.get("status") == "done"
    )
    completion_pct = round(done_tasks / total_tasks * 100) if total_tasks > 0 else 0

    validated_proofs = vp.get("validated_proof_count") or sum(
        1 for p in (flow.get("proofs") or []) if p.get("status") == "validated"
    )
    readiness_score = vp.get("readiness_score") or (
        (flow.get("diagnostic") or {}).get("readiness") or {}
    ).get("readiness_score") or 0

    # Badge level
    if completion_pct >= 100 and validated_proofs >= 4:
        level = "certified"
        badge_label = "Certifié KORYXA Blueprint"
        badge_color = "#F59E0B"  # gold
        eligible_for_cv = True
        eligible_for_attestation = True
    elif completion_pct >= 50 or validated_proofs >= 2:
        level = "mid_path"
        badge_label = "Mi-chemin Blueprint"
        badge_color = "#94A3B8"  # silver
        eligible_for_cv = False
        eligible_for_attestation = False
    else:
        level = "in_progress"
        badge_label = "En parcours Blueprint"
        badge_color = "#CD7C3A"  # bronze
        eligible_for_cv = False
        eligible_for_attestation = False

    flow_id = str(flow.get("_id") or "")
    certificate_id = f"KRX-{flow_id[:8].upper()}" if flow_id else "KRX-XXXXXXXX"

    # Skills actually covered (from done stages)
    done_stage_skills: list[str] = []
    for stage in stages:
        done = all(t.get("status") == "done" for t in (stage.get("tasks") or []))
        if done:
            done_stage_skills.append(stage.get("title", ""))

    return {
        "certificate_id": certificate_id,
        "level": level,
        "badge_label": badge_label,
        "badge_color": badge_color,
        "path_title": plan.get("title") or "Parcours IA Blueprint",
        "completion_pct": completion_pct,
        "validated_proofs": validated_proofs,
        "readiness_score": int(readiness_score),
        "shareable_headline": vp.get("shareable_headline") or "",
        "skills_covered": [s for s in (plan.get("skills_to_cover") or []) if s],
        "modules_completed": done_stage_skills,
        "eligible_for_cv": eligible_for_cv,
        "eligible_for_attestation": eligible_for_attestation,
        "next_milestone": _certificate_next_milestone(completion_pct, validated_proofs),
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }


def _certificate_next_milestone(completion_pct: int, validated_proofs: int) -> str:
    if completion_pct < 50:
        remaining = max(0, 50 - completion_pct)
        return f"Complétez encore {remaining}% du parcours pour débloquer le badge Mi-chemin"
    if validated_proofs < 2:
        return f"Soumettez {2 - validated_proofs} preuve(s) validée(s) de plus pour progresser"
    if completion_pct < 100:
        remaining = 100 - completion_pct
        return f"Plus que {remaining}% pour obtenir la certification complète KORYXA"
    if validated_proofs < 4:
        return f"Ajoutez {4 - validated_proofs} preuve(s) supplémentaire(s) pour décrocher la certification complète"
    return "Félicitations — vous êtes certifié KORYXA Blueprint !"

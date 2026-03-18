from __future__ import annotations

import copy
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.services.ai_json import generate_structured_json


logger = logging.getLogger(__name__)

VALIDATION_LEVEL_ORDER = {
    "initial": 0,
    "building": 1,
    "validated": 2,
    "advanced": 3,
}


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
    return max(
        25,
        min(
            92,
            _score_level(onboarding.get("current_level") or "")
            + _score_rhythm(onboarding.get("weekly_rhythm") or "")
            - min(len(constraints) * 4, 12)
            + min(len(preferences) * 2, 6),
        ),
    )


def _fallback_package(onboarding: dict[str, Any]) -> dict[str, Any]:
    objective = (onboarding.get("objective") or "").strip()
    domain_interest = (onboarding.get("domain_interest") or "").strip()
    target_outcome = (onboarding.get("target_outcome") or "").strip()
    current_level = (onboarding.get("current_level") or "").strip()
    weekly_rhythm = (onboarding.get("weekly_rhythm") or "").strip()
    name = (onboarding.get("name") or "").strip()
    target_goal = target_outcome or "première opportunité crédible"
    greeting = f"{name}, " if name else ""

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
            "recommended_partners": _fallback_partner_recommendations(onboarding),
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


async def build_trajectory_experience(onboarding: dict[str, Any]) -> dict[str, Any]:
    fallback = _fallback_package(onboarding)
    constraints = ", ".join(onboarding.get("constraints") or []) or "aucune contrainte précisée"
    preferences = ", ".join(onboarding.get("preferences") or []) or "aucune préférence précisée"
    prompt = f"""
Tu aides KORYXA à produire un diagnostic de trajectoire et un plan de progression.
Retourne uniquement un JSON objet.

Profil:
- objectif: {onboarding.get("objective")}
- niveau actuel: {onboarding.get("current_level")}
- domaine d'intérêt: {onboarding.get("domain_interest")}
- rythme disponible: {onboarding.get("weekly_rhythm")}
- objectif final: {onboarding.get("target_outcome") or "non précisé"}
- contexte: {onboarding.get("context") or "non précisé"}
- contraintes: {constraints}
- préférences: {preferences}

Structure JSON attendue:
{{
  "diagnostic": {{
    "profile_summary": "string",
    "recommended_trajectory": {{
      "title": "string",
      "rationale": "string",
      "mission_focus": "string"
    }},
    "recommended_resources": [
      {{"type": "string", "label": "string", "reason": "string"}}
    ],
    "recommended_partners": [
      {{
        "type": "organisme|plateforme|coach",
        "label": "string",
        "reason": "string",
        "match_score": 0,
        "formats": ["string"],
        "languages": ["string"],
        "price_hint": "string",
        "proof_fit": ["link|file|short_text|structured_answer|mini_deliverable|screenshot|project_submission|summary_note"]
      }}
    ],
    "next_steps": ["string", "string", "string"]
  }},
  "progress_plan": {{
    "title": "string",
    "target_goal": "string",
    "access_level": "free|premium",
    "plan_tier": "string",
    "skills_to_cover": ["string"],
    "milestones": ["string"],
    "stages": [
      {{
        "key": "string",
        "title": "string",
        "objective": "string",
        "access_level": "free|premium",
        "tasks": [
          {{
            "key": "string",
            "title": "string",
            "description": "string",
            "proof_required": true,
            "expected_proof_types": ["link|file|short_text|structured_answer|mini_deliverable|screenshot|project_submission|summary_note"],
            "access_level": "free|premium",
            "feature_gate": "string",
            "next_action": "string"
          }}
        ]
      }}
    ]
  }},
  "opportunity_targets": [
    {{
      "label": "string",
      "type": "mission|stage|collaboration|project|accompagnement",
      "reason": "string",
      "criteria": {{
        "minimum_readiness_score": 0,
        "minimum_validated_proofs": 0,
        "minimum_validation_level": "initial|building|validated|advanced"
      }}
    }}
  ]
}}

Exigences:
- trajectoire lisible et actionnable
- progression pensée comme un produit d'exécution, pas comme une page statique
- prévoir des preuves attendues
- différencier le gratuit et le premium via access_level ou plan_tier
- exprimer clairement comment la progression peut déboucher sur des opportunités
- pas de texte hors JSON
""".strip()

    generated = await generate_structured_json(prompt)
    package = _coerce_package(generated, fallback) if generated else fallback
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

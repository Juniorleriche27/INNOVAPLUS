"""
KORYXA Matching Service
─────────────────────────────────────────────────────────────────────────────
Compare les profils talents (trajectory_flows) avec les besoins entreprise
(enterprise_needs) sur 5 axes sémantiques alignés via la taxonomie partagée.

Axes de scoring :
  1. Type de mission   (40%) — primary_goal entreprise vs main_task talent
  2. Domaine métier    (30%) — domain entreprise vs current_sector talent
  3. Mode de collab    (20%) — treatment_preference vs work_mode talent
  4. Urgence / dispo   (10%) — urgency entreprise vs target_timeline talent
"""
from __future__ import annotations

from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.taxonomy import (
    DOMAIN_COMPAT,
    DOMAIN_IDS,
    DOMAIN_TO_MISSION_COMPAT,
    MISSION_TYPE_COMPAT,
    MISSION_TYPE_IDS,
    COLLAB_MODE_IDS,
)

# ─── Poids des axes ───────────────────────────────────────────────────────────

WEIGHT_MISSION = 0.40
WEIGHT_DOMAIN  = 0.30
WEIGHT_MODE    = 0.20
WEIGHT_URGENCY = 0.10

# ─── Mapping urgence entreprise ↔ délai talent ───────────────────────────────

URGENCY_TIMELINE_COMPAT: dict[str, list[str]] = {
    "immédiat":       ["3 mois"],
    "sous_1_mois":    ["3 mois", "6 mois"],
    "sous_3_mois":    ["3 mois", "6 mois"],
    "sous_6_mois":    ["6 mois", "1 an"],
    "pas_urgent":     ["6 mois", "1 an", "À mon rythme"],
}

# ─── Helpers ─────────────────────────────────────────────────────────────────


def _mission_score(need_domain: str, talent_task: str) -> float:
    """Score mission type : 1.0 si talent_task est directement compatible avec le domaine entreprise,
    0.5 si compatible via mission_type voisin, 0.0 sinon.
    need_domain est un IA domain (ex: 'ia_automatisation').
    talent_task est un IA mission type (ex: 'automatisation').
    """
    if not need_domain or not talent_task:
        return 0.0
    # Correspondances directes domaine → types d'intervention compatibles
    primary_compat = DOMAIN_TO_MISSION_COMPAT.get(need_domain, [])
    if talent_task in primary_compat:
        return 1.0
    # Compatibilité secondaire : via les voisins des types d'intervention
    for mt in primary_compat:
        if talent_task in MISSION_TYPE_COMPAT.get(mt, []):
            return 0.5
    return 0.0


def _domain_score(need_domain: str, talent_domain: str) -> float:
    """Score domaine : 1.0 exact / 0.4 compatible / 0.0 incompatible."""
    if not need_domain or not talent_domain:
        return 0.0
    if need_domain == talent_domain:
        return 1.0
    compat = DOMAIN_COMPAT.get(need_domain, [])
    if talent_domain in compat:
        return 0.4
    return 0.0


def _mode_score(need_mode: str, talent_mode: str) -> float:
    """Score mode collab : 1.0 si identique, 0 sinon."""
    if not need_mode or not talent_mode:
        return 0.0
    # Normalise : si le mode enterprise est du texte libre, essaie un mapping simple
    need_norm = _normalize_mode(need_mode)
    if need_norm == talent_mode:
        return 1.0
    return 0.0


def _urgency_score(need_urgency: str, talent_timeline: str) -> float:
    """Score urgence / disponibilité."""
    if not need_urgency or not talent_timeline:
        return 0.0
    compat = URGENCY_TIMELINE_COMPAT.get(need_urgency, [])
    return 1.0 if talent_timeline in compat else 0.0


def _normalize_mode(raw: str) -> str:
    """Tente de mapper du texte libre vers un ID COLLAB_MODE."""
    raw_lower = raw.lower()
    if "courte" in raw_lower or "court" in raw_lower:
        return "mission_courte"
    if "long" in raw_lower:
        return "mission_longue"
    if "retainer" in raw_lower or "récurrent" in raw_lower or "recurrent" in raw_lower:
        return "retainer"
    if "remote" in raw_lower or "distance" in raw_lower:
        return "remote"
    if "présentiel" in raw_lower or "presentiel" in raw_lower:
        return "presentiel"
    if "autonome" in raw_lower:
        return "execution_autonome"
    if "équipe" in raw_lower or "equipe" in raw_lower or "intégré" in raw_lower:
        return "collaboration_integree"
    # Si c'est déjà un ID valide, retourne tel quel
    if raw in COLLAB_MODE_IDS:
        return raw
    return raw


def _extract_need_domain(need: dict[str, Any]) -> str:
    """Extrait le domaine du besoin entreprise.
    Cherche dans plusieurs champs possibles selon l'ancienneté du document."""
    for key in ("domain", "company_domain", "sector"):
        val = need.get(key, "")
        if val and val in DOMAIN_IDS:
            return val
    # Fallback : essaie de déduire depuis primary_goal
    pg = need.get("primary_goal", "")
    if pg in DOMAIN_IDS:
        return pg
    return ""


def _score_match(need: dict[str, Any], flow: dict[str, Any]) -> float:
    """Calcule le score de matching [0.0, 1.0] entre un besoin et un profil talent."""
    onboarding: dict[str, Any] = flow.get("onboarding") or {}

    need_domain = _extract_need_domain(need)
    mission = _mission_score(
        need_domain,
        onboarding.get("main_task", ""),
    )
    domain = _domain_score(
        need_domain,
        onboarding.get("current_sector", ""),
    )
    mode = _mode_score(
        need.get("treatment_preference", ""),
        onboarding.get("work_mode", ""),
    )
    urgency = _urgency_score(
        need.get("urgency", ""),
        onboarding.get("target_timeline", ""),
    )

    return (
        mission * WEIGHT_MISSION
        + domain  * WEIGHT_DOMAIN
        + mode    * WEIGHT_MODE
        + urgency * WEIGHT_URGENCY
    )


def _serialize_talent(flow: dict[str, Any], score: float) -> dict[str, Any]:
    """Sérialise un profil talent pour la réponse API."""
    onboarding: dict[str, Any] = flow.get("onboarding") or {}
    diagnostic: dict[str, Any] = flow.get("diagnostic") or {}

    return {
        "flow_id": str(flow["_id"]),
        "user_id": str(flow["user_id"]) if flow.get("user_id") else None,
        "score": round(score, 4),
        "score_pct": round(score * 100),
        "current_sector": onboarding.get("current_sector"),
        "main_task": onboarding.get("main_task"),
        "work_mode": onboarding.get("work_mode"),
        "target_roles": onboarding.get("target_roles") or [],
        "existing_skills": onboarding.get("existing_skills") or [],
        "ai_maturity": onboarding.get("ai_maturity"),
        "goal_type": onboarding.get("goal_type"),
        "recommended_role": diagnostic.get("recommended_role"),
        "profile_label": diagnostic.get("profile_label"),
        "created_at": flow.get("created_at"),
    }


# ─── Public API ───────────────────────────────────────────────────────────────


async def find_matches_for_need(
    need_id: str,
    db: AsyncIOMotorDatabase,
    limit: int = 5,
    min_score: float = 0.10,
) -> dict[str, Any]:
    """
    Trouve les meilleurs profils talents pour un besoin entreprise.

    Returns:
        {
          "need_id": str,
          "matches": [ { flow_id, score, score_pct, ... } ],
          "total_evaluated": int,
        }
    """
    try:
        need_oid = ObjectId(need_id)
    except Exception:
        return {"need_id": need_id, "matches": [], "total_evaluated": 0, "error": "invalid need_id"}

    need = await db["enterprise_needs"].find_one({"_id": need_oid})
    if not need:
        return {"need_id": need_id, "matches": [], "total_evaluated": 0, "error": "need not found"}

    # Récupère tous les profils qui ont au moins terminé l'onboarding
    cursor = db["trajectory_flows"].find(
        {"onboarding": {"$exists": True, "$ne": None}},
        # Projection — on ne charge que les champs utiles
        {
            "_id": 1,
            "user_id": 1,
            "onboarding.current_sector": 1,
            "onboarding.main_task": 1,
            "onboarding.work_mode": 1,
            "onboarding.target_roles": 1,
            "onboarding.existing_skills": 1,
            "onboarding.ai_maturity": 1,
            "onboarding.goal_type": 1,
            "onboarding.target_timeline": 1,
            "diagnostic.recommended_role": 1,
            "diagnostic.profile_label": 1,
            "created_at": 1,
        },
    )

    scored: list[tuple[float, dict[str, Any]]] = []
    total = 0

    async for flow in cursor:
        total += 1
        score = _score_match(need, flow)
        if score >= min_score:
            scored.append((score, flow))

    # Trie par score décroissant, garde les N meilleurs
    scored.sort(key=lambda x: x[0], reverse=True)
    top = scored[:limit]

    return {
        "need_id": str(need["_id"]),
        "primary_goal": need.get("primary_goal"),
        "matches": [_serialize_talent(flow, score) for score, flow in top],
        "total_evaluated": total,
    }

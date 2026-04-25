from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


DEFAULT_PARTNERS: list[dict[str, Any]] = [
    {
        "slug": "atelier-data-cohort",
        "type": "organisme",
        "name": "Atelier Data Cohort",
        "headline": "Organisme partenaire pour structurer une base data et des validations progressives.",
        "summary": "Cohortes guidees, cas reels, evaluations regulieres et accompagnement methodique pour renforcer une trajectoire data ou reporting.",
        "domains": ["Data", "Reporting", "Analyse"],
        "levels": ["Debutant", "Intermediaire"],
        "formats": ["cohorte", "distanciel"],
        "languages": ["francais"],
        "geographies": ["Afrique de l'Ouest", "Distanciel"],
        "remote": True,
        "price_range": "budget intermediaire",
        "rhythm_options": ["4-6h / semaine", "7-10h / semaine"],
        "proof_capabilities": ["summary_note", "structured_answer", "project_submission"],
        "target_profiles": ["transition data", "reporting", "analyse operationnelle"],
        "external_url": None,
        "status": "published",
        "visible": True,
    },
    {
        "slug": "ops-practice-platform",
        "type": "plateforme",
        "name": "Ops Practice Platform",
        "headline": "Plateforme partenaire pour avancer a son rythme sur des mini-projets orientes execution.",
        "summary": "Ressources asynchrones, projets pratiques, modeles de livrables et checkpoints utiles pour transformer une trajectoire en preuves concretes.",
        "domains": ["Automatisation", "Support operationnel", "Coordination", "Tableau de bord"],
        "levels": ["Debutant", "Intermediaire", "Avance"],
        "formats": ["asynchrone", "distanciel"],
        "languages": ["francais", "anglais"],
        "geographies": ["Global", "Distanciel"],
        "remote": True,
        "price_range": "budget flexible",
        "rhythm_options": ["1-3h / semaine", "4-6h / semaine", "7-10h / semaine"],
        "proof_capabilities": ["link", "project_submission", "screenshot", "mini_deliverable"],
        "target_profiles": ["ops", "automation", "tableaux de bord"],
        "external_url": None,
        "status": "published",
        "visible": True,
    },
    {
        "slug": "coach-readiness-1to1",
        "type": "coach",
        "name": "Coach Readiness 1:1",
        "headline": "Coach partenaire pour relire les preuves, garder le cap et preparer l'acces aux opportunites.",
        "summary": "Accompagnement individuel centre sur le cadrage, la relecture des preuves, la synthese de progression et la preparation a une mission ou collaboration.",
        "domains": ["Progression", "Validation", "Preparation mission"],
        "levels": ["Intermediaire", "Avance"],
        "formats": ["1:1", "visio"],
        "languages": ["francais"],
        "geographies": ["Distanciel"],
        "remote": True,
        "price_range": "budget cible",
        "rhythm_options": ["1-3h / semaine", "4-6h / semaine"],
        "proof_capabilities": ["structured_answer", "summary_note", "mini_deliverable"],
        "target_profiles": ["profils en validation", "mission ready", "besoin de feedback"],
        "external_url": None,
        "status": "published",
        "visible": True,
    },
]


async def ensure_public_partners_seed(db: AsyncIOMotorDatabase) -> None:
    now = datetime.now(timezone.utc)
    for item in DEFAULT_PARTNERS:
        await db["trajectory_partners"].update_one(
            {"slug": item["slug"]},
            {
                "$set": {
                    **item,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )


def _normalize_partner(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "slug": doc["slug"],
        "type": doc["type"],
        "name": doc["name"],
        "headline": doc["headline"],
        "summary": doc["summary"],
        "domains": list(doc.get("domains") or []),
        "levels": list(doc.get("levels") or []),
        "formats": list(doc.get("formats") or []),
        "languages": list(doc.get("languages") or []),
        "geographies": list(doc.get("geographies") or []),
        "remote": bool(doc.get("remote", True)),
        "price_range": doc.get("price_range"),
        "rhythm_options": list(doc.get("rhythm_options") or []),
        "proof_capabilities": list(doc.get("proof_capabilities") or []),
        "target_profiles": list(doc.get("target_profiles") or []),
        "external_url": doc.get("external_url"),
        "status": doc.get("status") or "published",
    }


async def list_public_partners(db: AsyncIOMotorDatabase) -> list[dict[str, Any]]:
    await ensure_public_partners_seed(db)
    items = (
        await db["trajectory_partners"]
        .find({"visible": True, "status": "published"})
        .sort([("type", 1), ("name", 1)])
        .to_list(length=24)
    )
    return [_normalize_partner(item) for item in items]


def score_partner_match(partner: dict[str, Any], onboarding: dict[str, Any]) -> int:
    domain_interest = (onboarding.get("domain_interest") or "").strip().lower()
    current_level = (onboarding.get("current_level") or "").strip().lower()
    weekly_rhythm = (onboarding.get("weekly_rhythm") or "").strip().lower()
    preferences = [str(item).strip().lower() for item in onboarding.get("preferences") or []]

    score = 48

    domains = [str(item).strip().lower() for item in partner.get("domains") or []]
    levels = [str(item).strip().lower() for item in partner.get("levels") or []]
    rhythm_options = [str(item).strip().lower() for item in partner.get("rhythm_options") or []]
    formats = [str(item).strip().lower() for item in partner.get("formats") or []]

    if domain_interest and any(domain_interest in domain or domain in domain_interest for domain in domains):
        score += 20
    if current_level and any(current_level in level or level in current_level for level in levels):
        score += 12
    if weekly_rhythm and any(weekly_rhythm in rhythm or rhythm in weekly_rhythm for rhythm in rhythm_options):
        score += 10
    if any("cas reels" in pref or "cas réels" in pref for pref in preferences) and any(
        "cohorte" in fmt or "asynchrone" in fmt for fmt in formats
    ):
        score += 4
    if any("feedback" in pref or "coach" in pref for pref in preferences) and partner.get("type") == "coach":
        score += 8
    if any("asynchrone" in pref for pref in preferences) and any("asynchrone" in fmt for fmt in formats):
        score += 4

    return max(0, min(100, score))


def recommend_partners_from_catalog(
    partners: list[dict[str, Any]],
    onboarding: dict[str, Any],
    *,
    limit: int = 3,
) -> list[dict[str, Any]]:
    ranked = sorted(
        (
            {
                "type": partner["type"],
                "label": partner["name"],
                "reason": (
                    f"Recommande pour {onboarding.get('domain_interest') or 'cette trajectoire'}, "
                    f"avec un format {', '.join(partner.get('formats') or ['adaptable'])} "
                    "et des preuves compatibles avec la progression KORYXA."
                ),
                "match_score": score_partner_match(partner, onboarding),
                "formats": list(partner.get("formats") or []),
                "languages": list(partner.get("languages") or []),
                "price_hint": partner.get("price_range"),
                "proof_fit": list(partner.get("proof_capabilities") or []),
            }
            for partner in partners
        ),
        key=lambda item: item["match_score"],
        reverse=True,
    )
    return ranked[:limit]

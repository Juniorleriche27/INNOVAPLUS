from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db

router = APIRouter(prefix="/skills", tags=["skills"])

COLL_SKILL_TAGS = "certificate_skill_tags"
COLL_CERT_SKILLS = "certificate_skill_links"
COLL_USER_SKILLS = "user_certificate_skills"
COLL_OFFERS = "market_offers"


async def _counts(
    db: AsyncIOMotorDatabase, collection: str, field: str, distinct_field: str | None = None
) -> Dict[str, int]:
    """
    Aggregate counts per skill slug with Mongo pipeline.
    If distinct_field is provided, count distinct values per slug.
    """
    group_stage: Dict = {"_id": f"${field}"}
    if distinct_field:
        group_stage["items"] = {"$addToSet": f"${distinct_field}"}
    else:
        group_stage["count"] = {"$sum": 1}
    pipeline: List[Dict] = [{"$group": group_stage}]
    results = await db[collection].aggregate(pipeline).to_list(length=5000)
    counts: Dict[str, int] = {}
    for doc in results:
        slug = doc.get("_id")
        if not slug:
            continue
        if distinct_field:
            counts[str(slug)] = len(doc.get("items", []))
        else:
            counts[str(slug)] = int(doc.get("count") or 0)
    return counts


@router.get("")
async def list_skills(db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Liste consolidée des compétences/secteurs avec quelques indicateurs simples
    (certificats, utilisateurs, offres marketplace).
    """
    # Base: tags définis pour l'école
    tags = await db[COLL_SKILL_TAGS].find({}, {"slug": 1, "label": 1, "name": 1}).to_list(length=500)
    skills: Dict[str, Dict] = {}
    for t in tags:
        slug = str(t.get("slug") or t.get("name") or "").strip().lower()
        if not slug:
            continue
        skills[slug] = {"slug": slug, "label": t.get("label") or t.get("name") or slug.title()}

    # Compteurs par source
    cert_counts = await _counts(db, COLL_CERT_SKILLS, "skill_slug")
    user_counts = await _counts(db, COLL_USER_SKILLS, "skill_slug", distinct_field="user_id")

    # Offres marketplace: group by each skill
    offer_counts: Dict[str, int] = {}
    pipeline = [
        {"$unwind": "$skills"},
        {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
    ]
    offer_results = await db[COLL_OFFERS].aggregate(pipeline).to_list(length=5000)
    for doc in offer_results:
        slug = str(doc.get("_id") or "").strip().lower()
        if not slug:
            continue
        offer_counts[slug] = int(doc.get("count") or 0)

    # Consolider tous les slugs rencontrés
    all_slugs = set(skills.keys()) | set(cert_counts.keys()) | set(user_counts.keys()) | set(offer_counts.keys())
    items: List[Dict] = []
    for slug in sorted(all_slugs):
        label = skills.get(slug, {}).get("label") or slug.replace("-", " ").title()
        items.append(
            {
                "slug": slug,
                "label": label,
                "certificates": cert_counts.get(slug, 0),
                "users": user_counts.get(slug, 0),
                "offers": offer_counts.get(slug, 0),
                "total": cert_counts.get(slug, 0) + user_counts.get(slug, 0) + offer_counts.get(slug, 0),
            }
        )

    # Trier par importance décroissante
    items_sorted = sorted(items, key=lambda x: (-x["total"], x["label"]))
    return {"items": items_sorted}

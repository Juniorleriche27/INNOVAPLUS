from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db

router = APIRouter(prefix="/skills", tags=["skills"])

COLL_PROFILES = "profiles"
COLL_OFFERS = "market_offers"


async def _counts(
    db: AsyncIOMotorDatabase,
    collection: str,
    field: str,
    distinct_field: str | None = None,
) -> Dict[str, int]:
    pipeline: List[Dict] = [{"$unwind": f"${field}"}]
    group_stage: Dict = {"_id": f"${field}"}
    if distinct_field:
        group_stage["items"] = {"$addToSet": f"${distinct_field}"}
    else:
        group_stage["count"] = {"$sum": 1}
    pipeline.append({"$group": group_stage})

    results = await db[collection].aggregate(pipeline).to_list(length=5000)
    counts: Dict[str, int] = {}
    for doc in results:
        slug = str(doc.get("_id") or "").strip().lower()
        if not slug:
            continue
        if distinct_field:
            counts[slug] = len(doc.get("items", []))
        else:
            counts[slug] = int(doc.get("count") or 0)
    return counts


@router.get("")
async def list_skills(db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Liste consolidée des compétences/secteurs à partir des profils et des offres.
    """
    user_counts = await _counts(db, COLL_PROFILES, "skills", distinct_field="user_id")
    offer_counts = await _counts(db, COLL_OFFERS, "skills")

    all_slugs = set(user_counts.keys()) | set(offer_counts.keys())
    items: List[Dict] = []
    for slug in sorted(all_slugs):
        items.append(
            {
                "slug": slug,
                "label": slug.replace("-", " ").title(),
                "certificates": 0,
                "users": user_counts.get(slug, 0),
                "offers": offer_counts.get(slug, 0),
                "total": user_counts.get(slug, 0) + offer_counts.get(slug, 0),
            }
        )

    items_sorted = sorted(items, key=lambda x: (-x["total"], x["label"]))
    return {"items": items_sorted}

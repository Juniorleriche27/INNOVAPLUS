from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase


PUBLIC_PRODUCTS: list[dict[str, Any]] = [
    {
        "slug": "myplanning",
        "name": "MyPlanningAI",
        "href": "/myplanning",
        "eyebrow": "Pilotage",
        "summary": "MyPlanningAI aide à organiser les tâches, suivre la progression, piloter les priorités et structurer l'exécution, en individuel comme en équipe.",
        "bullets": ["Progression visible", "Priorités plus claires", "Exécution mieux structurée"],
        "cta": "Ouvrir MyPlanningAI",
    },
    {
        "slug": "chatlaya",
        "name": "ChatLAYA",
        "href": "/chatlaya",
        "eyebrow": "Copilote",
        "summary": "ChatLAYA sert de copilote conversationnel pour clarifier une demande, accélérer la production et soutenir l'exécution dans un cadre plus lisible.",
        "bullets": ["Clarification rapide", "Support conversationnel", "Exécution assistée"],
        "cta": "Ouvrir ChatLAYA",
    },
]


async def ensure_public_products_seed(db: AsyncIOMotorDatabase) -> None:
    now = datetime.now(timezone.utc)
    for item in PUBLIC_PRODUCTS:
        await db["public_products"].update_one(
            {"slug": item["slug"]},
            {
                "$set": {
                    **item,
                    "visible": True,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )


async def list_public_products(db: AsyncIOMotorDatabase) -> list[dict[str, Any]]:
    await ensure_public_products_seed(db)
    items = await db["public_products"].find({"visible": True}).sort("name", 1).to_list(length=20)
    normalized: list[dict[str, Any]] = []
    for item in items:
        normalized.append(
            {
                "slug": item["slug"],
                "name": item["name"],
                "href": item["href"],
                "eyebrow": item["eyebrow"],
                "summary": item["summary"],
                "bullets": list(item.get("bullets") or []),
                "cta": item["cta"],
            }
        )
    return normalized

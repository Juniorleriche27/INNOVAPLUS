"""Seed workspace_profiles with demo demandeur & prestataires.

Usage:
  cd apps/koryxa/backend
  python -m scripts.seed_workspace_profiles
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.db.mongo import connect_to_mongo, get_db_instance, close_mongo_connection


NOW = datetime.now(timezone.utc).isoformat()

PROFILES = [
    {
        "user_id": "demo-demandeur",
        "workspace_role": "demandeur",
        "demandeur": {
            "display_name": "Collectif NeedIndex",
            "organization": "NeedIndex Labs",
            "contact_email": "needindex@example.org",
            "contact_phone": "+221770000001",
            "languages": ["fr", "en"],
            "country": "SN",
            "city": "Dakar",
            "remote_ok": True,
            "preferred_channels": ["email"],
            "timezone": "Africa/Dakar",
        },
        "updated_at": NOW,
    },
    {
        "user_id": "demo-presta-ml",
        "workspace_role": "prestataire",
        "prestataire": {
            "display_name": "DataCraft Africa",
            "bio": "Collectif d'ingénieurs ML spécialisés en dashboards frugaux et déploiements data.",
            "skills": ["data analysis", "mlops", "dashboard", "power bi"],
            "languages": ["fr", "en"],
            "availability": "Lun-Sam, 9h-19h GMT",
            "availability_timezone": "Africa/Abidjan",
            "rate_min": 450,
            "rate_max": 1200,
            "currency": "EUR",
            "zones": ["CI", "remote"],
            "remote": True,
            "contact_email": "datacraft@example.org",
            "contact_phone": "+225050000002",
            "channels": ["email", "whatsapp"],
        },
        "updated_at": NOW,
    },
    {
        "user_id": "demo-presta-creative",
        "workspace_role": "prestataire",
        "prestataire": {
            "display_name": "Studio Ataya",
            "bio": "Collectif créatif (design produit + motion) basé à Lomé avec expériences fintech.",
            "skills": ["ux", "ui", "motion", "brand"],
            "languages": ["fr"],
            "availability": "Mar-Dim, 10h-18h GMT+1",
            "availability_timezone": "Africa/Lome",
            "rate_min": 300,
            "rate_max": 800,
            "currency": "EUR",
            "zones": ["TG", "BJ", "remote"],
            "remote": True,
            "contact_email": "studio.ataya@example.org",
            "contact_phone": "+22893000003",
            "channels": ["email"],
        },
        "updated_at": NOW,
    },
    {
        "user_id": "demo-presta-field",
        "workspace_role": "prestataire",
        "prestataire": {
            "display_name": "Ground Ops Sahel",
            "bio": "PM terrain & logistique pour missions courtes (enquêtes, installations IoT).",
            "skills": ["field ops", "installation", "training", "reporting"],
            "languages": ["fr", "ha"],
            "availability": "24/7 selon mission",
            "availability_timezone": "Africa/Niamey",
            "rate_min": 250,
            "rate_max": 600,
            "currency": "EUR",
            "zones": ["NE", "ML", "remote"],
            "remote": False,
            "contact_email": "ops.sahel@example.org",
            "contact_phone": "+22788000004",
            "channels": ["email", "whatsapp"],
        },
        "updated_at": NOW,
    },
]


async def main() -> None:
    await connect_to_mongo()
    db = get_db_instance()
    for doc in PROFILES:
        user_id = doc["user_id"]
        result = await db["workspace_profiles"].update_one({"user_id": user_id}, {"$set": doc}, upsert=True)
        print(f"[seed] {user_id}: matched={result.matched_count} upserted={result.upserted_id}")
    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())

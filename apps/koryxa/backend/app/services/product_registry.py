from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from app.services.postgres_bootstrap import db_execute, db_fetchall


PUBLIC_PRODUCTS: list[dict[str, Any]] = [
    {
        "slug": "chatlaya",
        "name": "ChatLAYA",
        "href": "/products/chatlaya",
        "eyebrow": "Copilote",
        "summary": "ChatLAYA sert de copilote conversationnel pour clarifier une demande, accélérer la production et soutenir l'exécution dans un cadre plus lisible.",
        "bullets": ["Clarification rapide", "Support conversationnel", "Exécution assistée"],
        "cta": "Voir ChatLAYA",
    },
]


async def ensure_public_products_seed(db) -> None:
    now = datetime.now(timezone.utc)
    for item in PUBLIC_PRODUCTS:
        if db is None:
            db_execute(
                """
                insert into app.public_products(slug, name, href, eyebrow, summary, bullets, cta, visible, created_at, updated_at)
                values (%s, %s, %s, %s, %s, %s::jsonb, %s, true, %s, %s)
                on conflict (slug) do update
                set name = excluded.name,
                    href = excluded.href,
                    eyebrow = excluded.eyebrow,
                    summary = excluded.summary,
                    bullets = excluded.bullets,
                    cta = excluded.cta,
                    visible = true,
                    updated_at = excluded.updated_at;
                """,
                (item["slug"], item["name"], item["href"], item["eyebrow"], item["summary"], json.dumps(item["bullets"]), item["cta"], now, now),
            )
        else:
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


async def list_public_products(db) -> list[dict[str, Any]]:
    await ensure_public_products_seed(db)
    if db is None:
        items = db_fetchall(
            """
            select slug, name, href, eyebrow, summary, bullets, cta
            from app.public_products
            where visible = true
            order by name asc
            limit 20;
            """
        )
    else:
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
                "bullets": list(item.get("bullets") or [] if isinstance(item.get("bullets"), list) else json.loads(item.get("bullets") or "[]")),
                "cta": item["cta"],
            }
        )
    return normalized

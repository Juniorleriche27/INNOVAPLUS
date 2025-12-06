from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db

router = APIRouter(prefix="/engine", tags=["engine"])

COLL_RULES = "engine_rules"
COLL_DECISIONS = "decisions_audit"


def _now() -> str:
    return datetime.utcnow().isoformat()


def _default_rules() -> Dict[str, Any]:
    return {
        "_id": "default",
        "rag_sources": [],
        "llm": {"primary_model": "command-r-plus-08-2024", "smollm_enabled": True},
        "equity": {"quotas": []},
        "filters": {"languages": [], "countries": []},
        "updated_at": _now(),
    }


@router.get("/rules")
async def get_rules(db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db[COLL_RULES].find_one({"_id": "default"})
    if not doc:
        doc = _default_rules()
        await db[COLL_RULES].insert_one(doc)
    doc["updated_at"] = doc.get("updated_at") or _now()
    return doc


@router.put("/rules")
async def update_rules(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Met à jour les règles RAG/équité. Charge utile libre mais normalisée sur quelques clés.
    """
    doc = await db[COLL_RULES].find_one({"_id": "default"}) or _default_rules()

    def clean_list(val: Optional[List[Any]]) -> List[Any]:
        if not val:
            return []
        return [v for v in val if v]

    rag_sources = clean_list(payload.get("rag_sources"))
    quotas = payload.get("equity", {}).get("quotas") if isinstance(payload.get("equity"), dict) else []
    llm = payload.get("llm") or {}
    filters = payload.get("filters") or {}

    doc["rag_sources"] = rag_sources
    doc["equity"] = {"quotas": quotas or []}
    doc["llm"] = {
        "primary_model": llm.get("primary_model") or doc.get("llm", {}).get("primary_model") or "command-r-plus-08-2024",
        "smollm_enabled": bool(llm.get("smollm_enabled")) if llm.get("smollm_enabled") is not None else doc.get("llm", {}).get("smollm_enabled", True),
    }
    doc["filters"] = {
        "languages": clean_list(filters.get("languages")),
        "countries": clean_list(filters.get("countries")),
    }
    doc["updated_at"] = _now()

    await db[COLL_RULES].update_one({"_id": "default"}, {"$set": doc}, upsert=True)
    return {"ok": True, "updated_at": doc["updated_at"]}


@router.get("/decisions")
async def list_decisions(limit: int = 20, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Retourne le journal des décisions d’équité / matching (limité).
    """
    cur = (
        db[COLL_DECISIONS]
        .find({})
        .sort("ts", -1)
        .limit(min(limit, 100))
    )
    items = []
    async for d in cur:
        items.append(
            {
                "kind": d.get("kind"),
                "offer_id": d.get("offer_id"),
                "user_id": d.get("user_id"),
                "need_index": d.get("need_index"),
                "quota": d.get("quota"),
                "ts": d.get("ts"),
            }
        )
    return {"items": items}

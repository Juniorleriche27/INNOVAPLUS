from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db


router = APIRouter(tags=["innova-core"])  # will be included under /innova/api


def serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    d = dict(doc)
    if "_id" in d:
        d["id"] = str(d.pop("_id"))
    return d


@router.get("/domains")
async def list_domains(db: AsyncIOMotorDatabase = Depends(get_db)) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    async for doc in db["domains"].find({}).sort("_id", -1):
        items.append(serialize(doc))
    return items


@router.get("/contributors")
async def list_contributors(db: AsyncIOMotorDatabase = Depends(get_db)) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    async for doc in db["contributors"].find({}).sort("_id", -1):
        items.append(serialize(doc))
    return items


@router.get("/technologies")
async def list_technologies(db: AsyncIOMotorDatabase = Depends(get_db)) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    async for doc in db["technologies"].find({}).sort("_id", -1):
        items.append(serialize(doc))
    return items


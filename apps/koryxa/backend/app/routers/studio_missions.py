from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.db.mongo import get_db
from app.schemas.myplanning import TaskCreatePayload
from app.deps.auth import get_current_user

router = APIRouter(prefix="/studio-missions", tags=["studio-missions"])


class MissionCreate(BaseModel):
    titre: str
    type: str
    description: str
    public_cible: str
    objectif: str
    ton: str
    budget: Optional[str] = None
    devise: Optional[str] = None
    deadline: Optional[str] = None
    client_id: str = Field(default="demo-client")
    client_name: str = Field(default="Client demo")


class MissionDB(MissionCreate):
    id: str | None = None
    statut: str = "Ouverte"
    redacteur_id: Optional[str] = None
    redacteur_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def _serialize(doc: dict) -> dict:
    doc = dict(doc or {})
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    if doc.get("client_id") is not None:
        doc["client_id"] = str(doc["client_id"])
    if doc.get("redacteur_id") is not None:
        doc["redacteur_id"] = str(doc["redacteur_id"])
    return doc


@router.get("", response_model=list[dict])
async def list_missions(db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db["studio_missions"].find({}).sort("created_at", -1)
    missions: list[dict] = []
    async for doc in cursor:
        missions.append(_serialize(doc))
    return missions


@router.post("", response_model=dict)
async def create_mission(
    payload: MissionCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    client_id = current["_id"]
    client_name = f"{current.get('first_name','') or ''} {current.get('last_name','') or ''}".strip() or current.get("email") or "Client"
    doc = payload.dict()
    doc.update({
        "statut": "Ouverte",
        "created_at": datetime.now(timezone.utc),
        "client_id": client_id,
        "client_name": client_name,
    })
    res = await db["studio_missions"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize(doc)


@router.get("/{mission_id}", response_model=dict)
async def get_mission(mission_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    from bson import ObjectId

    try:
        oid = ObjectId(mission_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID invalide")
    doc = await db["studio_missions"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Mission introuvable")
    return _serialize(doc)


class AssignPayload(BaseModel):
    redacteur_id: str = Field(default="demo-redacteur")
    redacteur_name: str = Field(default="Rédacteur demo")


@router.post("/{mission_id}/assign", response_model=dict)
async def assign_mission(
    mission_id: str,
    payload: AssignPayload,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    from bson import ObjectId

    try:
        oid = ObjectId(mission_id)
    except Exception:
        raise HTTPException(status_code=400, detail="ID invalide")

    doc = await db["studio_missions"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Mission introuvable")
    if doc.get("statut") != "Ouverte" or doc.get("redacteur_id"):
        raise HTTPException(status_code=409, detail="Mission non disponible")

    redacteur_id = current["_id"]
    redacteur_name = f"{current.get('first_name','') or ''} {current.get('last_name','') or ''}".strip() or current.get("email") or payload.redacteur_name

    await db["studio_missions"].update_one(
        {"_id": oid},
        {"$set": {"statut": "En cours", "redacteur_id": redacteur_id, "redacteur_name": redacteur_name}},
    )
    doc = await db["studio_missions"].find_one({"_id": oid})
    doc = _serialize(doc)

    # Créer une tâche MyPlanning pour le rédacteur
    try:
        due_dt = None
        if doc.get("deadline"):
            try:
                due_dt = datetime.fromisoformat(str(doc["deadline"]))
            except Exception:
                due_dt = None
        task_payload = TaskCreatePayload(
            title=f"Mission: {doc.get('titre','')}",
            description=doc.get("description"),
            category="mission",
            priority_eisenhower="important_not_urgent",
            kanban_state="todo",
            high_impact=True,
            estimated_duration_minutes=doc.get("estimated_duration_minutes") or 90,
            due_datetime=due_dt,
            source="ia",
        )
        task_doc = task_payload.dict()
        task_doc["user_id"] = redacteur_id
        task_doc["assignee_user_id"] = redacteur_id
        task_doc["created_at"] = datetime.utcnow()
        task_doc["updated_at"] = datetime.utcnow()
        await db["myplanning_tasks"].insert_one(task_doc)
    except Exception:
        # Ne pas bloquer l'assignation si la création de tâche échoue
        pass

    return doc

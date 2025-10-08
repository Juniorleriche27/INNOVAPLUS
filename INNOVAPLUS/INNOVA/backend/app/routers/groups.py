from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.groups import GroupCreate, GroupOut
from app.utils.ids import serialize_id, to_object_id


router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.get("/")
async def list_groups(db: AsyncIOMotorDatabase = Depends(get_db)):
    items = []
    cursor = db["groups"].find({}).sort("_id", -1)
    async for doc in cursor:
        gid = str(doc["_id"])  # string for matching
        members_count = await db["group_members"].count_documents({"group_id": gid})
        posts_count = await db["posts"].count_documents({"group_id": gid})
        out = serialize_id(doc)
        out["members_count"] = members_count
        out["posts_count"] = posts_count
        items.append(out)
    # Keep shape flexible (frontend handles arrays or {data})
    return {"data": items}


@router.get("/{group_id}")
async def get_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    gid = to_object_id(group_id)
    doc = await db["groups"].find_one({"_id": gid})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    # load owner and members
    owner = None
    if doc.get("owner_id"):
        owner = await db["users"].find_one({"_id": to_object_id(doc["owner_id"])})
    members = []
    async for m in db["group_members"].find({"group_id": str(gid)}):
        u = await db["users"].find_one({"_id": to_object_id(m["user_id"])})
        members.append({"id": m["user_id"], "name": (u or {}).get("name"), "role": m.get("role", "member")})
    out = serialize_id(doc)
    out["owner"] = {"id": doc.get("owner_id"), "name": (owner or {}).get("name")}
    out["members"] = members
    return out


@router.post("/", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(payload: GroupCreate, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    doc = {
        "owner_id": str(current["_id"]),
        "name": payload.name,
        "description": payload.description,
        "is_public": bool(payload.is_public),
    }
    res = await db["groups"].insert_one(doc)
    gid = res.inserted_id
    # add creator as admin member
    await db["group_members"].insert_one({"group_id": str(gid), "user_id": str(current["_id"]), "role": "admin"})
    doc["_id"] = gid
    out = serialize_id(doc)
    out["members_count"] = 1
    out["posts_count"] = 0
    return out


@router.put("/{group_id}")
async def update_group(group_id: str, payload: GroupCreate, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    gid = to_object_id(group_id)
    group = await db["groups"].find_one({"_id": gid})
    if not group:
        raise HTTPException(status_code=404, detail="Not found")
    if group.get("owner_id") != str(current["_id"]):
        raise HTTPException(status_code=403, detail="Non autorisé")
    updates = {k: v for k, v in {
        "name": payload.name,
        "description": payload.description,
        "is_public": bool(payload.is_public),
    }.items() if v is not None}
    if updates:
        await db["groups"].update_one({"_id": gid}, {"$set": updates})
        group.update(updates)
    out = serialize_id(group)
    return out


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    gid = to_object_id(group_id)
    group = await db["groups"].find_one({"_id": gid})
    if not group:
        return None
    if group.get("owner_id") != str(current["_id"]):
        raise HTTPException(status_code=403, detail="Non autorisé")
    await db["groups"].delete_one({"_id": gid})
    await db["group_members"].delete_many({"group_id": str(gid)})
    return None


@router.post("/{group_id}/join")
async def join_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    gid = to_object_id(group_id)
    group = await db["groups"].find_one({"_id": gid})
    if not group:
        raise HTTPException(status_code=404, detail="Not found")
    uid = str(current["_id"])
    exists = await db["group_members"].find_one({"group_id": str(gid), "user_id": uid})
    if not exists:
        await db["group_members"].insert_one({"group_id": str(gid), "user_id": uid, "role": "member"})
    return {"joined": True}


@router.post("/{group_id}/leave")
async def leave_group(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    gid = to_object_id(group_id)
    group = await db["groups"].find_one({"_id": gid})
    if not group:
        raise HTTPException(status_code=404, detail="Not found")
    uid = str(current["_id"])
    if group.get("owner_id") == uid:
        raise HTTPException(status_code=422, detail="Le propriétaire ne peut pas quitter son groupe.")
    await db["group_members"].delete_one({"group_id": str(gid), "user_id": uid})
    return {"left": True}


@router.get("/{group_id}/members")
async def group_members(group_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    gid = to_object_id(group_id)
    members = []
    async for m in db["group_members"].find({"group_id": str(gid)}):
        u = await db["users"].find_one({"_id": to_object_id(m["user_id"])})
        members.append({"id": m["user_id"], "name": (u or {}).get("name"), "role": m.get("role", "member")})
    return members


@router.post("/{group_id}/members/{user_id}/make-admin")
async def make_admin(group_id: str, user_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    gid = to_object_id(group_id)
    group = await db["groups"].find_one({"_id": gid})
    if not group:
        raise HTTPException(status_code=404, detail="Not found")
    if group.get("owner_id") != str(current["_id"]):
        raise HTTPException(status_code=403, detail="Non autorisé")
    await db["group_members"].update_one({"group_id": str(gid), "user_id": str(to_object_id(user_id))}, {"$set": {"role": "admin"}}, upsert=False)
    return {"ok": True}


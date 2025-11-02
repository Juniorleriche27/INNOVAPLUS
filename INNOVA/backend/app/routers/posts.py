from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.common import Paginated
from app.schemas.posts import PostCreate, PostOut, CommentCreate, CommentOut
from app.utils.ids import serialize_id, to_object_id


router = APIRouter(prefix="/api", tags=["posts"]) 


@router.get("/posts", response_model=Paginated)
async def list_posts(page: int = 1, group_id: Optional[str] = Query(None), db: AsyncIOMotorDatabase = Depends(get_db)):
    per_page = 12
    skip = max(0, page - 1) * per_page
    filter_q = {}
    if group_id:
        try:
            filter_q["group_id"] = str(to_object_id(group_id))
        except Exception:
            # if invalid, return empty
            filter_q["group_id"] = ""
    cursor = db["posts"].find(filter_q).sort("_id", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        out = serialize_id(doc)
        # Resolve names
        user = await db["users"].find_one({"_id": to_object_id(doc["user_id"])}) if doc.get("user_id") else None
        group = await db["groups"].find_one({"_id": to_object_id(doc["group_id"])}) if doc.get("group_id") else None
        out["author_name"] = (user or {}).get("name")
        out["group_name"] = (group or {}).get("name")
        items.append(out)
    total = await db["posts"].count_documents(filter_q)
    last_page = max(1, (total + per_page - 1) // per_page)
    return {"data": items, "current_page": page, "last_page": last_page, "total": total}


@router.get("/posts/{post_id}", response_model=PostOut)
async def get_post(post_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db["posts"].find_one({"_id": to_object_id(post_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    out = serialize_id(doc)
    user = await db["users"].find_one({"_id": to_object_id(doc["user_id"])}) if doc.get("user_id") else None
    group = await db["groups"].find_one({"_id": to_object_id(doc["group_id"])}) if doc.get("group_id") else None
    out["author_name"] = (user or {}).get("name")
    out["group_name"] = (group or {}).get("name")
    return out


@router.post("/posts", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post(payload: PostCreate, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    # membership check if group_id provided
    if payload.group_id:
        gid = to_object_id(payload.group_id)
        is_owner = await db["groups"].find_one({"_id": gid, "owner_id": str(current["_id"])})
        is_member = await db["group_members"].find_one({"group_id": str(gid), "user_id": str(current["_id"])})
        if not (is_owner or is_member):
            raise HTTPException(status_code=403, detail="Vous devez être membre du groupe.")

    doc = {
        "user_id": str(current["_id"]),
        "group_id": str(to_object_id(payload.group_id)) if payload.group_id else None,
        "title": payload.title,
        "body": payload.body,
    }
    res = await db["posts"].insert_one(doc)
    doc["_id"] = res.inserted_id
    out = serialize_id(doc)
    out["author_name"] = current.get("name")
    if doc.get("group_id"):
        g = await db["groups"].find_one({"_id": to_object_id(doc["group_id"])})
        out["group_name"] = (g or {}).get("name")
    return out


@router.put("/posts/{post_id}", response_model=PostOut)
async def update_post(post_id: str, payload: PostCreate, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    oid = to_object_id(post_id)
    post = await db["posts"].find_one({"_id": oid})
    if not post:
        raise HTTPException(status_code=404, detail="Not found")
    if post.get("user_id") != str(current["_id"]):
        raise HTTPException(status_code=403, detail="Non autorisé")
    updates = {"title": payload.title, "body": payload.body}
    await db["posts"].update_one({"_id": oid}, {"$set": updates})
    post.update(updates)
    out = serialize_id(post)
    out["author_name"] = current.get("name")
    return out


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    oid = to_object_id(post_id)
    post = await db["posts"].find_one({"_id": oid})
    if not post:
        return None
    if post.get("user_id") != str(current["_id"]):
        raise HTTPException(status_code=403, detail="Non autorisé")
    await db["posts"].delete_one({"_id": oid})
    return None


@router.get("/posts/{post_id}/comments", response_model=Paginated)
async def list_comments(post_id: str, page: int = 1, db: AsyncIOMotorDatabase = Depends(get_db)):
    per_page = 20
    skip = max(0, page - 1) * per_page
    pid = to_object_id(post_id)
    cursor = db["comments"].find({"post_id": str(pid)}).sort("_id", 1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        out = serialize_id(doc)
        user = await db["users"].find_one({"_id": to_object_id(doc["user_id"])}) if doc.get("user_id") else None
        out["author_name"] = (user or {}).get("name")
        items.append(out)
    total = await db["comments"].count_documents({"post_id": str(pid)})
    last_page = max(1, (total + per_page - 1) // per_page)
    return {"data": items, "current_page": page, "last_page": last_page, "total": total}


@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def add_comment(post_id: str, payload: CommentCreate, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    pid = to_object_id(post_id)
    post = await db["posts"].find_one({"_id": pid})
    if not post:
        raise HTTPException(status_code=404, detail="Post introuvable")
    if post.get("group_id"):
        gid = to_object_id(post["group_id"])  # stored as str
        is_owner = await db["groups"].find_one({"_id": gid, "owner_id": str(current["_id"])})
        is_member = await db["group_members"].find_one({"group_id": str(gid), "user_id": str(current["_id"])})
        if not (is_owner or is_member):
            raise HTTPException(status_code=403, detail="Vous devez être membre du groupe.")
    doc = {"user_id": str(current["_id"]), "post_id": str(pid), "body": payload.body}
    res = await db["comments"].insert_one(doc)
    doc["_id"] = res.inserted_id
    out = serialize_id(doc)
    out["author_name"] = current.get("name")
    return out


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    oid = to_object_id(comment_id)
    comment = await db["comments"].find_one({"_id": oid})
    if not comment:
        return None
    post = await db["posts"].find_one({"_id": to_object_id(comment["post_id"])}) if comment.get("post_id") else None
    user_id = str(current["_id"])
    is_owner = comment.get("user_id") == user_id
    is_post_owner = post and post.get("user_id") == user_id
    if not (is_owner or is_post_owner):
        raise HTTPException(status_code=403, detail="Non autorisé")
    await db["comments"].delete_one({"_id": oid})
    return None


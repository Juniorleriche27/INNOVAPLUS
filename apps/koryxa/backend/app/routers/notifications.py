from __future__ import annotations

from datetime import datetime
from typing import List, Optional
import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.config import settings
from app.db.mongo import get_db_instance
from app.services.postgres_bootstrap import db_execute, db_fetchall

router = APIRouter(prefix="/notifications", tags=["notifications"])


class Notification(BaseModel):
    id: str
    user_id: str
    type: str  # new_opportunity | assignment_update | comment_reply
    payload: dict
    created_at: str
    read_at: Optional[str] = None


COLL_NOTIFS = "notifications"


@router.get("")
async def list_notifications(user_id: str, unread_only: Optional[int] = 0):
    if not settings.REQUIRE_MONGO:
        rows = db_fetchall(
            """
            select id::text as id,
                   user_id::text as user_id,
                   category as type,
                   payload_json as payload,
                   created_at::text as created_at,
                   read_at::text as read_at
            from app.notifications
            where user_id = %s::uuid
              and (%s = 0 or read_at is null)
            order by created_at desc;
            """,
            (user_id, int(bool(unread_only))),
        )
        return [Notification(**{**row, "payload": row.get("payload") if isinstance(row.get("payload"), dict) else json.loads(row.get("payload") or "{}")}) for row in rows]
    db = get_db_instance()
    q = {"user_id": user_id}
    if unread_only:
        q["read_at"] = {"$in": [None, ""]}
    cur = db[COLL_NOTIFS].find(q).sort("created_at", -1)
    return [Notification(**doc) async for doc in cur]


@router.post("")
async def create_notification(n: Notification):
    if not settings.REQUIRE_MONGO:
        db_execute(
            """
            insert into app.notifications(user_id, title, body, category, is_read, read_at, payload_json, created_at, updated_at)
            values (%s::uuid, %s, %s, %s, %s, %s, %s::jsonb, %s, %s);
            """,
            (
                n.user_id,
                n.type,
                None,
                n.type,
                bool(n.read_at),
                n.read_at,
                json.dumps(n.payload),
                n.created_at,
                n.created_at,
            ),
        )
        return {"ok": True}
    db = get_db_instance()
    await db[COLL_NOTIFS].insert_one(n.dict())
    return {"ok": True}


@router.post("/read")
async def mark_read(user_id: str, ids: List[str]):
    now = datetime.utcnow().isoformat()
    if not settings.REQUIRE_MONGO:
        db_execute(
            """
            update app.notifications
            set is_read = true, read_at = %s::timestamptz, updated_at = %s::timestamptz
            where user_id = %s::uuid and id::text = any(%s);
            """,
            (now, now, user_id, ids),
        )
        return {"ok": True}
    db = get_db_instance()
    await db[COLL_NOTIFS].update_many({"user_id": user_id, "id": {"$in": ids}}, {"$set": {"read_at": now}})
    return {"ok": True}

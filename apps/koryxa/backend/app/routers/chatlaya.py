from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timezone
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument
from sse_starlette.sse import EventSourceResponse

from app.core.public_access import ensure_guest_id, get_guest_id
from app.db.mongo import get_db
from app.deps.auth import get_current_user_optional
from app.schemas.chatlaya import (
    ChatMessageItem,
    ChatMessagePayload,
    ConversationUpdatePayload,
    ConversationListResponse,
    ConversationResponse,
    MessagesResponse,
)
from app.services.chatlaya_context import build_chatlaya_product_context
from app.services.chatlaya_specialist import CHATLAYA_MODE_GENERAL, coerce_assistant_mode
from app.services.chatlaya_service import generate_chat_reply
from app.utils.ids import to_object_id


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chatlaya", tags=["chatlaya"])

DEFAULT_CONVERSATION_TITLE = "Nouvelle conversation"
GUEST_MESSAGE_LIMIT = 12
GUEST_MESSAGE_WINDOW_S = 60 * 10
_GUEST_CHAT_BUCKETS: dict[str, list[float]] = {}
_GUEST_CHAT_LOCK = threading.Lock()


def _serialize_conversation(doc: dict) -> ConversationResponse:
    return ConversationResponse(
        conversation_id=str(doc["_id"]),
        title=doc.get("title") or DEFAULT_CONVERSATION_TITLE,
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
        archived=bool(doc.get("archived", False)),
        assistant_mode=coerce_assistant_mode(doc.get("assistant_mode")),
    )


def _serialize_message(doc: dict) -> ChatMessageItem:
    return ChatMessageItem(
        id=str(doc["_id"]),
        role=doc.get("role", "assistant"),
        content=doc.get("content", ""),
        created_at=doc.get("created_at"),
    )


def _owner_filter(current: dict | None, guest_id: str | None) -> dict[str, Any]:
    if current:
        return {"user_id": current["_id"]}
    if not guest_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session invitée introuvable")
    return {"guest_id": guest_id}


def _apply_guest_rate_limit(guest_id: str) -> None:
    now = time.monotonic()
    with _GUEST_CHAT_LOCK:
        bucket = [ts for ts in _GUEST_CHAT_BUCKETS.get(guest_id, []) if now - ts < GUEST_MESSAGE_WINDOW_S]
        if len(bucket) >= GUEST_MESSAGE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Limite atteinte pour le mode invité. Réessayez dans quelques minutes.",
            )
        bucket.append(now)
        _GUEST_CHAT_BUCKETS[guest_id] = bucket


async def _ensure_conversation(
    db: AsyncIOMotorDatabase,
    current: dict | None,
    guest_id: str | None,
) -> dict:
    query = {**_owner_filter(current, guest_id), "archived": {"$ne": True}}
    existing: List[dict] = await db["conversations"].find(query).sort("updated_at", -1).limit(1).to_list(1)
    if existing:
        return existing[0]

    now = datetime.now(timezone.utc)
    doc: dict[str, Any] = {
        "title": DEFAULT_CONVERSATION_TITLE,
        "created_at": now,
        "updated_at": now,
        "archived": False,
        "assistant_mode": CHATLAYA_MODE_GENERAL,
    }
    if current:
        doc["user_id"] = current["_id"]
    else:
        doc["guest_id"] = guest_id
    res = await db["conversations"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc


@router.post("/session")
async def start_session(
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    conversation = await _ensure_conversation(db, current, guest_id)
    return {"conversation_id": str(conversation["_id"]), "mode": "user" if current else "guest"}


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    request: Request,
    response: Response,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    skip = (page - 1) * limit
    cursor = (
        db["conversations"]
        .find({**_owner_filter(current, guest_id), "archived": {"$ne": True}})
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )
    items: List[ConversationResponse] = []
    async for doc in cursor:
        items.append(_serialize_conversation(doc))
    return ConversationListResponse(items=items, page=page, limit=limit)


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    now = datetime.now(timezone.utc)
    doc: dict[str, Any] = {
        "title": DEFAULT_CONVERSATION_TITLE,
        "created_at": now,
        "updated_at": now,
        "archived": False,
        "assistant_mode": CHATLAYA_MODE_GENERAL,
    }
    if current:
        doc["user_id"] = current["_id"]
    else:
        doc["guest_id"] = guest_id
    res = await db["conversations"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return _serialize_conversation(doc)


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdatePayload,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    conv_oid = to_object_id(conversation_id)
    updates = {
        "assistant_mode": coerce_assistant_mode(payload.assistant_mode),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await db["conversations"].find_one_and_update(
        {"_id": conv_oid, **_owner_filter(current, guest_id)},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable")
    return _serialize_conversation(result)


@router.post("/conversations/{conversation_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_conversation(
    conversation_id: str,
    request: Request,
    response: Response,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    conv_oid = to_object_id(conversation_id)
    result = await db["conversations"].update_one(
        {"_id": conv_oid, **_owner_filter(current, guest_id)},
        {"$set": {"archived": True, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable")
    return None


@router.get("/messages", response_model=MessagesResponse)
async def list_messages(
    request: Request,
    response: Response,
    conversation_id: str = Query(..., alias="conversation_id"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    conv_oid = to_object_id(conversation_id)
    conversation = await db["conversations"].find_one({"_id": conv_oid, **_owner_filter(current, guest_id)})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable")

    cursor = db["messages"].find({"conversation_id": conv_oid}).sort("created_at", 1)
    items: List[ChatMessageItem] = []
    async for doc in cursor:
        items.append(_serialize_message(doc))
    return MessagesResponse(items=items)


@router.post("/message")
async def post_message(
    payload: ChatMessagePayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict | None = Depends(get_current_user_optional),
):
    response = Response()
    guest_id = get_guest_id(request) if current else ensure_guest_id(request, response)
    if not current:
        _apply_guest_rate_limit(guest_id)

    conv_oid = to_object_id(payload.conversation_id)
    conversation = await db["conversations"].find_one({"_id": conv_oid, **_owner_filter(current, guest_id)})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable")

    now = datetime.now(timezone.utc)
    user_message: dict[str, Any] = {
        "conversation_id": conv_oid,
        "role": "user",
        "content": payload.message,
        "created_at": now,
    }
    if current:
        user_message["user_id"] = current["_id"]
    else:
        user_message["guest_id"] = guest_id
    await db["messages"].insert_one(user_message)

    title = conversation.get("title") or DEFAULT_CONVERSATION_TITLE
    if title == DEFAULT_CONVERSATION_TITLE:
        snippet = payload.message.strip().replace("\n", " ")
        if snippet:
            title = snippet[:80]
    await db["conversations"].update_one(
        {"_id": conv_oid},
        {"$set": {"updated_at": now, "title": title}},
    )

    history_docs = await (
        db["messages"]
        .find({"conversation_id": conv_oid})
        .sort("created_at", -1)
        .limit(12)
        .to_list(length=12)
    )
    history_docs.reverse()
    history_docs = history_docs[-8:]
    chat_history = [
        {"role": doc.get("role", "assistant"), "content": doc.get("content", "")}
        for doc in history_docs
    ]

    try:
        product_context = await build_chatlaya_product_context(db, current, guest_id)
    except Exception as exc:  # noqa: BLE001
        logger.warning("ChatLAYA product context build failed: %s", exc)
        product_context = ""
    assistant_mode = coerce_assistant_mode(conversation.get("assistant_mode"))
    reply, rag_sources = await generate_chat_reply(
        payload.message,
        chat_history,
        product_context=product_context,
        assistant_mode=assistant_mode,
    )
    assistant_doc: dict[str, Any] = {
        "conversation_id": conv_oid,
        "role": "assistant",
        "content": reply,
        "created_at": datetime.now(timezone.utc),
        "meta": {"rag_sources": rag_sources} if rag_sources else {},
    }
    if current:
        assistant_doc["user_id"] = current["_id"]
    else:
        assistant_doc["guest_id"] = guest_id
    await db["messages"].insert_one(assistant_doc)
    await db["conversations"].update_one(
        {"_id": conv_oid},
        {"$set": {"updated_at": datetime.now(timezone.utc)}},
    )

    async def event_generator():
        yield {"event": "token", "data": reply}
        yield {"event": "done", "data": "done"}

    sse_response = EventSourceResponse(event_generator())
    if not current and guest_id and not get_guest_id(request):
        sse_response.set_cookie(
            "koryxa_guest",
            guest_id,
            max_age=60 * 60 * 24 * 30,
            httponly=True,
            samesite="lax",
            secure=request.url.scheme == "https",
            path="/",
        )
    return sse_response

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from sse_starlette.sse import EventSourceResponse

from app.core.ai import generate_answer
from app.core.config import settings
from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.chatlaya import (
    ChatMessageItem,
    ChatMessagePayload,
    ConversationListResponse,
    ConversationResponse,
    MessagesResponse,
)
from app.utils.ids import to_object_id


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chatlaya", tags=["chatlaya"])

DEFAULT_CONVERSATION_TITLE = "Nouvelle conversation"


def _serialize_conversation(doc: dict) -> ConversationResponse:
    return ConversationResponse(
        id=str(doc["_id"]),
        title=doc.get("title") or DEFAULT_CONVERSATION_TITLE,
        created_at=doc.get("created_at"),
        updated_at=doc.get("updated_at"),
        archived=bool(doc.get("archived", False)),
    )


def _serialize_message(doc: dict) -> ChatMessageItem:
    return ChatMessageItem(
        id=str(doc["_id"]),
        role=doc.get("role", "assistant"),
        content=doc.get("content", ""),
        created_at=doc.get("created_at"),
    )


async def _ensure_conversation(
    db: AsyncIOMotorDatabase,
    user_id: ObjectId,
) -> dict:
    existing: List[dict] = await db["conversations"].find(
        {"user_id": user_id, "archived": {"$ne": True}}
    ).sort("updated_at", -1).limit(1).to_list(1)
    if existing:
        return existing[0]

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "title": DEFAULT_CONVERSATION_TITLE,
        "created_at": now,
        "updated_at": now,
        "archived": False,
    }
    res = await db["conversations"].insert_one(doc)
    doc["_id"] = res.inserted_id
    return doc


@router.post("/session")
async def start_session(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    conversation = await _ensure_conversation(db, current["_id"])
    return {"conversation_id": str(conversation["_id"])}


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    skip = (page - 1) * limit
    cursor = (
        db["conversations"]
        .find({"user_id": current["_id"], "archived": {"$ne": True}})
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )
    items: List[ConversationResponse] = []
    async for doc in cursor:
        items.append(_serialize_conversation(doc))
    return ConversationListResponse(items=items, page=page, limit=limit)


@router.get("/messages", response_model=MessagesResponse)
async def list_messages(
    conversation_id: str = Query(..., alias="conversation_id"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    conv_oid = to_object_id(conversation_id)
    conversation = await db["conversations"].find_one({"_id": conv_oid, "user_id": current["_id"]})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable")

    cursor = db["messages"].find({"conversation_id": conv_oid}).sort("created_at", 1)
    items: List[ChatMessageItem] = []
    async for doc in cursor:
        items.append(_serialize_message(doc))
    return MessagesResponse(items=items)


def _tokenize_reply(text: str, chunk_size: int = 40) -> List[str]:
    tokens: List[str] = []
    for start in range(0, len(text), chunk_size):
        tokens.append(text[start:start + chunk_size])
    if not tokens:
        tokens.append("")
    return tokens


@router.post("/message")
async def post_message(
    payload: ChatMessagePayload,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    conv_oid = to_object_id(payload.conversation_id)
    conversation = await db["conversations"].find_one({"_id": conv_oid, "user_id": current["_id"]})
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation introuvable")

    now = datetime.now(timezone.utc)
    user_message = {
        "conversation_id": conv_oid,
        "user_id": current["_id"],
        "role": "user",
        "content": payload.message,
        "created_at": now,
    }
    res = await db["messages"].insert_one(user_message)
    user_message["_id"] = res.inserted_id

    # Update conversation metadata (title set on first user message)
    title = conversation.get("title") or DEFAULT_CONVERSATION_TITLE
    if title == DEFAULT_CONVERSATION_TITLE:
        snippet = payload.message.strip().replace("\n", " ")
        if snippet:
            title = snippet[:80]
    await db["conversations"].update_one(
        {"_id": conv_oid},
        {"$set": {"updated_at": now, "title": title}},
    )

    async def event_generator() -> AsyncGenerator[dict, None]:
        assistant_reply = ""
        try:
            response_text = await asyncio.to_thread(
                generate_answer,
                payload.message,
                provider=settings.CHAT_PROVIDER,
                model=settings.CHAT_MODEL,
                timeout=settings.LLM_TIMEOUT,
            )
        except Exception as exc:
            logger.exception("Chatlaya generation failed: %s", exc)
            yield {"event": "error", "data": "internal_error"}
            return

        for chunk in _tokenize_reply(response_text):
            assistant_reply += chunk
            if await request.is_disconnected():
                logger.debug("Client disconnected during SSE stream.")
                return
            yield {"event": "token", "data": chunk}

        assistant_doc = {
            "conversation_id": conv_oid,
            "user_id": current["_id"],
            "role": "assistant",
            "content": assistant_reply,
            "created_at": datetime.now(timezone.utc),
        }
        try:
            await db["messages"].insert_one(assistant_doc)
            await db["conversations"].update_one(
                {"_id": conv_oid},
                {"$set": {"updated_at": datetime.now(timezone.utc)}},
            )
        except Exception as exc:
            logger.warning("Failed to persist assistant reply: %s", exc)

        yield {"event": "done", "data": "done"}

    return EventSourceResponse(event_generator())

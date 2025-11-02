from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.ai import embed_texts, generate_answer
from app.core.config import settings
from app.db.mongo import get_db


router = APIRouter(tags=["innova-rag"])  # mounted at root


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/ingest")
async def ingest(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    source = payload.get("source")  # file|url|note
    content = payload.get("content")
    owner_id = payload.get("owner_id")
    tags = payload.get("tags") or []
    if not content or not isinstance(content, str):
        raise HTTPException(status_code=422, detail="content string is required")

    # Create document
    doc = {
        "doc_id": None,  # set after insert
        "source": source or "note",
        "owner_id": owner_id,
        "meta": {"tags": tags},
        "created_at": now_iso(),
    }
    res = await db["documents"].insert_one(doc)
    doc_id = str(res.inserted_id)
    await db["documents"].update_one({"_id": res.inserted_id}, {"$set": {"doc_id": doc_id}})

    # Chunking (very simple)
    chunks: List[str] = []
    chunk_size = 800
    text = content.strip()
    for i in range(0, len(text), chunk_size):
        chunks.append(text[i : i + chunk_size])

    # Embed and insert vectors
    vecs = embed_texts(chunks, dim=settings.EMBED_DIM)
    docs = []
    for idx, (ch, emb) in enumerate(zip(chunks, vecs)):
        docs.append({
            "doc_id": doc_id,
            "chunk_id": idx,
            "text": ch,
            "embedding": emb,
            "tags": tags,
            "created_at": now_iso(),
        })
    if docs:
        await db["vectors"].insert_many(docs)

    return {"ok": True, "doc_id": doc_id, "chunks_indexed": len(docs)}


@router.post("/chat")
async def chat(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    conversation_id = payload.get("conversation_id")
    question = payload.get("question")
    provider = payload.get("provider") or settings.LLM_PROVIDER
    top_k = int(payload.get("top_k") or settings.RAG_TOP_K_DEFAULT)
    if not question:
        raise HTTPException(status_code=422, detail="question is required")

    qvec = embed_texts([question], dim=settings.EMBED_DIM)[0]

    # Vector Search (Atlas Search index: vector_index)
    sources: List[Dict[str, Any]] = []
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": settings.VECTOR_INDEX_NAME,
                    "path": "embedding",
                    "queryVector": qvec,
                    "numCandidates": min(400, top_k * 50),
                    "limit": top_k,
                }
            },
            {"$project": {"text": 1, "doc_id": 1, "chunk_id": 1, "score": {"$meta": "vectorSearchScore"}}},
        ]
        cursor = db["vectors"].aggregate(pipeline)
        async for doc in cursor:
            sources.append({
                "doc_id": doc.get("doc_id"),
                "chunk_id": doc.get("chunk_id"),
                "text": doc.get("text"),
                "score": float(doc.get("score", 0.0)),
            })
    except Exception:
        # Fallback: return empty sources
        sources = []

    # Build prompt
    context = "\n\n".join(s.get("text", "") for s in sources)
    prompt = f"Question: {question}\n\nContexte pertinent:\n{context}\n\nRéponds de manière précise et concise."

    t0 = time.perf_counter()
    answer = generate_answer(prompt, provider=provider, model=settings.LLM_MODEL, timeout=settings.LLM_TIMEOUT)
    latency = time.perf_counter() - t0

    # Conversations/messages logging (minimal)
    if not conversation_id:
        cres = await db["conversations"].insert_one({
            "user_id": None,
            "title": question[:80],
            "created_at": now_iso(),
            "last_activity_at": now_iso(),
        })
        conversation_id = str(cres.inserted_id)
    else:
        try:
            from bson import ObjectId
            await db["conversations"].update_one(
                {"_id": ObjectId(conversation_id)},
                {"$set": {"last_activity_at": now_iso()}},
                upsert=False,
            )
        except Exception:
            pass

    await db["messages_innova"].insert_many([
        {"conversation_id": conversation_id, "role": "user", "text": question, "meta": {}, "created_at": now_iso()},
        {"conversation_id": conversation_id, "role": "assistant", "text": answer, "meta": {"provider": provider, "latency": latency, "top_k": top_k}, "created_at": now_iso()},
    ])

    return {"answer": answer, "conversation_id": conversation_id, "sources": sources}


@router.post("/feedback")
async def feedback(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    message_id = payload.get("message_id")
    rating = payload.get("rating")
    comment = payload.get("comment")
    if rating not in (-1, 0, 1):
        raise HTTPException(status_code=422, detail="rating must be -1, 0 or 1")
    doc = {"message_id": message_id, "rating": rating, "comment": comment, "created_at": now_iso()}
    await db["feedback"].insert_one(doc)
    return {"ok": True}

from __future__ import annotations

from typing import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings


_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global _client, _db
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGO_URI)
        _db = _client[settings.DB_NAME]
        # Ensure indexes (idempotent)
        await _db["users"].create_index("email", unique=True)
        await _db["messages"].create_index([("sender_id", 1), ("recipient_id", 1)])
        await _db["messages"].create_index([("recipient_id", 1), ("read_at", 1)])
        await _db["posts"].create_index("group_id")
        await _db["group_members"].create_index([("group_id", 1), ("user_id", 1)], unique=True)


async def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db_instance() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("MongoDB is not connected. Ensure startup event ran.")
    return _db


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    yield get_db_instance()

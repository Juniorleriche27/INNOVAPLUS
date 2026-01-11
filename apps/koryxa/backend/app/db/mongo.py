from __future__ import annotations

from typing import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import PyMongoError

from app.core.config import settings


_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None  # default DB for PlusBook


async def connect_to_mongo() -> None:
    global _client, _db
    if _client is None:
        _client = AsyncIOMotorClient(settings.MONGO_URI)
        _db = _client[settings.DB_NAME]
        # Ensure indexes (idempotent)
        try:
            await _db["users"].create_index("email", unique=True)
            await _db["messages"].create_index([("sender_id", 1), ("recipient_id", 1)])
            await _db["messages"].create_index([("recipient_id", 1), ("read_at", 1)])
            await _db["posts"].create_index("group_id")
            await _db["group_members"].create_index([("group_id", 1), ("user_id", 1)], unique=True)

            # INNOVA core collections
            await _db["conversations"].create_index([("user_id", 1), ("last_activity_at", -1)])
            await _db["messages_innova"].create_index([("conversation_id", 1), ("created_at", 1)])
            await _db["feedback"].create_index([("message_id", 1), ("created_at", 1)])
            await _db["documents"].create_index([("doc_id", 1)], unique=True)
            await _db["vectors"].create_index([("doc_id", 1), ("chunk_id", 1)])

            # Matching/Fairness collections
            await _db["profiles"].create_index("user_id")
            await _db["profiles"].create_index("country")
            await _db["profiles"].create_index("last_active_at")
            await _db["workspace_profiles"].create_index([("user_id", 1)], unique=True)
            await _db["workspace_profiles"].create_index([("demandeur.country", 1)])
            await _db["workspace_profiles"].create_index([("prestataire.skills", 1)])
            await _db["workspace_profiles"].create_index([("updated_at", -1)])
            await _db["opportunities"].create_index("status")
            await _db["opportunities"].create_index("created_at")
            await _db["assignments"].create_index("opportunity_id")
            await _db["assignments"].create_index("user_id")
            await _db["fairness_windows"].create_index("period_start")
            await _db["decisions_audit"].create_index("created_at")
            await _db["myplanning_tasks"].create_index([("user_id", 1), ("due_datetime", 1)])
            await _db["myplanning_tasks"].create_index([("user_id", 1), ("kanban_state", 1)])
            # Data reservoir collections
            await _db["ai_interactions"].create_index([("user_id_anon", 1), ("ts", -1)])
            await _db["social_messages"].create_index([("thread_id", 1), ("ts", 1)])
            await _db["planning_events"].create_index([("user_id_anon", 1), ("ts", -1)])

            # KORYXA School collections
            await _db["certificate_programs"].create_index([("slug", 1)], unique=True)
            await _db["certificate_programs"].create_index([("category", 1), ("status", 1)])
            await _db["certificate_modules"].create_index([("certificate_id", 1), ("order_index", 1)])
            await _db["certificate_lessons"].create_index([("certificate_id", 1), ("order_index", 1)])
            await _db["lesson_resources"].create_index([("lesson_id", 1)])
            await _db["certificate_enrollments"].create_index([("user_id", 1), ("certificate_id", 1)], unique=True)
            await _db["lesson_progress"].create_index([("enrollment_id", 1), ("lesson_id", 1)], unique=True)
            await _db["certificate_evidence"].create_index([("certificate_id", 1), ("user_id", 1)])
            await _db["issued_certificates"].create_index([("certificate_id", 1), ("user_id", 1)], unique=True)
            await _db["certificate_skill_links"].create_index([("certificate_id", 1), ("skill_slug", 1)], unique=True)
            await _db["user_certificate_skills"].create_index([("user_id", 1), ("skill_slug", 1)], unique=True)
            await _db["module_submissions"].create_index([("user_id", 1), ("module_id", 1), ("created_at", -1)])
            await _db["module_test_sessions"].create_index([("test_id", 1)], unique=True)
            await _db["module_test_sessions"].create_index([("user_id", 1), ("created_at", -1)])
            await _db["module_test_attempts"].create_index([("user_id", 1), ("module_id", 1), ("created_at", -1)])
            await _db["module1_submissions"].create_index([("user_id", 1), ("created_at", -1)])
            await _db["module1_notebook_validations"].create_index([("user_id", 1)], unique=True)
            await _db["module1_quiz_sessions"].create_index([("user_id", 1), ("created_at", -1)])
            await _db["module1_quiz_attempts"].create_index([("user_id", 1), ("created_at", -1)])

            # Auth & Chatlaya collections
            await _db["sessions"].create_index("token_hash", unique=True)
            await _db["sessions"].create_index("expires_at", expireAfterSeconds=0)
            await _db["sessions"].create_index([("user_id", 1), ("revoked", 1)])
            await _db["password_reset_tokens"].create_index("token_hash", unique=True)
            await _db["password_reset_tokens"].create_index("expires_at", expireAfterSeconds=0)
            await _db["password_reset_tokens"].create_index([("user_id", 1), ("used", 1)])
            await _db["login_otps"].create_index("email")
            await _db["login_otps"].create_index("expires_at", expireAfterSeconds=0)
            await _db["conversations"].create_index([("user_id", 1), ("updated_at", -1)])
            await _db["messages"].create_index([("conversation_id", 1), ("created_at", 1)])

            # Try to create Atlas Vector Search index if supported
            try:
                await _db.command({
                    "createSearchIndexes": "vectors",
                    "indexes": [
                        {
                            "name": "vector_index",
                            "definition": {
                                "fields": {
                                    "embedding": {
                                        "type": "vector",
                                        "numDimensions": settings.EMBED_DIM,
                                        "similarity": "cosine",
                                    }
                                }
                            },
                        }
                    ],
                })
            except PyMongoError:
                # Ignore if not supported or already exists
                pass
        except PyMongoError:
            # Avoid crashing startup; health endpoint will reflect status
            pass


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


def get_named_db_instance(name: str) -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("MongoDB is not connected. Ensure startup event ran.")
    return _client[name]


async def get_db_by_name(name: str) -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    yield get_named_db_instance(name)
 

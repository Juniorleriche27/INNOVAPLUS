from __future__ import annotations

from fastapi import FastAPI, Depends
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from urllib.parse import urlparse

from app.core.config import settings
from app.db.mongo import close_mongo_connection, connect_to_mongo
from app.routers.auth import router as auth_router
from app.routers.ebooks import router as ebooks_router
from app.routers.posts import router as posts_router
from app.routers.messages import router as messages_router
from app.routers.groups import router as groups_router
from app.routers.contact import router as contact_router
from app.routers.chatlaya import router as chatlaya_router
from app.routers.diagnostics import router as diag_router
from app.routers.innova import router as innova_router
from app.routers.pieagency import router as pieagency_router
from app.routers.farmlink import router as farmlink_router
from app.routers.sante import router as sante_router
from app.routers.rag import router as rag_router
from app.routers.me import router as me_router
from app.routers.notifications import router as notifications_router
from app.routers.metrics import router as metrics_router
from app.routers.emailer import router as email_router
from app.routers.invite import router as invite_router
from app.routers.opportunities import router as opportunities_router
from app.routers.marketplace import router as market_router
from app.routers.meet_api import router as meet_router
from app.routers.smollm import router as smollm_router
from app.routers.profiles import router as profiles_router
from app.routers.missions import router as missions_router
from app.routers.myplanning import router as myplanning_router
from app.core.ai import detect_embed_dim
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db
import os


app = FastAPI(title=settings.APP_NAME)

raw_origins = [o.strip() for o in (settings.ALLOWED_ORIGINS or "").split(",") if o.strip()]
cors_origins = {origin.rstrip("/") for origin in raw_origins}

frontend_url = (settings.FRONTEND_BASE_URL or "").strip()
if frontend_url:
    cors_origins.add(frontend_url.rstrip("/"))
    parsed = urlparse(frontend_url)
    host = parsed.hostname or ""
    scheme = parsed.scheme or "https"
    if host and not host.startswith("www."):
        cors_origins.add(f"{scheme}://www.{host}".rstrip("/"))

if not cors_origins:
    cors_origins = {"https://innovaplus.africa", "https://www.innovaplus.africa"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(cors_origins),
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    # Include PATCH/PUT/DELETE for task updates (MyPlanning) and other mutations
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.on_event("startup")
async def on_startup():
    await connect_to_mongo()
    # Verify embedding dimension dynamically and adjust if needed
    try:
        actual = detect_embed_dim()
        if actual != settings.EMBED_DIM:
            import logging
            logging.getLogger(__name__).warning(
                "EMBED_DIM mismatch: env=%s detected=%s -> using detected",
                settings.EMBED_DIM,
                actual,
            )
            settings.EMBED_DIM = actual
    except Exception:
        pass
    
    # Initialize SmolLM if enabled
    try:
        from app.core.smollm_init import initialize_smollm_on_startup
        initialize_smollm_on_startup()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"SmolLM initialization failed: {e}")
    # Ensure indexes
    try:
        from app.db.mongo import get_db
        from fastapi import Depends
        db = await get_db()  # type: ignore
        await db["market_offers"].create_index([("status", 1), ("created_at", -1)])
        await db["market_offers"].create_index([("country", 1)])
        await db["mission_offers"].create_index([("mission_id", 1), ("prestataire_id", 1)])
        await db["missions"].create_index([("user_id", 1), ("status", 1)])
        await db["mission_events"].create_index([("mission_id", 1), ("ts", -1)])
        await db["mission_messages"].create_index([("mission_id", 1), ("created_at", 1)])
        await db["mission_milestones"].create_index([("mission_id", 1)])
        await db["mission_escalations"].create_index([("decided_at", -1)])
        await db["assignments"].create_index([("offer_id", 1), ("user_id", 1)], unique=True)
        await db["meet_posts"].create_index([("country", 1), ("created_at", -1)])
        await db["notifications"].create_index([("user_id", 1), ("created_at", -1)])
        await db["metrics_product"].create_index([("name", 1), ("ts", -1)])
        await db["me_profiles"].create_index([("user_id", 1)], unique=True)
        await db["decisions_audit"].create_index([("offer_id", 1), ("ts", -1)])
    except Exception:
        pass


@app.on_event("shutdown")
async def on_shutdown():
    await close_mongo_connection()


START_TIME = __import__("time").time()


@app.get("/")
async def root():
    return {"status": "ok", "service": settings.APP_NAME, "docs": "/docs"}


@app.get("/health")
async def health(db: AsyncIOMotorDatabase = Depends(get_db)):
    ok = False
    try:
        await db.command("ping")
        ok = True
    except Exception:
        ok = False
    uptime = int(__import__("time").time() - START_TIME)
    # env checks
    required = [
        # add critical keys here, optional in dev
        # "MONGODB_URI",
    ]
    missing = [k for k in required if not os.getenv(k)]
    vector_index = True  # placeholder
    queue_depth = 0      # placeholder
    return {
        "status": "ok" if ok else "down",
        "db": settings.DB_NAME,
        "mongo": "ok" if ok else "fail",
        "vector_index": vector_index,
        "env_missing": missing,
        "queue_depth": queue_depth,
        "uptime_s": uptime,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "commit_sha": os.getenv("COMMIT_SHA", "unknown"),
    }


# Only include module routers (health, etc.) at root; feature APIs live under /plusbook
app.include_router(innova_router)
app.include_router(pieagency_router)
app.include_router(farmlink_router)
app.include_router(sante_router)
app.include_router(rag_router)
app.include_router(chatlaya_router)

# Mount module-prefixed routes
innova_api = APIRouter(prefix="/innova/api")
# Legacy INNOVA core lists (domains/contributors/technologies) disabled
# innova_api.include_router(innova_core_router)
innova_api.include_router(opportunities_router)
innova_api.include_router(market_router)
innova_api.include_router(meet_router)
innova_api.include_router(me_router)
innova_api.include_router(notifications_router)
innova_api.include_router(metrics_router)
innova_api.include_router(email_router)
innova_api.include_router(invite_router)
innova_api.include_router(smollm_router)
innova_api.include_router(profiles_router)
innova_api.include_router(missions_router)
innova_api.include_router(myplanning_router)
innova_api.include_router(auth_router)
app.include_router(innova_api)
# Temporary compatibility: handle clients that accidentally send /innova/api/innova/api/*
# by mounting the same router with an extra prefix. This avoids 404 while frontend caches expire.
app.include_router(innova_api, prefix="/innova/api")

innova_rag = APIRouter(prefix="/innova")
innova_rag.include_router(rag_router)
app.include_router(innova_rag)

# Serve public storage similar to Laravel's /storage symlink
app.mount("/storage", StaticFiles(directory="storage/public"), name="storage")

# Mount the same API under /plusbook prefix for unified gateway
plusbook = APIRouter(prefix="/plusbook")
plusbook.include_router(ebooks_router)
plusbook.include_router(posts_router)
plusbook.include_router(messages_router)
plusbook.include_router(groups_router)
plusbook.include_router(contact_router)
plusbook.include_router(diag_router)

@plusbook.get("/health")
async def plusbook_health(db: AsyncIOMotorDatabase = Depends(get_db)):
    ok = False
    try:
        await db.command("ping")
        ok = True
    except Exception:
        ok = False
    return {"status": "ok" if ok else "down", "db": settings.DB_NAME, "mongo": ok}

app.include_router(plusbook)

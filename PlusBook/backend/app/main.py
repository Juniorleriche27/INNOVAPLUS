from __future__ import annotations

from fastapi import FastAPI, Depends
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.mongo import close_mongo_connection, connect_to_mongo
from app.routers.auth import router as auth_router
from app.routers.ebooks import router as ebooks_router
from app.routers.posts import router as posts_router
from app.routers.messages import router as messages_router
from app.routers.groups import router as groups_router
from app.routers.contact import router as contact_router
from app.routers.diagnostics import router as diag_router
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongo import get_db


app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await connect_to_mongo()


@app.on_event("shutdown")
async def on_shutdown():
    await close_mongo_connection()


@app.get("/health")
async def health(db: AsyncIOMotorDatabase = Depends(get_db)):
    ok = False
    try:
        await db.command("ping")
        ok = True
    except Exception:
        ok = False
    return {"status": "ok" if ok else "down", "db": settings.DB_NAME, "mongo": ok}


app.include_router(auth_router)
app.include_router(ebooks_router)
app.include_router(posts_router)
app.include_router(messages_router)
app.include_router(groups_router)
app.include_router(contact_router)
app.include_router(diag_router)

# Serve public storage similar to Laravel's /storage symlink
app.mount("/storage", StaticFiles(directory="storage/public"), name="storage")

# Mount the same API under /plusbook prefix for unified gateway
plusbook = APIRouter(prefix="/plusbook")
plusbook.include_router(auth_router)
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

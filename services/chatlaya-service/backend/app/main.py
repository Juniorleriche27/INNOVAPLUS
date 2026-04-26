from __future__ import annotations

import logging

from fastapi import FastAPI

from app.core.config import settings
from app.routers.chatlaya import router as chatlaya_router
from app.routers.health import router as health_router
from app.services.postgres_bootstrap import close_pool, db_configured, init_pool


logger = logging.getLogger(__name__)


app = FastAPI(
    title="ChatLAYA Service",
    version="0.1.0",
    description="Non-active backend skeleton for future ChatLAYA service extraction.",
)

app.include_router(health_router)
app.include_router(chatlaya_router)


@app.on_event("startup")
async def on_startup() -> None:
    if not db_configured():
        logger.info("chatlaya-service startup without DATABASE_URL; DB pool not initialized")
        return
    await init_pool()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await close_pool()


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "service": settings.SERVICE_NAME,
        "status": "ok",
    }

from __future__ import annotations

from fastapi import FastAPI

from app.core.config import settings
from app.routers.chatlaya import router as chatlaya_router
from app.routers.health import router as health_router


app = FastAPI(
    title="ChatLAYA Service",
    version="0.1.0",
    description="Non-active backend skeleton for future ChatLAYA service extraction.",
)

app.include_router(health_router)
app.include_router(chatlaya_router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "service": settings.SERVICE_NAME,
        "status": "ok",
    }

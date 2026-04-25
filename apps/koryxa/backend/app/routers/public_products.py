from __future__ import annotations

from fastapi import APIRouter

from app.core.config import settings
from app.db.mongo import get_db_instance
from app.schemas.public_products import PublicProductListResponse
from app.services.product_registry import list_public_products


router = APIRouter(prefix="/products", tags=["public-products"])


@router.get("/public", response_model=PublicProductListResponse)
async def get_public_products():
    return {"items": await list_public_products(None if not settings.REQUIRE_MONGO else get_db_instance())}

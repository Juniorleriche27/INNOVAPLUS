from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.schemas.public_products import PublicProductListResponse
from app.services.product_registry import list_public_products


router = APIRouter(prefix="/products", tags=["public-products"])


@router.get("/public", response_model=PublicProductListResponse)
async def get_public_products(
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    return {"items": await list_public_products(db)}

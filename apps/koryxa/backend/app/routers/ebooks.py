from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user
from app.schemas.common import Paginated
from app.schemas.ebooks import EbookCreate, EbookOut
from app.utils.ids import serialize_id, to_object_id


router = APIRouter(prefix="/api/ebooks", tags=["ebooks"])

STORAGE_ROOT = Path(__file__).resolve().parents[2] / "storage" / "public" / "ebooks"
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def _file_url_or_none(file_path: Optional[str]) -> Optional[str]:
    if not file_path:
        return None
    # Public URL path mounted at /storage
    return f"/storage/{file_path}"


@router.get("/", response_model=Paginated)
async def list_ebooks(page: int = 1, db: AsyncIOMotorDatabase = Depends(get_db)):
    per_page = 12
    skip = max(0, page - 1) * per_page
    cursor = db["ebooks"].find({}).sort("_id", -1).skip(skip).limit(per_page)
    items = []
    async for doc in cursor:
        item = serialize_id(doc)
        item["file_url"] = _file_url_or_none(doc.get("file_path"))
        items.append(item)
    total = await db["ebooks"].count_documents({})
    last_page = max(1, (total + per_page - 1) // per_page)
    return {"data": items, "current_page": page, "last_page": last_page, "total": total}


@router.get("/{ebook_id}", response_model=EbookOut)
async def get_ebook(ebook_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db["ebooks"].find_one({"_id": to_object_id(ebook_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    item = serialize_id(doc)
    item["file_url"] = _file_url_or_none(doc.get("file_path"))
    return item


@router.post("/", response_model=EbookOut, status_code=status.HTTP_201_CREATED)
async def create_ebook(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(0),
    file: UploadFile | None = File(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    file_path: Optional[str] = None
    if file is not None:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=422, detail="Seuls les PDF sont autorisés")
        filename = f"{current['_id']}_{abs(hash(file.filename))}_{file.filename}"
        target = STORAGE_ROOT / filename
        content = await file.read()
        target.write_bytes(content)
        file_path = f"ebooks/{filename}"

    doc = {
        "user_id": str(current["_id"]),
        "title": title,
        "description": description,
        "price": float(price or 0),
        "file_path": file_path,
    }
    res = await db["ebooks"].insert_one(doc)
    doc["_id"] = res.inserted_id
    out = serialize_id(doc)
    out["file_url"] = _file_url_or_none(file_path)
    return out


@router.put("/{ebook_id}", response_model=EbookOut)
async def update_ebook(
    ebook_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    file: UploadFile | None = File(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    oid = to_object_id(ebook_id)
    doc = await db["ebooks"].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    updates: dict = {}
    if title is not None:
        updates["title"] = title
    if description is not None:
        updates["description"] = description
    if price is not None:
        updates["price"] = float(price)
    if file is not None:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=422, detail="Seuls les PDF sont autorisés")
        filename = f"{current['_id']}_{abs(hash(file.filename))}_{file.filename}"
        target = STORAGE_ROOT / filename
        target.write_bytes(await file.read())
        updates["file_path"] = f"ebooks/{filename}"

    if updates:
        await db["ebooks"].update_one({"_id": oid}, {"$set": updates})
        doc.update(updates)
    out = serialize_id(doc)
    out["file_url"] = _file_url_or_none(doc.get("file_path"))
    return out


@router.delete("/{ebook_id}", status_code=status.HTTP_200_OK)
async def delete_ebook(ebook_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current: dict = Depends(get_current_user)):
    oid = to_object_id(ebook_id)
    doc = await db["ebooks"].find_one({"_id": oid})
    if doc and doc.get("file_path"):
        path = Path(__file__).resolve().parents[2] / "storage" / "public" / doc["file_path"]
        if path.is_file():
            try:
                path.unlink()
            except Exception:
                pass
    await db["ebooks"].delete_one({"_id": oid})
    return {"message": "Supprimé"}


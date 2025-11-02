from __future__ import annotations

from bson import ObjectId


def to_object_id(value: str | None) -> ObjectId:
    if not value:
        raise ValueError("Missing id")
    try:
        return ObjectId(value)
    except Exception as e:
        raise ValueError("Invalid id") from e


def serialize_id(doc: dict) -> dict:
    if doc is None:
        return doc
    d = {**doc}
    if "_id" in d:
        d["id"] = str(d.pop("_id"))
    return d


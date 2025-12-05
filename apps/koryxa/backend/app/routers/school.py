from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongo import get_db
from app.deps.auth import get_current_user

router = APIRouter(prefix="/school", tags=["school"])

# Collections
COLL_CERTIFICATES = "certificate_programs"
COLL_MODULES = "certificate_modules"
COLL_LESSONS = "certificate_lessons"
COLL_RESOURCES = "lesson_resources"
COLL_ENROLLMENTS = "certificate_enrollments"
COLL_PROGRESS = "lesson_progress"
COLL_EVIDENCE = "certificate_evidence"
COLL_ISSUED = "issued_certificates"
COLL_SKILL_TAGS = "certificate_skill_tags"
COLL_CERT_SKILLS = "certificate_skill_links"
COLL_USER_SKILLS = "user_certificate_skills"


# Helpers

def _oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=404, detail="Certificat introuvable")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _get_current_user_id(user: dict = Depends(get_current_user)) -> str:  # type: ignore[valid-type]
    return str(user.get("_id"))


async def _maybe_user_id(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> Optional[str]:
    try:
        user = await get_current_user(request=request, db=db)  # type: ignore[arg-type]
        return str(user.get("_id"))
    except HTTPException:
        return None


def _serialize(doc: dict | None) -> dict | None:
    if not doc:
        return None
    doc = doc.copy()
    doc["_id"] = str(doc["_id"])
    return doc


async def _enrollment_for(db: AsyncIOMotorDatabase, user_id: str, certificate_id: str) -> Optional[dict]:
    return await db[COLL_ENROLLMENTS].find_one({"user_id": user_id, "certificate_id": certificate_id})


async def _recompute_progress(db: AsyncIOMotorDatabase, enrollment: dict) -> float:
    certificate_id = enrollment["certificate_id"]
    enrollment_id = str(enrollment["_id"])

    total_lessons = await db[COLL_LESSONS].count_documents({"certificate_id": certificate_id})
    if total_lessons == 0:
        percent = 0.0
    else:
        completed = await db[COLL_PROGRESS].count_documents({"enrollment_id": enrollment_id, "status": "completed"})
        percent = round(100.0 * completed / total_lessons, 2)

    await db[COLL_ENROLLMENTS].update_one({"_id": enrollment["_id"]}, {"$set": {"progress_percent": percent}})
    return percent


async def _try_issue_certificate(db: AsyncIOMotorDatabase, certificate_id: str, user_id: str) -> Optional[dict]:
    # Already issued?
    issued = await db[COLL_ISSUED].find_one({"certificate_id": certificate_id, "user_id": user_id, "status": "valid"})
    if issued:
        return issued

    enrollment = await db[COLL_ENROLLMENTS].find_one({"certificate_id": certificate_id, "user_id": user_id})
    if not enrollment:
        return None

    # Need 100% progression
    if float(enrollment.get("progress_percent", 0)) < 100.0:
        return None

    certificate = await db[COLL_CERTIFICATES].find_one({"_id": ObjectId(certificate_id)})
    if not certificate:
        return None

    required_types: List[str] = certificate.get("required_evidence_types", []) or []
    if required_types:
        # All required evidence types must be validated
        for ev_type in required_types:
            found = await db[COLL_EVIDENCE].find_one({
                "certificate_id": certificate_id,
                "user_id": user_id,
                "type": ev_type,
                "status": "validated",
            })
            if not found:
                return None

    verification_code = secrets.token_urlsafe(12)
    payload = {
        "user_id": user_id,
        "certificate_id": certificate_id,
        "issued_at": _now_iso(),
        "verification_code": verification_code,
        "status": "valid",
    }
    await db[COLL_ISSUED].insert_one(payload)

    # Propagate skills to user skill mapping
    skill_slugs = await db[COLL_CERT_SKILLS].find({"certificate_id": certificate_id}).to_list(length=50)
    for skill in skill_slugs:
        await db[COLL_USER_SKILLS].update_one(
            {"user_id": user_id, "skill_slug": skill.get("skill_slug")},
            {"$set": {"user_id": user_id, "skill_slug": skill.get("skill_slug"), "certificate_id": certificate_id, "updated_at": _now_iso()}},
            upsert=True,
        )

    return payload


@router.get("/certificates")
async def list_certificates(
    category: Optional[str] = Query(None),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: Optional[str] = Depends(_maybe_user_id),
):
    query: Dict[str, Any] = {"status": {"$ne": "archived"}}
    if category:
        query["category"] = category

    certs = await db[COLL_CERTIFICATES].find(query).sort("order_index", 1).to_list(length=200)
    certs_serialized = [_serialize(c) for c in certs]

    enroll_map: Dict[str, dict] = {}
    issued_map: Dict[str, dict] = {}
    if user_id:
        enrollments = await db[COLL_ENROLLMENTS].find({"user_id": user_id}).to_list(length=200)
        enroll_map = {e["certificate_id"]: e for e in enrollments}
        issued_docs = await db[COLL_ISSUED].find({"user_id": user_id}).to_list(length=200)
        issued_map = {i["certificate_id"]: i for i in issued_docs}

    for cert in certs_serialized:
        if cert is None:
            continue
        cid = cert.get("_id")
        enr = enroll_map.get(cid)
        issued = issued_map.get(cid)
        progress = float(enr.get("progress_percent", 0) if enr else 0)
        status = "not_started"
        if issued:
            status = "completed"
            progress = 100.0
        elif enr:
            status = "completed" if progress >= 100 else "in_progress"

        cert["enrollment_status"] = enr.get("status") if enr else None
        cert["progress_percent"] = progress
        cert["issued"] = bool(issued)
        cert["user_progress_status"] = status
        cert["user_progress_percent"] = progress
        # short description fallback
        if not cert.get("short_description"):
            desc = cert.get("description") or ""
            cert["short_description"] = desc[:200]

    return [c for c in certs_serialized if c]


@router.get("/certificates/{slug}")
async def get_certificate(slug: str, db: AsyncIOMotorDatabase = Depends(get_db), user_id: Optional[str] = Depends(_maybe_user_id)):
    cert = await db[COLL_CERTIFICATES].find_one({"slug": slug})
    if not cert:
        # allow by id
        try:
            cert = await db[COLL_CERTIFICATES].find_one({"_id": ObjectId(slug)})
        except Exception:
            pass
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable")

    cert_id = str(cert["_id"])
    modules = await db[COLL_MODULES].find({"certificate_id": cert_id}).sort("order_index", 1).to_list(length=500)
    lessons = await db[COLL_LESSONS].find({"certificate_id": cert_id}).sort("order_index", 1).to_list(length=1000)
    resources = await db[COLL_RESOURCES].find({"certificate_id": cert_id}).to_list(length=2000)

    module_map: Dict[str, dict] = {}
    for mod in modules:
        module_map[str(mod["_id"])] = _serialize(mod) or {}
        module_map[str(mod["_id"])]["lessons"] = []

    lesson_map: Dict[str, dict] = {}
    for lesson in lessons:
        ldoc = _serialize(lesson) or {}
        lesson_map[str(lesson["_id"])] = ldoc
        module_map.get(lesson.get("module_id"), {}).get("lessons", []).append(ldoc)
        ldoc["resources"] = []

    for res in resources:
        rdoc = _serialize(res)
        if not rdoc:
            continue
        lid = res.get("lesson_id")
        lesson_obj = lesson_map.get(lid)
        if lesson_obj is not None:
            lesson_obj["resources"].append(rdoc)
    # Sort lessons inside modules
    for mod in modules:
        mod_key = str(mod["_id"])
        bucket = module_map.get(mod_key, {}).get("lessons", [])
        bucket.sort(key=lambda x: x.get("order_index", 0))

    enrollment = None
    issued = None
    if user_id:
        enrollment = await _enrollment_for(db, user_id, cert_id)
        issued = await db[COLL_ISSUED].find_one({"user_id": user_id, "certificate_id": cert_id})
        if enrollment:
            enrollment = _serialize(enrollment)

    skills = await db[COLL_CERT_SKILLS].find({"certificate_id": cert_id}).to_list(length=50)
    skill_slugs = [s.get("skill_slug") for s in skills if s.get("skill_slug")]

    ordered_modules = [module_map[str(m["_id"])] for m in modules if str(m["_id"]) in module_map]
    result = _serialize(cert) or {}
    if not result.get("short_description"):
        desc = result.get("description") or ""
        result["short_description"] = desc[:200]
    result.update({
        "modules": ordered_modules,
        "enrollment": enrollment,
        "issued": _serialize(issued) if issued else None,
        "skill_slugs": skill_slugs,
        "user_progress_status": "completed" if issued else ("in_progress" if enrollment else "not_started"),
        "user_progress_percent": 100.0 if issued else (enrollment.get("progress_percent", 0) if enrollment else 0),
    })
    return result


@router.post("/certificates/{certificate_id}/enroll")
async def enroll_certificate(
    certificate_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(_get_current_user_id),
):
    cert = await db[COLL_CERTIFICATES].find_one({"_id": _oid(certificate_id)})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable")

    existing = await _enrollment_for(db, user_id, certificate_id)
    if existing:
        return {"ok": True, "enrollment_id": str(existing["_id"])}

    payload = {
        "user_id": user_id,
        "certificate_id": certificate_id,
        "enrollment_date": _now_iso(),
        "status": "in_progress",
        "progress_percent": 0.0,
    }
    res = await db[COLL_ENROLLMENTS].insert_one(payload)
    return {"ok": True, "enrollment_id": str(res.inserted_id)}


@router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(_get_current_user_id),
):
    lesson = await db[COLL_LESSONS].find_one({"_id": _oid(lesson_id)})
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")

    certificate_id = lesson.get("certificate_id")
    enrollment = await _enrollment_for(db, user_id, certificate_id)
    if not enrollment:
        raise HTTPException(status_code=400, detail="Non inscrit à ce certificat")

    enrollment_id = str(enrollment["_id"])
    await db[COLL_PROGRESS].update_one(
        {"enrollment_id": enrollment_id, "lesson_id": lesson_id},
        {
            "$set": {
                "enrollment_id": enrollment_id,
                "lesson_id": lesson_id,
                "status": "completed",
                "last_viewed_at": _now_iso(),
            }
        },
        upsert=True,
    )

    percent = await _recompute_progress(db, enrollment)
    issued = await _try_issue_certificate(db, certificate_id, user_id)
    return {"ok": True, "progress_percent": percent, "issued": _serialize(issued) if issued else None}


@router.post("/certificates/{certificate_id}/evidence")
async def submit_evidence(
    certificate_id: str,
    payload: Dict[str, Any],
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(_get_current_user_id),
):
    cert = await db[COLL_CERTIFICATES].find_one({"_id": _oid(certificate_id)})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificat introuvable")

    ev_type = payload.get("type")
    if not ev_type:
        raise HTTPException(status_code=400, detail="Champ 'type' requis")

    doc = {
        "certificate_id": certificate_id,
        "user_id": user_id,
        "type": ev_type,
        "payload": payload.get("payload") or {},
        "status": "submitted",
        "created_at": _now_iso(),
    }
    res = await db[COLL_EVIDENCE].insert_one(doc)
    return {"ok": True, "evidence_id": str(res.inserted_id)}


@router.post("/certificates/{certificate_id}/evidence/{evidence_id}/review")
async def review_evidence(
    certificate_id: str,
    evidence_id: str,
    status: str = Query(..., pattern="^(validated|rejected)$"),
    comment: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user_id: str = Depends(_get_current_user_id),
):
    # Simple reviewer role: any authenticated user for now (can restrict later)
    ev = await db[COLL_EVIDENCE].find_one({"_id": _oid(evidence_id), "certificate_id": certificate_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Preuve introuvable")

    await db[COLL_EVIDENCE].update_one(
        {"_id": ev["_id"]},
        {"$set": {"status": status, "reviewer_id": user_id, "review_comment": comment}},
    )

    # Try issuing if validated completes requirements
    if status == "validated":
        await _try_issue_certificate(db, certificate_id, ev.get("user_id"))

    return {"ok": True}


@router.get("/me/certificates")
async def my_certificates(db: AsyncIOMotorDatabase = Depends(get_db), user_id: str = Depends(_get_current_user_id)):
    enrollments = await db[COLL_ENROLLMENTS].find({"user_id": user_id}).to_list(length=200)
    cert_ids = [e["certificate_id"] for e in enrollments]
    certs = await db[COLL_CERTIFICATES].find({"_id": {"$in": [ObjectId(cid) for cid in cert_ids]}}).to_list(length=200)
    issued = await db[COLL_ISSUED].find({"user_id": user_id}).to_list(length=200)
    issued_map = {i["certificate_id"]: i for i in issued}

    result = []
    for e in enrollments:
        cid = e["certificate_id"]
        cert = next((c for c in certs if str(c["_id"]) == cid), None)
        if not cert:
            continue
        result.append({
            "certificate": _serialize(cert),
            "enrollment": _serialize(e),
            "issued": _serialize(issued_map.get(cid)) if issued_map.get(cid) else None,
        })
    return result


@router.get("/me/skills")
async def my_skills(db: AsyncIOMotorDatabase = Depends(get_db), user_id: str = Depends(_get_current_user_id)):
    skills = await db[COLL_USER_SKILLS].find({"user_id": user_id}).to_list(length=200)
    return [{"skill_slug": s.get("skill_slug"), "certificate_id": s.get("certificate_id") } for s in skills]

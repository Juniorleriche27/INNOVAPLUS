from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.db.mongo import get_db


router = APIRouter(tags=["innova-opportunities"])  # will be mounted under /innova/api


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def oid(val: str) -> ObjectId:
    try:
        return ObjectId(val)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid id")


@router.post("/profiles/upsert")
async def profiles_upsert(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = (payload.get("user_id") or "").strip()
    if not user_id:
        raise HTTPException(status_code=422, detail="user_id required")
    country = (payload.get("country") or "unknown").strip().upper()
    skills = payload.get("skills") or []
    norm_skills = sorted({str(s).strip().lower() for s in skills if str(s).strip()})
    updates: Dict[str, Any] = {
        "user_id": user_id,
        "country": country,
        "skills": norm_skills,
        "last_active_at": iso_now(),
    }
    if "reputation" in payload:
        try:
            updates["reputation"] = float(payload.get("reputation"))
        except Exception:
            updates["reputation"] = 0.5
    await db["profiles"].update_one({"user_id": user_id}, {"$set": updates}, upsert=True)
    doc = await db["profiles"].find_one({"user_id": user_id})
    return {"ok": True, "profile": {"id": str(doc.get("_id")), "user_id": user_id}}


@router.post("/opportunities/create")
async def create_opportunity(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    title = (payload.get("title") or "").strip()
    problem = (payload.get("problem") or "").strip()
    if not title or not problem:
        raise HTTPException(status_code=422, detail="title and problem are required")
    skills_required = payload.get("skills_required") or []
    tags = payload.get("tags") or []
    country = payload.get("country")
    mission_id = payload.get("mission_id")
    source = payload.get("source") or "manual"
    product_slug = payload.get("product_slug")
    doc = {
        "title": title,
        "problem": problem,
        "skills_required": skills_required,
        "tags": tags,
        "country": country,
        "status": "open",
        "created_at": iso_now(),
        "mission_id": mission_id,
        "source": source,
        "product_slug": product_slug,
    }
    res = await db["opportunities"].insert_one(doc)
    return {"opportunity_id": str(res.inserted_id)}


def _serialize_opp(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc.get("_id")),
        "title": doc.get("title"),
        "problem": doc.get("problem"),
        "status": doc.get("status") or "open",
        "country": doc.get("country"),
        "skills_required": doc.get("skills_required") or [],
        "tags": doc.get("tags") or [],
        "created_at": doc.get("created_at"),
        "mission_id": doc.get("mission_id"),
        "source": doc.get("source"),
        "product_slug": doc.get("product_slug"),
    }


@router.get("/opportunities")
async def list_opportunities(
    search: Optional[str] = None,
    status: Optional[str] = None,
    country: Optional[str] = None,
    source: Optional[str] = None,
    product: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query: Dict[str, Any] = {}
    if status:
        query["status"] = status
    if country:
        query["country"] = country.upper()
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    if source:
        query["source"] = source
    if product:
        query["product_slug"] = product
    skip = max(0, (page - 1) * limit)
    cursor = db["opportunities"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    items: List[Dict[str, Any]] = []
    async for doc in cursor:
        items.append(_serialize_opp(doc))
    total = await db["opportunities"].count_documents(query)
    return {"items": items, "total": total, "page": page, "has_more": page * limit < total}


async def _load_profiles(db: AsyncIOMotorDatabase, country: Optional[str]) -> List[Dict[str, Any]]:
    q: Dict[str, Any] = {}
    if country:
        q["country"] = country
    cursor = db["profiles"].find(q)
    out: List[Dict[str, Any]] = []
    async for p in cursor:
        out.append(p)
    return out


def _jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(x.strip().lower() for x in (a or [])), set(x.strip().lower() for x in (b or []))
    if not sa and not sb:
        return 0.0
    inter = len(sa & sb)
    union = len(sa | sb) or 1
    return inter / union


def _to01(x: float, lo: float, hi: float) -> float:
    if hi <= lo:
        return 0.0
    return max(0.0, min(1.0, (x - lo) / (hi - lo)))


async def _workload_score(db: AsyncIOMotorDatabase, user_id: str) -> float:
    # higher workload -> higher penalty; return value in [0,1]
    active = await db["assignments"].count_documents({"user_id": user_id, "status": {"$in": ["pending", "accepted"]}})
    return _to01(active, 0.0, 5.0)


@router.post("/match/run")
async def match_run(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    opp_id = payload.get("opportunity_id")
    if not opp_id:
        raise HTTPException(status_code=422, detail="opportunity_id required")
    opp = await db["opportunities"].find_one({"_id": oid(opp_id)})
    if not opp:
        raise HTTPException(status_code=404, detail="opportunity not found")

    profiles = await _load_profiles(db, opp.get("country"))
    if not profiles:
        return {"shortlist": []}

    # compute recency bounds for normalization
    recencies: List[float] = []
    now = datetime.now(timezone.utc)
    for p in profiles:
        try:
            dt = datetime.fromisoformat((p.get("last_active_at") or iso_now()).replace("Z", "+00:00"))
        except Exception:
            dt = now - timedelta(days=30)
        recencies.append((now - dt).total_seconds())
    rmax = max(recencies) if recencies else 1.0
    rmin = min(recencies) if recencies else 0.0

    alpha = settings.MATCH_ALPHA
    beta = settings.MATCH_BETA
    gamma = settings.MATCH_GAMMA
    delta = settings.MATCH_DELTA

    results: List[Dict[str, Any]] = []
    for idx, p in enumerate(profiles):
        user_id = str(p.get("user_id") or p.get("_id"))
        skill_match = _jaccard(opp.get("skills_required") or [], p.get("skills") or [])
        reputation = float(p.get("reputation") or 0.5)
        # recency: smaller seconds -> more recent -> score close to 1
        sec = recencies[idx] if idx < len(recencies) else rmax
        recency = 1.0 - _to01(sec, rmin, rmax)
        workload_pen = await _workload_score(db, user_id)

        match_score = alpha * skill_match + beta * reputation + gamma * recency - delta * workload_pen
        results.append({
            "user_id": user_id,
            "scores": {
                "match": round(match_score, 6),
                "skill": round(skill_match, 6),
                "reputation": round(reputation, 6),
                "recency": round(recency, 6),
                "workload_pen": round(workload_pen, 6),
            },
        })

    results.sort(key=lambda x: x["scores"]["match"], reverse=True)
    top_k = int(payload.get("top_k") or settings.MATCH_TOP_K)
    return {"shortlist": results[: top_k]}


@router.post("/assign")
async def assign(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    opp_id = payload.get("opportunity_id")
    user_ids = payload.get("user_ids") or []
    if not opp_id or not user_ids:
        raise HTTPException(status_code=422, detail="opportunity_id and user_ids[] required")
    opp = await db["opportunities"].find_one({"_id": oid(opp_id)})
    if not opp:
        raise HTTPException(status_code=404, detail="opportunity not found")

    created = 0
    docs: List[Dict[str, Any]] = []
    for uid in user_ids:
        docs.append({
            "opportunity_id": str(opp["_id"]),
            "user_id": str(uid),
            "status": "pending",
            "scores": payload.get("scores_map", {}).get(uid, {}),
            "created_at": iso_now(),
        })
    if docs:
        res = await db["assignments"].insert_many(docs)
        created = len(res.inserted_ids)

        # audit decisions with fairness context
        targets = await _compute_targets(db)
        audits: List[Dict[str, Any]] = []
        for d in docs:
            uid = d.get("user_id")
            prof = await db["profiles"].find_one({"user_id": uid})
            country = (prof or {}).get("country") or "unknown"
            need_idx = targets.get("need_index", {}).get(country)
            quota_target = targets.get("targets", {}).get(country)
            # used in window
            used = await _used_for_country(db, country)
            audits.append({
                "opportunity_id": d.get("opportunity_id"),
                "user_id": uid,
                "country": country,
                "scores": d.get("scores") or {},
                "need_index": need_idx,
                "quota_target": quota_target,
                "quota_used": used,
                "created_at": iso_now(),
            })
        if audits:
            await db["decisions_audit"].insert_many(audits)
    return {"assignments_created": created}


@router.post("/assignment/decision")
async def assignment_decision(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db)):
    a_id = payload.get("assignment_id")
    decision = (payload.get("decision") or "").strip().lower()
    if decision not in {"accepted", "declined", "completed"}:
        raise HTTPException(status_code=422, detail="decision must be accepted|declined|completed")
    a = await db["assignments"].find_one({"_id": oid(a_id)})
    if not a:
        raise HTTPException(status_code=404, detail="assignment not found")
    await db["assignments"].update_one({"_id": a["_id"]}, {"$set": {"status": decision}})

    # Update reputation/workload heuristics
    uid = a.get("user_id")
    if uid:
        p = await db["profiles"].find_one({"user_id": uid})
        rep = float((p or {}).get("reputation") or 0.5)
        if decision == "accepted":
            rep = min(1.0, rep + 0.02)
        elif decision == "declined":
            rep = max(0.0, rep - 0.02)
        elif decision == "completed":
            rep = min(1.0, rep + 0.05)
        await db["profiles"].update_one({"user_id": uid}, {"$set": {"reputation": rep, "last_active_at": iso_now()}}, upsert=True)

    return {"ok": True}


@router.get("/recommendations")
async def recommendations(user_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    # Simple: list open opportunities, score quick by skill overlap vs profile
    profile = await db["profiles"].find_one({"user_id": user_id})
    if not profile:
        return []
    skills = profile.get("skills") or []
    items: List[Dict[str, Any]] = []
    async for opp in db["opportunities"].find({"status": "open"}).sort("created_at", -1):
        sm = _jaccard(skills, opp.get("skills_required") or [])
        items.append({"opportunity_id": str(opp["_id"]), "title": opp.get("title"), "score": round(sm, 6)})
    items.sort(key=lambda x: x["score"], reverse=True)
    return items[: settings.MATCH_TOP_K]


@router.get("/fairness/stats")
async def fairness_stats(period: Optional[str] = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    # period format: YYYY-MM-DD (start), window length from env
    if period:
        try:
            start = datetime.fromisoformat(period).replace(tzinfo=timezone.utc)
        except Exception:
            raise HTTPException(status_code=400, detail="invalid period")
    else:
        # default: current window
        start = datetime.now(timezone.utc) - timedelta(days=settings.FAIRNESS_WINDOW_DAYS)
    end = start + timedelta(days=settings.FAIRNESS_WINDOW_DAYS)

    # used quotas by country (assignments in window)
    pipeline = [
        {"$match": {"created_at": {"$gte": start.isoformat(), "$lte": end.isoformat()}}},
        {"$lookup": {"from": "profiles", "localField": "user_id", "foreignField": "user_id", "as": "u"}},
        {"$unwind": {"path": "$u", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$u.country", "used": {"$sum": 1}}},
    ]
    used_map: Dict[str, int] = {}
    async for doc in db["assignments"].aggregate(pipeline):
        country = doc.get("_id") or "unknown"
        used_map[country] = int(doc.get("used") or 0)

    targets, need_index = await _compute_targets(db)
    out = {"period_start": start.isoformat(), "period_end": end.isoformat(), "quotas": [], "need_index": need_index}
    for c in sorted(targets.keys()):
        out["quotas"].append({"country": c, "target": targets.get(c, 0), "used": used_map.get(c, 0)})
    return out


async def _used_for_country(db: AsyncIOMotorDatabase, country: str) -> int:
    # count assignments in current window for profiles of this country
    start = datetime.now(timezone.utc) - timedelta(days=settings.FAIRNESS_WINDOW_DAYS)
    end = datetime.now(timezone.utc)
    pipeline = [
        {"$match": {"created_at": {"$gte": start.isoformat(), "$lte": end.isoformat()}}},
        {"$lookup": {"from": "profiles", "localField": "user_id", "foreignField": "user_id", "as": "u"}},
        {"$unwind": "$u"},
        {"$match": {"u.country": country}},
        {"$count": "cnt"},
    ]
    async for doc in db["assignments"].aggregate(pipeline):
        return int(doc.get("cnt") or 0)
    return 0


async def _compute_targets(db: AsyncIOMotorDatabase):
    # collect countries
    countries: List[str] = []
    async for p in db["profiles"].find({}, {"country": 1}):
        c = (p.get("country") or "unknown").upper()
        if c not in countries:
            countries.append(c)
    total_open = await db["opportunities"].count_documents({"status": "open"})
    total_slots = max(0, total_open * settings.MATCH_TOP_K)

    # NeedIndex from env
    import json
    need_index: Dict[str, float] = {}
    if settings.FAIRNESS_NEED_INDEX_JSON:
        try:
            parsed = json.loads(settings.FAIRNESS_NEED_INDEX_JSON)
            if isinstance(parsed, dict):
                need_index = {str(k).upper(): float(v) for k, v in parsed.items()}
        except Exception:
            need_index = {}

    # default equal weights, override with NeedIndex if present
    if not countries:
        return ({}, need_index)
    weights: Dict[str, float] = {}
    if need_index:
        for c in countries:
            weights[c] = max(0.0, float(need_index.get(c, 0.0)))
    else:
        for c in countries:
            weights[c] = 1.0

    # normalize weights
    s = sum(weights.values()) or 1.0
    for c in weights:
        weights[c] = weights[c] / s

    # apply caps min/max quota proportion
    min_p = max(0.0, min(1.0, settings.FAIRNESS_MIN_QUOTA))
    max_p = max(min_p, min(1.0, settings.FAIRNESS_MAX_QUOTA))
    for c in weights:
        weights[c] = max(min_p, min(max_p, weights[c]))
    # renormalize
    s2 = sum(weights.values()) or 1.0
    for c in weights:
        weights[c] = weights[c] / s2

    targets: Dict[str, int] = {c: int(round(total_slots * weights[c])) for c in countries}
    return (targets, need_index)


@router.get("/audit/last")
async def audit_last(limit: int = 100, db: AsyncIOMotorDatabase = Depends(get_db)):
    lim = max(1, min(1000, limit))
    items: List[Dict[str, Any]] = []
    cursor = db["decisions_audit"].find({}).sort("created_at", -1).limit(lim)
    async for doc in cursor:
        d = dict(doc)
        d["id"] = str(d.pop("_id"))
        items.append(d)
    return items


@router.post("/seed/e2e")
async def seed_e2e(db: AsyncIOMotorDatabase = Depends(get_db)):
    # create 4 profiles
    profiles = [
        {"user_id": "uTG1", "country": "TG", "skills": ["python", "nlp"], "reputation": 0.5, "last_active_at": iso_now()},
        {"user_id": "uTG2", "country": "TG", "skills": ["react", "ui"], "reputation": 0.6, "last_active_at": iso_now()},
        {"user_id": "uGH1", "country": "GH", "skills": ["python", "react"], "reputation": 0.55, "last_active_at": iso_now()},
        {"user_id": "uGH2", "country": "GH", "skills": ["data", "ml"], "reputation": 0.52, "last_active_at": iso_now()},
    ]
    for p in profiles:
        await db["profiles"].update_one({"user_id": p["user_id"]}, {"$set": p}, upsert=True)
    # create opportunity
    opp = {
        "title": "Analyser des retours RAG",
        "problem": "Extraire des compétences et proposer des solutions",
        "skills_required": ["python", "nlp"],
        "tags": ["rag"],
        "status": "open",
        "created_at": iso_now(),
    }
    res = await db["opportunities"].insert_one(opp)
    return {"profiles": [p["user_id"] for p in profiles], "opportunity_id": str(res.inserted_id)}

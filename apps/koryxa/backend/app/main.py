from __future__ import annotations

import json
import time
import threading
import re
import hmac
import csv
import io
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Literal
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response
from fastapi import APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from urllib.parse import urlparse
from urllib import error as urlerror
from urllib import request as urlrequest
import cohere
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.config import get_allowed_hosts, is_production_env, settings
from app.services.postgres_bootstrap import (
    _pg_relation_exists,
    close_pg_pool,
    db_fetchall,
    db_fetchone,
    ensure_chatlaya_tables,
    ensure_enterprise_leads_table,
    init_pg_pool,
)
from app.routers.auth import router as auth_router
from app.routers.chatlaya import router as chatlaya_router
from app.routers.notifications import router as notifications_router
from app.routers.emailer import router as email_router
from app.routers.invite import router as invite_router
from app.routers.youtube import router as youtube_router
from app.routers.billing import router as billing_router
from app.routers.trajectoire import router as trajectoire_router
from app.routers.public_enterprise import router as public_enterprise_router
from app.routers.public_products import router as public_products_router
from app.core.ai import detect_embed_dim
import os
import logging


API_PROXY_PREFIX = "/innova/api"
FORWARDED_PREFIX_HEADER = "x-forwarded-prefix"

app = FastAPI(
    title="KORYXA API",
    description=(
        "API principale de la plateforme KORYXA.\n\n"
        "## Modules disponibles\n\n"
        "- **ChatLAYA** — Interface conversationnelle d'aide et d'orientation.\n"
        "- **Blueprint** — Clarification de trajectoire et de profil utilisateur.\n"
        "- **Entreprise** — Structuration de besoins et gestion d'organisation.\n\n"
        "## Authentification\n\n"
        "Les endpoints proteges acceptent un cookie de session `innova_session` ou un header `Authorization: Bearer <token>`.\n"
        "Les endpoints proteges sont disponibles via cookie de session ou token Bearer."
    ),
    version="1.0.0",
    contact={"name": "KORYXA", "url": "https://koryxa.app"},
    root_path=API_PROXY_PREFIX,
    openapi_tags=[
        {"name": "auth", "description": "Authentification et gestion de session."},
        {"name": "chatlaya", "description": "ChatLAYA — Interface conversationnelle."},
        {"name": "innova", "description": "Gestion des opportunites et du matching."},
    ],
)
logger = logging.getLogger(__name__)
CO: Any = None
LEAD_RATE_LIMIT_WINDOW_S = int(os.environ.get("ENTERPRISE_LEADS_RATE_WINDOW_S", "60"))
LEAD_RATE_LIMIT_MAX = int(os.environ.get("ENTERPRISE_LEADS_RATE_MAX", "5"))
_LEAD_RATE_BUCKETS: dict[str, list[float]] = {}
_LEAD_RATE_LOCK = threading.Lock()
PRODUCTION_SECRET_SENTINELS = {
    "insecure-dev-secret-change-me",
    "dev-user-hash-secret-change-me",
    "CHANGE_ME_IN_PRODUCTION",
    "your_supabase_service_role_key",
}


def _normalize_prefix(value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    clean = f"/{raw.strip('/')}"
    return clean


class EnterpriseLeadIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    company: str = Field(..., min_length=2, max_length=160)
    role: str = Field(..., min_length=2, max_length=120)
    team_size: str = Field(..., min_length=1, max_length=64)
    need: str = Field(..., min_length=2, max_length=180)
    message: str = Field(..., min_length=0, max_length=4000)
    source_page: str = Field(default="/entreprise", max_length=255)
    source_ts: datetime | None = None
    website: str | None = Field(default=None, max_length=255)  # honeypot

    @field_validator("source_page")
    @classmethod
    def validate_source_page(cls, value: str) -> str:
        value = (value or "").strip()
        if not value.startswith("/"):
            return "/entreprise"
        return value


class EnterpriseLeadUpdateIn(BaseModel):
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None
    assigned_to: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=4000)
    contacted_at: datetime | None = None


def _json_safe(row: dict[str, Any]) -> dict[str, Any]:
    # Decimal is not JSON-serializable by default.
    for k, v in list(row.items()):
        if isinstance(v, Decimal):
            row[k] = float(v)
    return row

def _client_ip(request: Request) -> str:
    xff = (request.headers.get("x-forwarded-for") or "").strip()
    if xff:
        return xff.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _check_lead_rate_limit(client_ip: str) -> bool:
    now = time.monotonic()
    with _LEAD_RATE_LOCK:
        recent = [
            ts
            for ts in _LEAD_RATE_BUCKETS.get(client_ip, [])
            if (now - ts) < LEAD_RATE_LIMIT_WINDOW_S
        ]
        if len(recent) >= LEAD_RATE_LIMIT_MAX:
            _LEAD_RATE_BUCKETS[client_ip] = recent
            return False
        recent.append(now)
        _LEAD_RATE_BUCKETS[client_ip] = recent
    return True


def _read_env_file_value(var_name: str, path: str = "/etc/innovaplus/backend.env") -> str:
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                if key.strip() != var_name:
                    continue
                value = value.strip().strip('"').strip("'")
                return value
    except Exception:
        return ""
    return ""


def _derive_supabase_url_from_dsn(dsn: str) -> str:
    match = re.search(r"postgres\.([a-z0-9]+)", dsn or "")
    if not match:
        return ""
    return f"https://{match.group(1)}.supabase.co"


def _resolve_admin_token() -> str:
    token = (os.environ.get("ADMIN_TOKEN") or "").strip()
    if not token:
        token = _read_env_file_value("ADMIN_TOKEN").strip()
    return token


def _require_admin_token(request: Request) -> None:
    configured = _resolve_admin_token()
    if not configured:
        raise HTTPException(status_code=500, detail="Admin token not configured")
    provided = (request.headers.get("X-Admin-Token") or "").strip()
    if not provided or not hmac.compare_digest(provided, configured):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _resolve_webhook_secret() -> str:
    token = (os.environ.get("WEBHOOK_SECRET") or "").strip()
    if not token:
        token = _read_env_file_value("WEBHOOK_SECRET").strip()
    if token:
        return token

    token = (os.environ.get("ENTERPRISE_WEBHOOK_SECRET") or "").strip()
    if not token:
        token = _read_env_file_value("ENTERPRISE_WEBHOOK_SECRET").strip()
    return token


def _require_webhook_secret(request: Request) -> None:
    configured = _resolve_webhook_secret()
    if not configured:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    provided = (request.headers.get("X-Webhook-Secret") or "").strip()
    if not provided or not hmac.compare_digest(provided, configured):
        raise HTTPException(status_code=401, detail="Unauthorized")


def _extract_lead_id_from_webhook(payload: dict[str, Any]) -> Any:
    if isinstance(payload.get("record"), dict):
        return payload["record"].get("id")
    if isinstance(payload.get("new"), dict):
        return payload["new"].get("id")
    if isinstance(payload.get("data"), dict):
        return payload["data"].get("id")
    return payload.get("id")


def _validate_production_config() -> list[str]:
    issues: list[str] = []
    if not is_production_env():
        return issues

    required = {
        "JWT_SECRET": settings.JWT_SECRET,
        "USER_HASH_SECRET": settings.USER_HASH_SECRET,
        "ADMIN_TOKEN": (os.environ.get("ADMIN_TOKEN") or "").strip(),
        "WEBHOOK_SECRET": (os.environ.get("WEBHOOK_SECRET") or os.environ.get("ENTERPRISE_WEBHOOK_SECRET") or "").strip(),
        "BACKEND_BASE_URL": settings.BACKEND_BASE_URL,
        "FRONTEND_BASE_URL": settings.FRONTEND_BASE_URL,
    }
    for key, value in required.items():
        cleaned = (value or "").strip()
        if not cleaned:
            issues.append(f"{key} missing")
            continue
        if cleaned in PRODUCTION_SECRET_SENTINELS:
            issues.append(f"{key} uses placeholder value")

    if settings.DEV_AUTH_BYPASS:
        issues.append("DEV_AUTH_BYPASS must be false in production")
    if not get_allowed_hosts():
        issues.append("ALLOWED_HOSTS is empty or invalid")
    return issues


def _get_postgrest_base_and_key() -> tuple[str, str]:
    base_url = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")
    service_key = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not service_key:
        # Fallback for environments where the systemd env file contains
        # "KEY = value" formatting and systemd ignores the variable.
        service_key = _read_env_file_value("SUPABASE_SERVICE_ROLE_KEY").strip()

    if not base_url:
        base_url = _read_env_file_value("SUPABASE_URL").strip().rstrip("/")
    if not base_url:
        dsn = (os.environ.get("DATABASE_URL") or "").strip()
        if not dsn:
            dsn = _read_env_file_value("DATABASE_URL").strip()
        base_url = _derive_supabase_url_from_dsn(dsn).rstrip("/")

    if not base_url or not service_key:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    return base_url, service_key


def postgrest_insert_enterprise_lead(payload: dict[str, Any]) -> dict[str, Any]:
    base_url, service_key = _get_postgrest_base_and_key()

    endpoint = f"{base_url}/rest/v1/enterprise_leads"
    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    req = urlrequest.Request(endpoint, data=body, method="POST")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")

    try:
        with urlrequest.urlopen(req, timeout=float(os.environ.get("POSTGREST_TIMEOUT_S", "10"))) as response:
            raw = response.read().decode("utf-8", errors="replace")
            parsed: Any = json.loads(raw) if raw else {}
            if isinstance(parsed, list):
                return parsed[0] if parsed else {}
            if isinstance(parsed, dict):
                return parsed
            return {}
    except urlerror.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        logger.exception("PostgREST insert failed status=%s body=%s", exc.code, err_body[:1000])
        raise HTTPException(status_code=500, detail="Lead capture error")
    except Exception:
        logger.exception("PostgREST insert failed")
        raise HTTPException(status_code=500, detail="Lead capture error")


def postgrest_list_enterprise_leads(
    limit: int,
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None,
) -> list[dict[str, Any]]:
    base_url, service_key = _get_postgrest_base_and_key()

    select_cols = (
        "id,name,email,company,role,team_size,need,message,"
        "source_page,source_ts,created_at,updated_at,status,assigned_to,notes,contacted_at,"
        "client_ip,user_agent,metadata"
    )
    filters = [f"select={select_cols}", "order=created_at.desc", f"limit={int(limit)}"]
    if status:
        filters.append(f"status=eq.{status}")
    endpoint = f"{base_url}/rest/v1/enterprise_leads?{'&'.join(filters)}"

    req = urlrequest.Request(endpoint, method="GET")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")

    try:
        with urlrequest.urlopen(req, timeout=float(os.environ.get("POSTGREST_TIMEOUT_S", "10"))) as response:
            raw = response.read().decode("utf-8", errors="replace")
            parsed: Any = json.loads(raw) if raw else []
            if isinstance(parsed, list):
                return [p for p in parsed if isinstance(p, dict)]
            return []
    except urlerror.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        logger.exception("PostgREST list failed status=%s body=%s", exc.code, err_body[:1000])
        raise HTTPException(status_code=500, detail="Lead list error")
    except Exception:
        logger.exception("PostgREST list failed")
        raise HTTPException(status_code=500, detail="Lead list error")


def postgrest_patch_enterprise_lead(lead_id: int, updates: dict[str, Any]) -> dict[str, Any]:
    base_url, service_key = _get_postgrest_base_and_key()
    endpoint = f"{base_url}/rest/v1/enterprise_leads?id=eq.{int(lead_id)}"
    body = json.dumps(updates, ensure_ascii=False, default=str).encode("utf-8")

    req = urlrequest.Request(endpoint, data=body, method="PATCH")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")

    try:
        with urlrequest.urlopen(req, timeout=float(os.environ.get("POSTGREST_TIMEOUT_S", "10"))) as response:
            raw = response.read().decode("utf-8", errors="replace")
            parsed: Any = json.loads(raw) if raw else []
            if isinstance(parsed, list):
                return parsed[0] if parsed else {}
            if isinstance(parsed, dict):
                return parsed
            return {}
    except urlerror.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        logger.exception("PostgREST patch failed status=%s body=%s", exc.code, err_body[:1000])
        raise HTTPException(status_code=500, detail="Lead update error")
    except Exception:
        logger.exception("PostgREST patch failed")
        raise HTTPException(status_code=500, detail="Lead update error")


def init_cohere_client() -> None:
    global CO
    key = (os.environ.get("COHERE_API_KEY") or "").strip()
    if not key:
        logger.warning("COHERE_API_KEY is not set; AI report endpoints are disabled")
        CO = None
        return
    CO = cohere.Client(key)


def cohere_generate_report(prompt: str) -> str:
    global CO
    if not CO:
        raise HTTPException(status_code=500, detail="AI not configured")

    model = (
        os.environ.get("LLM_MODEL")
        or os.environ.get("COHERE_MODEL")
        or "command-r-plus-08-2024"
    )
    max_tokens = int(os.environ.get("AI_MAX_TOKENS", "500"))

    # Cohere Generate API is deprecated; use Chat API.
    resp = CO.chat(
        model=model,
        message=prompt,
        max_tokens=max_tokens,
        temperature=0.2,
    )
    text = getattr(resp, "text", "") or ""
    text = text.strip()
    if not text:
        raise HTTPException(status_code=500, detail="AI empty response")
    return text


def build_project_prompt(project: dict[str, Any]) -> str:
    payload = json.dumps(project, ensure_ascii=False, sort_keys=True, default=str)
    return f"""
Tu es un assistant de reporting pour un logiciel de gestion de projet.
RÃ¨gles STRICTES:
- Utilise uniquement les donnÃ©es JSON fournies. N'invente rien.
- Si une information manque, dis "non disponible".
- Rends un rapport court, clair, actionnable, en franÃ§ais.
- Inclure: (1) RÃ©sumÃ©, (2) Indicateurs clÃ©s, (3) Alertes (si applicable), (4) Prochaines actions (3 bullets max).

DonnÃ©es JSON:
{payload}
""".strip()


def build_portfolio_prompt(overview: dict[str, Any], top_risks: list[dict[str, Any]]) -> str:
    payload = json.dumps(
        {"overview": overview, "top_risks": top_risks},
        ensure_ascii=False,
        sort_keys=True,
        default=str,
    )
    return f"""
Tu es un assistant de reporting pour un SaaS de productivitÃ©.
RÃ¨gles STRICTES:
- Utilise uniquement les donnÃ©es JSON fournies. N'invente rien.
- Rends un rapport en franÃ§ais structurÃ©: (1) Vue d'ensemble, (2) Points d'attention, (3) Recommandations (5 bullets max).
- Ne cite pas de sources externes.

DonnÃ©es JSON:
{payload}
""".strip()

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

if (settings.ENV or "").lower() in {"development", "dev", "local"}:
    cors_origins.update({
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    })

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(cors_origins),
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    # Include PATCH/PUT/DELETE for task updates (MyPlanning) and other mutations
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    # Allow lab APIs that use custom headers (e.g. X-API-Key).
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Admin-Token"],
)

allowed_hosts = get_allowed_hosts()
if allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

@app.on_event("startup")
async def on_startup():
    production_config_issues = _validate_production_config()
    if production_config_issues:
        raise RuntimeError(
            "Invalid production configuration: " + "; ".join(production_config_issues)
        )
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
    
    init_pg_pool()
    try:
        ensure_chatlaya_tables()
    except Exception:
        logger.exception("Failed to ensure ChatLAYA postgres tables")
    try:
        ensure_enterprise_leads_table()
    except Exception:
        logger.exception("Failed to ensure enterprise_leads table")
    init_cohere_client()


@app.on_event("shutdown")
async def on_shutdown():
    close_pg_pool()


START_TIME = __import__("time").time()


@app.middleware("http")
async def normalize_forwarded_prefix(request: Request, call_next):
    # Accept both nginx style forwarded prefix and direct prefixed requests.
    header_prefix = _normalize_prefix(request.headers.get(FORWARDED_PREFIX_HEADER))
    prefix = header_prefix or API_PROXY_PREFIX
    scope = request.scope
    path = scope.get("path", "")

    new_scope = scope
    if path == prefix or path.startswith(f"{prefix}/"):
        stripped = path[len(prefix):] or "/"
        # Handle accidental doubled prefixes: /innova/api/innova/api/*
        while stripped == prefix or stripped.startswith(f"{prefix}/"):
            stripped = stripped[len(prefix):] or "/"

        new_scope = dict(scope)
        new_scope["path"] = stripped
        if scope.get("raw_path") is not None:
            new_scope["raw_path"] = stripped.encode("utf-8")
        new_scope["root_path"] = prefix
    elif header_prefix:
        new_scope = dict(scope)
        new_scope["root_path"] = header_prefix

    if new_scope is scope:
        return await call_next(request)
    return await call_next(Request(new_scope, receive=request.receive))


@app.get("/")
async def root():
    return {"status": "ok", "service": settings.APP_NAME, "docs": "/docs"}


@app.get("/health", include_in_schema=not is_production_env())
async def health():
    uptime = int(__import__("time").time() - START_TIME)
    config_issues = _validate_production_config()
    vector_index = True  # placeholder
    queue_depth = 0      # placeholder
    return {
        "status": "ok" if not config_issues else "down",
        "db": settings.DB_NAME,
        "vector_index": vector_index,
        "config_issues": config_issues,
        "queue_depth": queue_depth,
        "uptime_s": uptime,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "commit_sha": (os.getenv("COMMIT_SHA") or (__import__("subprocess").run(["git","-C", os.path.abspath(os.path.join(os.path.dirname(__file__), "..")), "rev-parse","--short","HEAD"], capture_output=True, text=True).stdout.strip() or "unknown")),
    }


@app.get("/mart/app-overview")
def mart_app_overview():
    try:
        if not _pg_relation_exists("mart.v_app_overview"):
            return {
                "n_projects": 0,
                "n_companies": 0,
                "avg_company_presence_rate": None,
                "is_demo_fallback": True,
            }
        row = db_fetchone("select * from mart.v_app_overview;")
        if row is None:
            raise HTTPException(status_code=404, detail="No data")
        return _json_safe(row)
    except HTTPException:
        raise
    except Exception:
        # Hide raw DB details in production responses.
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/mart/projects")
def mart_projects(
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort: Literal["project_id", "project_name", "start_date", "end_date", "progress", "priority"] = "project_id",
    order: Literal["asc", "desc"] = "asc",
    q: str | None = None,
):
    """
    List projects from mart.v_projects_list
    - pagination: limit/offset
    - basic search: q applies on project_id/project_name/company_name
    - safe sorting: whitelisted columns only
    """
    try:
        if not _pg_relation_exists("mart.v_projects_list"):
            return []
        # Keep API-compatible sort keys even if the underlying mart view currently
        # exposes fewer columns.
        sort_col = {
            "project_id": "project_id",
            "project_name": "project_name",
            "start_date": "project_id",
            "end_date": "project_id",
            "progress": "project_id",
            "priority": "project_id",
        }[sort]
        order_sql = "ASC" if order == "asc" else "DESC"

        where_sql = ""
        params: list[Any] = []
        if q:
            where_sql = """
            where project_id ilike %s
               or project_name ilike %s
               or company_name ilike %s
            """
            like = f"%{q}%"
            params.extend([like, like, like])

        sql = f"""
        select *
        from mart.v_projects_list
        {where_sql}
        order by {sort_col} {order_sql}
        limit %s offset %s;
        """
        params.extend([limit, offset])
        rows = db_fetchall(sql, tuple(params))
        return [_json_safe(r) for r in rows]
    except Exception:
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/mart/projects/{project_id}")
def mart_project_detail(project_id: str):
    """
    One project detail from mart.v_project_detail
    """
    try:
        if not _pg_relation_exists("mart.v_project_detail"):
            raise HTTPException(status_code=404, detail="mart dataset unavailable")
        row = db_fetchone(
            "select * from mart.v_project_detail where project_id = %s;",
            (project_id,),
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Not found")
        return _json_safe(row)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/mart/projects/{project_id}/presence")
def mart_project_presence(project_id: str):
    """
    Daily presence series (30 rows) from mart.v_project_presence_daily
    """
    try:
        if not _pg_relation_exists("mart.v_project_presence_daily"):
            raise HTTPException(status_code=404, detail="mart dataset unavailable")
        rows = db_fetchall(
            """
            select project_id, presence_date, is_present
            from mart.v_project_presence_daily
            where project_id = %s
            order by presence_date;
            """,
            (project_id,),
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Not found")
        return [_json_safe(r) for r in rows]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="DB error")


@app.get("/ai/report/project/{project_id}")
def ai_report_project(project_id: str):
    """
    Returns:
      - data: raw metrics from mart
      - alerts: simple rule-based alerts
      - report: Cohere generated narrative (grounded)
    """
    try:
        if not _pg_relation_exists("mart.v_project_detail"):
            raise HTTPException(status_code=404, detail="mart dataset unavailable")
        detail = db_fetchone(
            """
            select
              project_id, project_name,
              null::text as project_status,
              null::text as priority,
              null::double precision as progress,
              null::numeric as budget,
              null::numeric as actual_cost,
              company_id, company_name, sector, country,
              date_min as presence_date_min,
              date_max as presence_date_max,
              n_days, n_present_days, n_absent_days, presence_rate
            from mart.v_project_detail
            where project_id = %s;
            """,
            (project_id,),
        )
        if not detail:
            raise HTTPException(status_code=404, detail="Not found")

        d = _json_safe(detail)

        alerts: list[str] = []
        if d.get("presence_rate") is not None and float(d["presence_rate"]) < 0.4:
            alerts.append("PrÃ©sence faible (< 40%) sur la pÃ©riode observÃ©e.")
        if d.get("budget") is not None and d.get("actual_cost") is not None:
            try:
                if float(d["actual_cost"]) > float(d["budget"]):
                    alerts.append("CoÃ»t rÃ©el supÃ©rieur au budget.")
            except Exception:
                pass
        if d.get("progress") is not None:
            try:
                if float(d["progress"]) < 0.3:
                    alerts.append("Progression faible (< 30%).")
            except Exception:
                pass

        prompt = build_project_prompt({**d, "alerts": alerts})
        report = cohere_generate_report(prompt)
        return {"data": d, "alerts": alerts, "report": report}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="AI report error")


@app.get("/ai/report/portfolio")
def ai_report_portfolio():
    """
    Portfolio report using:
      - mart.v_app_overview
      - top risk projects based on low presence_rate
    """
    try:
        if not _pg_relation_exists("mart.v_app_overview") or not _pg_relation_exists("mart.v_project_detail"):
            raise HTTPException(status_code=404, detail="mart dataset unavailable")
        overview = db_fetchone("select * from mart.v_app_overview;")
        if not overview:
            raise HTTPException(status_code=404, detail="No data")
        o = _json_safe(overview)

        top_risks = db_fetchall(
            """
            select
              project_id,
              project_name,
              company_name,
              presence_rate,
              n_present_days,
              n_days,
              null::text as project_status,
              null::text as priority,
              null::double precision as progress
            from mart.v_project_detail
            order by presence_rate asc nulls last
            limit 10;
            """,
        )
        risks = [_json_safe(r) for r in top_risks]

        prompt = build_portfolio_prompt(o, risks)
        report = cohere_generate_report(prompt)
        return {"data": {"overview": o, "top_risks": risks}, "report": report}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="AI report error")


@app.post("/enterprise/leads")
def create_enterprise_lead(payload: EnterpriseLeadIn, request: Request):
    try:
        client_ip = _client_ip(request)
        if not _check_lead_rate_limit(client_ip):
            raise HTTPException(status_code=429, detail="Too many requests")

        # Honeypot: bots often fill hidden fields.
        if payload.website and payload.website.strip():
            raise HTTPException(status_code=400, detail="Spam detected")

        user_agent = (request.headers.get("user-agent") or "")[:512]
        referer = (request.headers.get("referer") or "")[:512]
        source_ts = payload.source_ts or datetime.now(timezone.utc)
        metadata = {
            "source_page": payload.source_page,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "referer": referer,
        }

        row = postgrest_insert_enterprise_lead(
            {
                "name": payload.name.strip(),
                "email": str(payload.email).strip(),
                "company": payload.company.strip(),
                "role": payload.role.strip(),
                "team_size": payload.team_size.strip(),
                "need": payload.need.strip(),
                "message": payload.message.strip(),
                "source_page": payload.source_page.strip(),
                "source_ts": source_ts.isoformat(),
                "status": "new",
                "client_ip": client_ip,
                "user_agent": user_agent,
                "metadata": metadata,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        lead_id = row.get("id") if isinstance(row, dict) else None
        return {"ok": True, "lead_id": lead_id}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead capture error")


@app.get("/enterprise/leads", include_in_schema=False)
def list_enterprise_leads(
    request: Request,
    limit: int = Query(50, ge=1, le=200),
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None,
):
    try:
        _require_admin_token(request)
        rows = postgrest_list_enterprise_leads(limit=limit, status=status)
        return rows
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead list error")


@app.get("/enterprise/leads/export.csv", include_in_schema=False)
def export_enterprise_leads_csv(
    request: Request,
    limit: int = Query(50, ge=1, le=2000),
    status: Literal["new", "contacted", "qualified", "lost", "won"] | None = None,
):
    try:
        _require_admin_token(request)
        rows = postgrest_list_enterprise_leads(limit=limit, status=status)
        output = io.StringIO()
        writer = csv.writer(output)
        header = [
            "id",
            "created_at",
            "name",
            "email",
            "company",
            "role",
            "team_size",
            "need",
            "status",
            "assigned_to",
            "contacted_at",
            "updated_at",
        ]
        writer.writerow(header)
        for row in rows:
            writer.writerow(
                [
                    row.get("id", ""),
                    row.get("created_at", ""),
                    row.get("name", ""),
                    row.get("email", ""),
                    row.get("company", ""),
                    row.get("role", ""),
                    row.get("team_size", ""),
                    row.get("need", ""),
                    row.get("status", ""),
                    row.get("assigned_to", ""),
                    row.get("contacted_at", ""),
                    row.get("updated_at", ""),
                ]
            )

        csv_content = output.getvalue()
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=enterprise_leads.csv"},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead export error")


@app.patch("/enterprise/leads/{lead_id}", include_in_schema=False)
def patch_enterprise_lead(lead_id: int, payload: EnterpriseLeadUpdateIn, request: Request):
    try:
        _require_admin_token(request)
        updates = payload.model_dump(exclude_none=True)
        if "assigned_to" in updates and isinstance(updates["assigned_to"], str):
            updates["assigned_to"] = updates["assigned_to"].strip() or None
        if "notes" in updates and isinstance(updates["notes"], str):
            updates["notes"] = updates["notes"].strip() or None
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")

        if updates.get("status") == "contacted" and "contacted_at" not in updates:
            updates["contacted_at"] = datetime.now(timezone.utc).isoformat()
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        row = postgrest_patch_enterprise_lead(lead_id=lead_id, updates=updates)
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        return {"ok": True, "lead": row}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Lead update error")


@app.post("/enterprise/leads/webhook", include_in_schema=False)
async def enterprise_leads_webhook(request: Request):
    try:
        _require_webhook_secret(request)
        try:
            payload = await request.json()
        except Exception:
            payload = {}
        if not isinstance(payload, dict):
            payload = {"raw": payload}

        lead_id = _extract_lead_id_from_webhook(payload)
        event = payload.get("type") or payload.get("event") or payload.get("op") or "unknown"
        table = payload.get("table") or payload.get("relation") or "enterprise_leads"
        logger.warning(
            "webhook received lead_id=%s event=%s table=%s",
            lead_id,
            event,
            table,
        )
        return {"ok": True, "lead_id": lead_id, "event": event, "table": table}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Webhook handling error")

# Mount API routes at root; /innova/api prefix is normalized by middleware.
innova_api = APIRouter(prefix="")
innova_api.include_router(auth_router)
innova_api.include_router(chatlaya_router)
innova_api.include_router(email_router)
innova_api.include_router(invite_router)
innova_api.include_router(youtube_router)
innova_api.include_router(billing_router)
innova_api.include_router(trajectoire_router)
innova_api.include_router(public_enterprise_router)
innova_api.include_router(public_products_router)
innova_api.include_router(notifications_router)
app.include_router(innova_api)

# Serve public storage similar to Laravel's /storage symlink
app.mount("/storage", StaticFiles(directory="storage/public"), name="storage")

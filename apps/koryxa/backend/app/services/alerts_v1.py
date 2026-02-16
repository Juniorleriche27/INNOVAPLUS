from __future__ import annotations

import asyncio
import json
import logging
import os
import re
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal
from zoneinfo import ZoneInfo

import psycopg2
from psycopg2.extras import RealDictCursor

from app.core.email import send_email_async


logger = logging.getLogger(__name__)

Channel = Literal["email", "whatsapp"]
RuleType = Literal["TASK_DUE_SOON", "TASK_OVERDUE", "TASK_STALE", "DAILY_DIGEST"]
Template = Literal["task_due_soon", "task_overdue", "task_stale", "daily_digest"]

E164_RE = re.compile(r"^\\+[1-9]\\d{7,14}$")


@dataclass(frozen=True)
class ProviderResult:
    ok: bool
    provider_message_id: str | None = None
    error: str | None = None


def _dsn() -> str:
    dsn = (os.environ.get("DATABASE_URL") or "").strip().strip('"').strip("'")
    if not dsn:
        raise RuntimeError("DATABASE_URL not configured")
    return dsn


def _frontend_base_url() -> str:
    return (os.environ.get("FRONTEND_BASE_URL") or "https://innovaplus.africa").rstrip("/")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _json(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True)


def _parse_hours(params: dict[str, Any], default: int = 24) -> int:
    raw = params.get("hours", default)
    try:
        value = int(raw)
    except Exception:
        value = default
    return max(1, min(value, 168))


def _parse_days(params: dict[str, Any], default: int = 7) -> int:
    raw = params.get("days", default)
    try:
        value = int(raw)
    except Exception:
        value = default
    return max(1, min(value, 365))


def _rule_template(rule_type: str) -> Template:
    if rule_type == "TASK_DUE_SOON":
        return "task_due_soon"
    if rule_type == "TASK_OVERDUE":
        return "task_overdue"
    if rule_type == "TASK_STALE":
        return "task_stale"
    return "daily_digest"


def _dedupe_day(dt_utc: datetime, tz_name: str) -> str:
    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        tz = ZoneInfo("UTC")
    return dt_utc.astimezone(tz).date().isoformat()


def _task_due_ts_sql() -> str:
    # Prefer due_datetime; fallback to due_date end-of-day.
    return "coalesce(t.due_datetime, (t.due_date::timestamptz + interval '23:59:59'))"


def _enqueue_alert_sent_integration_event(cur: RealDictCursor, notification_row: dict[str, Any], provider_message_id: str | None) -> None:
    workspace_id = str(notification_row.get("workspace_id") or "").strip()
    owner_id = str(notification_row.get("owner_id") or "").strip()
    if not workspace_id or not owner_id:
        return
    payload = {
        "notification_id": int(notification_row.get("id") or 0),
        "template": str(notification_row.get("template") or ""),
        "channel": str(notification_row.get("channel") or ""),
        "provider_message_id": provider_message_id,
        "sent_at": _utc_now().isoformat(),
    }
    try:
        cur.execute(
            """
            insert into app.integration_events(owner_id, workspace_id, type, payload_json, status, created_at)
            values (%s::uuid, %s::uuid, 'alert.sent', %s::jsonb, 'pending', now());
            """,
            (owner_id, workspace_id, _json(payload)),
        )
    except Exception:
        logger.warning("Could not enqueue alert.sent integration event", exc_info=True)


def _render_email(template: str, payload: dict[str, Any]) -> tuple[str, str, str]:
    base = _frontend_base_url()
    link = f"{base}/myplanning/app"

    if template in {"task_due_soon", "task_overdue", "task_stale"}:
        title = str(payload.get("title") or "Tâche")
        due_at = str(payload.get("due_at") or "non disponible")
        task_id = str(payload.get("task_id") or "")
        subject = {
            "task_due_soon": f"Tâche à échéance bientôt: {title}",
            "task_overdue": f"Tâche en retard: {title}",
            "task_stale": f"Tâche inactive: {title}",
        }.get(template, f"Notification: {title}")
        text = (
            f"{subject}\n\n"
            f"Titre: {title}\n"
            f"Échéance: {due_at}\n"
            f"ID: {task_id}\n\n"
            f"Ouvrir: {link}\n"
        )
        html = (
            f"<p><strong>{subject}</strong></p>"
            f"<p><strong>Titre:</strong> {title}</p>"
            f"<p><strong>Échéance:</strong> {due_at}</p>"
            f"<p><strong>ID:</strong> {task_id}</p>"
            f"<p><a href=\"{link}\">Ouvrir MyPlanningAI</a></p>"
        )
        return subject, text, html

    overview = payload.get("overview") or {}
    subject = "MyPlanningAI — Résumé quotidien"
    text = (
        f"{subject}\n\n"
        f"Todo: {overview.get('todo', 0)}\n"
        f"Doing: {overview.get('doing', 0)}\n"
        f"Done: {overview.get('done', 0)}\n\n"
        f"Ouvrir: {link}\n"
    )
    html = (
        f"<p><strong>{subject}</strong></p>"
        f"<ul>"
        f"<li><strong>Todo:</strong> {overview.get('todo', 0)}</li>"
        f"<li><strong>Doing:</strong> {overview.get('doing', 0)}</li>"
        f"<li><strong>Done:</strong> {overview.get('done', 0)}</li>"
        f"</ul>"
        f"<p><a href=\"{link}\">Ouvrir MyPlanningAI</a></p>"
    )
    return subject, text, html


def _render_whatsapp(template: str, payload: dict[str, Any]) -> str:
    base = _frontend_base_url()
    link = f"{base}/myplanning/app"

    if template in {"task_due_soon", "task_overdue", "task_stale"}:
        title = str(payload.get("title") or "Tâche")
        due_at = str(payload.get("due_at") or "non disponible")
        prefix = {
            "task_due_soon": "⏳ Échéance bientôt",
            "task_overdue": "⚠️ En retard",
            "task_stale": "🕒 Inactive",
        }.get(template, "Notification")
        return f"{prefix}: {title}\nÉchéance: {due_at}\n{link}"

    overview = payload.get("overview") or {}
    return (
        "📊 Résumé quotidien\n"
        f"Todo: {overview.get('todo', 0)}\n"
        f"Doing: {overview.get('doing', 0)}\n"
        f"Done: {overview.get('done', 0)}\n"
        f"{link}"
    )


async def send_email(recipient: str, template: str, payload: dict[str, Any]) -> ProviderResult:
    subject, text, html = _render_email(template, payload)
    # send_email_async logs-only when SMTP is not configured; still mark as sent for audit.
    await send_email_async(subject=subject, recipient=recipient, html_body=html, text_body=text)
    return ProviderResult(ok=True, provider_message_id=f"email:{int(time.time())}")


def send_whatsapp(to_e164: str, text: str) -> ProviderResult:
    if not E164_RE.match(to_e164 or ""):
        return ProviderResult(ok=False, error="invalid whatsapp_e164")

    provider = (os.environ.get("WHATSAPP_PROVIDER") or "").strip().lower() or "meta"
    api_url = (os.environ.get("WHATSAPP_API_URL") or "").strip()
    token = (os.environ.get("WHATSAPP_API_TOKEN") or "").strip()
    sender = (os.environ.get("WHATSAPP_FROM") or os.environ.get("WHATSAPP_SENDER") or "").strip()

    if not api_url or not token or not sender:
        return ProviderResult(ok=False, error="whatsapp provider not configured")

    import urllib.request

    body = {
        "provider": provider,
        "from": sender,
        "to": to_e164,
        "text": text,
    }
    req = urllib.request.Request(
        api_url,
        data=_json(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            _ = resp.read()
        return ProviderResult(ok=True, provider_message_id=f"wa:{int(time.time())}")
    except Exception as exc:
        return ProviderResult(ok=False, error=f"whatsapp send error: {exc.__class__.__name__}")


def generate_notifications_now(*, limit_rules: int | None = None) -> dict[str, Any]:
    dsn = _dsn()
    now = _utc_now()
    processed_rules = 0
    queued = 0

    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            cur.execute(
                """
                select
                  r.id::text as id,
                  r.owner_id::text as owner_id,
                  r.workspace_id::text as workspace_id,
                  r.rule_type,
                  r.channel,
                  r.params,
                  p.email_enabled,
                  p.whatsapp_enabled,
                  p.whatsapp_e164,
                  p.daily_digest_enabled,
                  p.digest_time_local,
                  p.timezone
                from app.alert_rules r
                left join app.notification_preferences p
                  on p.owner_id = r.owner_id
                where r.is_enabled = true
                order by r.created_at asc
                """
                + ("" if limit_rules is None else " limit %s"),
                (() if limit_rules is None else (int(limit_rules),)),
            )
            rules = [dict(r) for r in cur.fetchall()]

            for rule in rules:
                processed_rules += 1
                owner_id = str(rule.get("owner_id") or "")
                if not owner_id:
                    continue

                channel = str(rule.get("channel") or "").lower()
                rule_type = str(rule.get("rule_type") or "")
                params = rule.get("params") if isinstance(rule.get("params"), dict) else {}

                email_enabled = bool(rule.get("email_enabled") if rule.get("email_enabled") is not None else True)
                whatsapp_enabled = bool(rule.get("whatsapp_enabled") if rule.get("whatsapp_enabled") is not None else False)
                whatsapp_e164 = str(rule.get("whatsapp_e164") or "").strip() or None
                daily_digest_enabled = bool(rule.get("daily_digest_enabled") if rule.get("daily_digest_enabled") is not None else True)
                tz_name = str(rule.get("timezone") or "Africa/Lome")
                digest_time_local = str(rule.get("digest_time_local") or "07:00:00")

                if channel == "email" and not email_enabled:
                    continue
                if channel == "whatsapp" and (not whatsapp_enabled or not whatsapp_e164):
                    continue
                if rule_type == "DAILY_DIGEST" and not daily_digest_enabled:
                    continue

                template = _rule_template(rule_type)
                workspace_id = str(rule.get("workspace_id") or "").strip() or None

                if template == "daily_digest":
                    try:
                        tz = ZoneInfo(tz_name)
                    except Exception:
                        tz = ZoneInfo("UTC")
                    local_now = now.astimezone(tz)
                    parts = digest_time_local.split(":")
                    hh = int(parts[0]) if len(parts) > 0 else 7
                    mm = int(parts[1]) if len(parts) > 1 else 0
                    ss = int(parts[2]) if len(parts) > 2 else 0
                    local_sched = local_now.replace(hour=hh, minute=mm, second=ss, microsecond=0)
                    sched_utc = local_sched.astimezone(timezone.utc)
                    dedupe_key = f"{owner_id}:daily_digest:{local_now.date().isoformat()}"

                    cur.execute(
                        """
                        select
                          sum((coalesce(status,'todo')='todo')::int)::int as todo,
                          sum((coalesce(status,'todo')='doing')::int)::int as doing,
                          sum((coalesce(status,'todo')='done')::int)::int as done
                        from app.tasks
                        where owner_id = %s::uuid
                          and workspace_id is null;
                        """,
                        (owner_id,),
                    )
                    overview = dict(cur.fetchone() or {})
                    payload = {
                        "overview": {
                            "todo": int(overview.get("todo") or 0),
                            "doing": int(overview.get("doing") or 0),
                            "done": int(overview.get("done") or 0),
                        },
                        "window": {"day": local_now.date().isoformat()},
                    }
                    cur.execute(
                        """
                        with ins as (
                          insert into app.notifications(owner_id, workspace_id, channel, template, payload, status, dedupe_key, scheduled_at)
                          values (%s::uuid, %s::uuid, %s, %s, %s::jsonb, 'pending', %s, %s)
                          on conflict (dedupe_key) do nothing
                          returning id
                        )
                        insert into app.notification_events(notification_id, event, meta)
                        select ins.id, 'queued', '{}'::jsonb from ins;
                        """,
                        (owner_id, workspace_id, channel, template, _json(payload), dedupe_key, sched_utc),
                    )
                    if cur.rowcount:
                        queued += 1
                    cur.execute("update app.alert_rules set last_run_at = now() where id = %s::uuid", (rule["id"],))
                    continue

                # Task-based
                if workspace_id:
                    scope_sql = "t.workspace_id = %s::uuid"
                    scope_params: tuple[Any, ...] = (workspace_id,)
                else:
                    scope_sql = "t.owner_id = %s::uuid and t.workspace_id is null"
                    scope_params = (owner_id,)

                if template == "task_due_soon":
                    hours = _parse_hours(params, 24)
                    win_start = now
                    win_end = now + timedelta(hours=hours)
                    cur.execute(
                        f"""
                        select t.id::text as task_id, t.title, {_task_due_ts_sql()} as due_at
                        from app.tasks t
                        where {scope_sql}
                          and coalesce(t.status,'todo') <> 'done'
                          and {_task_due_ts_sql()} is not null
                          and {_task_due_ts_sql()} >= %s
                          and {_task_due_ts_sql()} <= %s
                        order by {_task_due_ts_sql()} asc
                        limit 50;
                        """,
                        scope_params + (win_start, win_end),
                    )
                elif template == "task_overdue":
                    cur.execute(
                        f"""
                        select t.id::text as task_id, t.title, {_task_due_ts_sql()} as due_at
                        from app.tasks t
                        where {scope_sql}
                          and coalesce(t.status,'todo') <> 'done'
                          and {_task_due_ts_sql()} is not null
                          and {_task_due_ts_sql()} < %s
                        order by {_task_due_ts_sql()} desc
                        limit 50;
                        """,
                        scope_params + (now,),
                    )
                else:
                    days = _parse_days(params, 7)
                    cutoff = now - timedelta(days=days)
                    cur.execute(
                        f"""
                        select t.id::text as task_id, t.title, {_task_due_ts_sql()} as due_at
                        from app.tasks t
                        where {scope_sql}
                          and coalesce(t.status,'todo') in ('todo','doing')
                          and t.updated_at < %s
                        order by t.updated_at asc
                        limit 50;
                        """,
                        scope_params + (cutoff,),
                    )

                tasks = [dict(r) for r in cur.fetchall()]
                for task in tasks:
                    day = _dedupe_day(now, tz_name)
                    dedupe_key = f"{owner_id}:{task.get('task_id')}:{template}:{day}"
                    due_at = task.get("due_at")
                    due_at_iso = due_at.isoformat() if hasattr(due_at, "isoformat") else str(due_at or "")
                    payload = {
                        "task_id": task.get("task_id"),
                        "title": task.get("title"),
                        "due_at": due_at_iso,
                    }
                    cur.execute(
                        """
                        with ins as (
                          insert into app.notifications(owner_id, workspace_id, channel, template, payload, status, dedupe_key, scheduled_at)
                          values (%s::uuid, %s::uuid, %s, %s, %s::jsonb, 'pending', %s, now())
                          on conflict (dedupe_key) do nothing
                          returning id
                        )
                        insert into app.notification_events(notification_id, event, meta)
                        select ins.id, 'queued', '{}'::jsonb from ins;
                        """,
                        (owner_id, workspace_id, channel, template, _json(payload), dedupe_key),
                    )
                    if cur.rowcount:
                        queued += 1

                cur.execute("update app.alert_rules set last_run_at = now() where id = %s::uuid", (rule["id"],))

        conn.commit()
        return {"processed_rules": processed_rules, "queued": queued}
    finally:
        try:
            conn.close()
        except Exception:
            pass


def worker_tick(*, batch: int = 50) -> dict[str, Any]:
    # Sync wrapper for the standalone worker process. The HTTP endpoint should
    # call `worker_tick_async` to avoid `asyncio.run()` inside a running loop.
    return asyncio.run(worker_tick_async(batch=batch))


async def worker_tick_async(*, batch: int = 50) -> dict[str, Any]:
    dsn = _dsn()
    sent = failed = skipped = 0

    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    rows: list[dict[str, Any]] = []
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("set local statement_timeout = %s;", (int(os.environ.get("PG_STATEMENT_TIMEOUT_MS", "5000")),))
            cur.execute(
                """
                select n.*
                from app.notifications n
                where n.status = 'pending'
                  and n.scheduled_at <= now()
                order by n.id asc
                limit %s
                for update skip locked;
                """,
                (int(batch),),
            )
            rows = [dict(r) for r in cur.fetchall()]

            for n in rows:
                notif_id = int(n.get("id"))
                owner_id = str(n.get("owner_id") or "")
                channel = str(n.get("channel") or "")
                template = str(n.get("template") or "")
                payload = n.get("payload") if isinstance(n.get("payload"), dict) else {}

                cur.execute(
                    """
                    select u.email,
                           p.email_enabled,
                           p.whatsapp_enabled,
                           p.whatsapp_e164
                    from auth.users u
                    left join app.notification_preferences p on p.owner_id = u.id
                    where u.id = %s::uuid
                    limit 1;
                    """,
                    (owner_id,),
                )
                user = dict(cur.fetchone() or {})
                email = str(user.get("email") or "").strip() or None
                email_enabled = bool(user.get("email_enabled") if user.get("email_enabled") is not None else True)
                wa_enabled = bool(user.get("whatsapp_enabled") if user.get("whatsapp_enabled") is not None else False)
                wa_e164 = str(user.get("whatsapp_e164") or "").strip() or None

                if channel == "email":
                    if not email_enabled or not email:
                        cur.execute(
                            "update app.notifications set status='skipped', error=%s where id=%s",
                            ("email disabled or missing email", notif_id),
                        )
                        cur.execute(
                            "insert into app.notification_events(notification_id,event,meta) values (%s,'skipped',%s::jsonb)",
                            (notif_id, _json({"reason": "email opt-out"})),
                        )
                        skipped += 1
                        continue

                    result = await send_email(email, template, payload)
                    if result.ok:
                        cur.execute(
                            "update app.notifications set status='sent', provider_message_id=%s, sent_at=now(), error=null where id=%s",
                            (result.provider_message_id, notif_id),
                        )
                        cur.execute(
                            "insert into app.notification_events(notification_id,event,meta) values (%s,'sent',%s::jsonb)",
                            (notif_id, _json({"provider_message_id": result.provider_message_id})),
                        )
                        _enqueue_alert_sent_integration_event(cur, n, result.provider_message_id)
                        sent += 1
                    else:
                        cur.execute(
                            "update app.notifications set status='failed', error=%s where id=%s",
                            (result.error or "email send failed", notif_id),
                        )
                        cur.execute(
                            "insert into app.notification_events(notification_id,event,meta) values (%s,'failed',%s::jsonb)",
                            (notif_id, _json({"error": result.error})),
                        )
                        failed += 1
                    continue

                if channel == "whatsapp":
                    if not wa_enabled or not wa_e164:
                        cur.execute(
                            "update app.notifications set status='skipped', error=%s where id=%s",
                            ("whatsapp disabled or missing whatsapp_e164", notif_id),
                        )
                        cur.execute(
                            "insert into app.notification_events(notification_id,event,meta) values (%s,'skipped',%s::jsonb)",
                            (notif_id, _json({"reason": "whatsapp opt-out"})),
                        )
                        skipped += 1
                        continue
                    text = _render_whatsapp(template, payload)
                    result = send_whatsapp(wa_e164, text)
                    if result.ok:
                        cur.execute(
                            "update app.notifications set status='sent', provider_message_id=%s, sent_at=now(), error=null where id=%s",
                            (result.provider_message_id, notif_id),
                        )
                        cur.execute(
                            "insert into app.notification_events(notification_id,event,meta) values (%s,'sent',%s::jsonb)",
                            (notif_id, _json({"provider_message_id": result.provider_message_id})),
                        )
                        _enqueue_alert_sent_integration_event(cur, n, result.provider_message_id)
                        sent += 1
                    else:
                        # Not configured: mark skipped (v1).
                        if result.error and "not configured" in result.error:
                            cur.execute(
                                "update app.notifications set status='skipped', error=%s where id=%s",
                                (result.error, notif_id),
                            )
                            cur.execute(
                                "insert into app.notification_events(notification_id,event,meta) values (%s,'skipped',%s::jsonb)",
                                (notif_id, _json({"error": result.error})),
                            )
                            skipped += 1
                        else:
                            cur.execute(
                                "update app.notifications set status='failed', error=%s where id=%s",
                                (result.error or "whatsapp send failed", notif_id),
                            )
                            cur.execute(
                                "insert into app.notification_events(notification_id,event,meta) values (%s,'failed',%s::jsonb)",
                                (notif_id, _json({"error": result.error})),
                            )
                            failed += 1
                    continue

                cur.execute("update app.notifications set status='failed', error=%s where id=%s", ("unknown channel", notif_id))
                cur.execute(
                    "insert into app.notification_events(notification_id,event,meta) values (%s,'failed',%s::jsonb)",
                    (notif_id, _json({"error": "unknown channel"})),
                )
                failed += 1

        conn.commit()
        return {"processed": len(rows), "sent": sent, "failed": failed, "skipped": skipped}
    finally:
        try:
            conn.close()
        except Exception:
            pass

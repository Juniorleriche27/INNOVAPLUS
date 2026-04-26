# notification-service

Status: planned skeleton with embedded notification logic in the monolith.

## Planned responsibility

- emails
- alerts
- webhooks
- delivery events

## Planned port

- `8050`

## Planned API prefix

- `/api/v1/notifications/*`

## Current source inventory

- `apps/koryxa/backend/app/routers/notifications.py`
- `apps/koryxa/backend/app/services/alerts_v1.py`
- `apps/koryxa/backend/app/services/notifications/*`
- `apps/koryxa/backend/app/workers/alerts_worker.py`

## Migration note

Extract asynchronous delivery and alert fanout out of the core runtime early to reduce operational coupling.

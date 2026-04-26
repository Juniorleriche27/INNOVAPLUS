# chatlaya-service

Status: planned skeleton.

## Planned responsibility

- assistant IA
- conversations
- assistant modes
- context orchestration

## Planned port

- `8010`

## Planned API prefix

- `/api/v1/chatlaya/*`

## Current source inventory

- `apps/koryxa/backend/app/routers/chatlaya.py`
- `apps/koryxa/backend/app/repositories/chatlaya_pg.py`
- `apps/koryxa/backend/app/services/chatlaya_context.py`
- `apps/koryxa/backend/app/services/chatlaya_service.py`
- `apps/koryxa/backend/app/services/chatlaya_specialist.py`
- `apps/koryxa/frontend/app/chatlaya`
- `apps/koryxa/training`

## Migration note

Extract backend first. Keep the current frontend shell consuming the service through the gateway during the first cutover.

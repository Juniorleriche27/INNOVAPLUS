# myplanning-service

Status: planned skeleton with partial logic traces in the monolith.

## Planned responsibility

- planning
- tasks
- spaces
- execution support

## Planned port

- `8030`

## Planned API prefix

- `/api/v1/myplanning/*`

## Current source inventory

- `apps/koryxa/backend/app/services/myplanning_ai.py`
- planning event logging traces in `apps/koryxa/backend/app/services/data_logging.py`

## Migration note

Planning logic exists as helper behavior today, not as an independently deployable service yet.

# billing-service

Status: planned skeleton with a minimal placeholder in the monolith.

## Planned responsibility

- payments
- subscriptions
- invoices
- billing event handling

## Planned port

- `8060`

## Planned API prefix

- `/api/v1/billing/*`

## Current source inventory

- `apps/koryxa/backend/app/routers/billing.py`
- payment provider settings in `apps/koryxa/backend/app/core/config.py`

## Migration note

The current router is only a placeholder. A real dedicated billing backend must be implemented here before production extraction.

# analytics-service

Status: planned skeleton with partial analytics logic in the monolith.

## Planned responsibility

- product metrics
- usage events
- service analytics
- reporting marts

## Planned port

- `8070`

## Planned API prefix

- `/api/v1/analytics/*`

## Current source inventory

- `apps/koryxa/backend/app/routers/metrics.py`
- `apps/koryxa/backend/app/services/data_logging.py`
- analytics- and planning-related Mongo collections in the backend db layer

## Migration note

This service should own ingestion and reporting storage instead of relying on generic backend collections.

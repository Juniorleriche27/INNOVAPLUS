# koryxa-core-service

Status: planned skeleton.

## Planned responsibility

- principal auth
- users
- roles
- products
- subscriptions
- entitlements and access control

## Planned port

- `8000`

## Planned API prefix

- `/api/v1/core/*`

## Current source inventory

- `apps/koryxa/backend/app/routers/auth.py`
- `apps/koryxa/backend/app/services/product_registry.py`
- `apps/koryxa/backend/app/routers/public_products.py`
- access and session logic inside `apps/koryxa/backend/app/repositories/auth_pg.py`

## Migration note

Do not move active code here yet. First stabilize contracts and split ownership boundaries inside the current backend.

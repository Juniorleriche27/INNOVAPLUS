# koryxa-core-service

Status: logical live core service, with code still temporarily hosted in `apps/koryxa/backend`.

## Current reality

`koryxa-core-service` already exists as a production responsibility boundary.

What is still transitional is the code location.

Current live implementation:

- systemd unit: `innovaplus-backend.service`
- bind: `127.0.0.1:8000`
- public routing: `/health`, `/innova/*`, `/innova/api/*`
- current code location: `apps/koryxa/backend`

Important:

- this folder does not yet contain the live implementation
- but it is the correct target service identity for the core backend
- future extraction should move the core implementation here, not back toward a monolith

## Current responsibility

- principal auth
- users
- roles
- trajectoire
- enterprise APIs
- public products
- notifications
- internal core summaries and entitlements

## Not owned here

- ChatLAYA live routes
- ChatLAYA sessions/conversations/messages
- ChatLAYA collector endpoints

Those belong to:

- `services/chatlaya-service/backend`

## Planned responsibility refinement

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

Do not perform a blind file move.

Correct migration order:

1. stabilize service ownership
2. remove cross-service route duplication
3. document live contracts
4. only then relocate core implementation from `apps/koryxa/backend` into `services/koryxa-core-service/backend`

Read first:

- `SERVICE_MAP.md`
- `docs/LIVE_SERVICE_OWNERSHIP.md`
- `docs/LIVE_ROUTE_OWNERSHIP_MATRIX.md`

## Pending work explicitly tracked

The following work still remains to be done later:

1. move the active core backend implementation from `apps/koryxa/backend` into `services/koryxa-core-service/backend`
2. verify that startup, systemd, env loading and nginx routing still work after relocation
3. update all core service operational docs so they no longer describe `apps/koryxa/backend` as the runtime home
4. remove any remaining wording in the repo that could make future agents think the core still owns ChatLAYA

This is a planned migration task, not an immediate code-move instruction.

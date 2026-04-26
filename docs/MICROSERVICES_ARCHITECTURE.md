# KORYXA Microservices Architecture

## Purpose

This document defines the target production architecture for KORYXA as a platform of independently deployable services.

It is a preparation document. It does not move the current runtime, change production Nginx, change systemd units, or alter production environment files.

## Current Repository Audit

### Current active layout

Today the server repository is organized around a single active product application:

- `apps/koryxa/backend`
- `apps/koryxa/frontend`
- `apps/koryxa/training`

### Current backend runtime

`apps/koryxa/backend` is the active FastAPI application. It currently centralizes multiple business domains in one process:

- auth and sessions
- users and account access
- public products and enterprise entry points
- ChatLAYA conversations
- notifications
- billing bootstrap and payment configuration
- analytics / product metrics
- AI helpers for trajectory, planning, reporting

Observed entrypoints and coupling:

- `app.main` mounts one main FastAPI application with one shared startup lifecycle.
- Mounted routers include `auth`, `chatlaya`, `notifications`, `billing`, `trajectoire`, `public_enterprise`, `public_products`, `email`, `invite`, `youtube`.
- Health is global, not per business capability.
- Environment is shared through one backend runtime and one production env file.
- Postgres bootstrap is shared in one module and currently creates auth and ChatLAYA tables in the same runtime.
- Some metrics and planning event logging still rely on Mongo collections.

### Current frontend runtime

`apps/koryxa/frontend` is one Next.js application that serves:

- marketing pages
- auth flows
- ChatLAYA UI
- Service IA pages
- enterprise flows
- product shell / connected navigation

The frontend currently proxies one backend through shared rewrites, not service-specific gateways.

### Current training area

`apps/koryxa/training` contains training scripts and model preparation artifacts tied mainly to ChatLAYA model workflows.

This is operationally different from the main product runtime, but it still lives inside the same application family.

## What Is Mixed Today In `apps/koryxa`

### Mixed in backend

The following concerns are currently mixed in `apps/koryxa/backend`:

| Concern | Current location | Target service |
| --- | --- | --- |
| Main auth, sessions, user access | `app/routers/auth.py`, auth repositories, auth tables | `koryxa-core-service` |
| Product catalog and access registry | `app/services/product_registry.py`, public product routes | `koryxa-core-service` |
| Chat conversations and assistant logic | `app/routers/chatlaya.py`, `app/services/chatlaya_*`, `app/repositories/chatlaya_pg.py` | `chatlaya-service` |
| Notification delivery and alert workers | `app/routers/notifications.py`, `app/services/alerts_v1.py`, `app/services/notifications/*`, `app/workers/alerts_worker.py` | `notification-service` |
| Billing hooks and payment configuration | `app/routers/billing.py`, PayDunya config in `app/core/config.py` | `billing-service` |
| Product usage metrics | `app/routers/metrics.py`, `app/services/data_logging.py` | `analytics-service` |
| Planning AI helpers | `app/services/myplanning_ai.py`, planning event logging | `myplanning-service` |
| Enterprise / trajectory experience | `app/routers/trajectoire.py`, `app/routers/public_enterprise.py`, `app/services/enterprise_service.py`, `app/services/trajectory_service.py` | largely `koryxa-core-service` now, with future collaboration with `myplanning-service` |

### Mixed in frontend

The current frontend combines:

- identity and onboarding pages
- ChatLAYA application UI
- Service IA catalog
- enterprise discovery and brief flows
- connected shell / account navigation

That means the current UI is a single web surface, even though multiple future services will own different product capabilities.

### Missing or not yet integrated

The following target services do not yet exist as real service modules in the repository:

- `datalaya-service`
- `playwork-service`

The following target services exist only as partial traces or embedded helpers:

- `myplanning-service`
- `notification-service`
- `billing-service`
- `analytics-service`

## Current Operational Limitations

The current architecture has these production limitations:

1. One backend process owns too many domains.
2. One shared env file configures unrelated business capabilities together.
3. One deployment/restart impacts auth, chat, enterprise and notifications at once.
4. One backend startup lifecycle owns all health and bootstrap responsibilities.
5. Database ownership is not isolated by service boundary yet.
6. API routes are not consistently versioned by bounded context.
7. Frontend integration assumes one backend proxy instead of service contracts.

## Target Microservices Architecture

## Service list

| Service | Responsibility | Internal port | Public API prefix |
| --- | --- | --- | --- |
| `koryxa-core-service` | auth, users, roles, products, subscriptions, access | `8000` | `/api/v1/core/*` |
| `chatlaya-service` | assistant IA, conversations, modes, context orchestration | `8010` | `/api/v1/chatlaya/*` |
| `datalaya-service` | files, datasets, analysis jobs, reports, insights | `8020` | `/api/v1/datalaya/*` |
| `myplanning-service` | planning, tasks, spaces, execution support | `8030` | `/api/v1/myplanning/*` |
| `playwork-service` | simulations, serious games, scores, attestations | `8040` | `/api/v1/playwork/*` |
| `notification-service` | email, webhook, alert, event delivery | `8050` | `/api/v1/notifications/*` |
| `billing-service` | payments, subscriptions, invoices, access sync | `8060` | `/api/v1/billing/*` |
| `analytics-service` | product metrics, usage events, reporting feeds | `8070` | `/api/v1/analytics/*` |

## Core architectural rules

1. Each service must have its own backend runtime.
2. Each service must expose its own healthcheck.
3. Each service must have its own env file and log stream.
4. Each service must own its API version prefix.
5. `koryxa-core-service` remains the single source of truth for principal auth.
6. Other services can validate or introspect identity, but they do not become the auth authority.
7. Each service must be independently restartable and deployable.
8. Each service must be able to migrate later from a shared database cluster to its own database without contract breakage.

## Target repository structure

```text
KORYXA/
  services/
    koryxa-core-service/
    chatlaya-service/
    datalaya-service/
    myplanning-service/
    playwork-service/
    notification-service/
    billing-service/
    analytics-service/

  packages/
    shared-types/
    auth-client/
    api-client/
    ui/
    config/

  infra/
    nginx/
    systemd/
    docker/
    scripts/
    monitoring/
    logs/
```

## Service ownership boundaries

### `koryxa-core-service`

Owns:

- principal auth and session lifecycle
- users, roles, access control
- products, subscription state, entitlements
- cross-platform identity contract
- public platform metadata that other services depend on

Does not own:

- conversations
- notification delivery execution
- billing execution details
- analytics event storage

### `chatlaya-service`

Owns:

- conversation lifecycle
- assistant modes
- conversation persistence
- prompt assembly, context composition, assistant response generation

Depends on:

- `koryxa-core-service` for user identity and entitlements
- optionally `analytics-service` for event emission
- optionally `notification-service` for async digests or escalations

### `datalaya-service`

Owns:

- file ingestion
- analysis pipelines
- reporting artifacts
- structured insight outputs

### `myplanning-service`

Owns:

- planning spaces
- task execution flows
- scheduling support
- planning events and execution state

### `playwork-service`

Owns:

- simulations
- games
- scores
- attestations

### `notification-service`

Owns:

- email delivery
- alert fanout
- webhook delivery
- notification preferences and delivery outcomes

It should receive intent from other services, not own platform auth.

### `billing-service`

Owns:

- payment provider integration
- subscriptions and invoices
- payment events
- billing state synchronization back to core access control

### `analytics-service`

Owns:

- event ingestion
- usage metrics
- product funnel metrics
- service-level analytics marts

## Data ownership strategy

### Transitional strategy

During migration, services may share one Postgres cluster, but they must not share one schema forever.

Recommended transitional ownership:

- `core.*`
- `chatlaya.*`
- `datalaya.*`
- `myplanning.*`
- `playwork.*`
- `notifications.*`
- `billing.*`
- `analytics.*`

### Long-term strategy

Each service must be able to move to its own database later with only configuration and gateway changes, not API redesign.

## API gateway strategy

The gateway or Nginx layer will become the stable ingress contract.

Public routing target:

- `/api/v1/core/*` -> `127.0.0.1:8000`
- `/api/v1/chatlaya/*` -> `127.0.0.1:8010`
- `/api/v1/datalaya/*` -> `127.0.0.1:8020`
- `/api/v1/myplanning/*` -> `127.0.0.1:8030`
- `/api/v1/playwork/*` -> `127.0.0.1:8040`
- `/api/v1/notifications/*` -> `127.0.0.1:8050`
- `/api/v1/billing/*` -> `127.0.0.1:8060`
- `/api/v1/analytics/*` -> `127.0.0.1:8070`

Backward compatibility should be preserved temporarily through aliases until current frontend clients are migrated off legacy `/innova/api/*` patterns.

## Frontend strategy

The microservices split does not require an immediate frontend split.

Recommended sequence:

1. Keep `apps/koryxa/frontend` as the active composition shell.
2. Move backend capabilities first.
3. Add service-specific frontends in `services/*/frontend` only when the UI must be independently versioned or deployed.
4. Keep a shared design system and auth client in `packages/`.

## Health, logging and operations

Every service must later expose:

- internal liveness endpoint
- internal readiness endpoint
- gateway-level health route
- isolated logs
- isolated unit name

Recommended naming:

- systemd unit: `<service-name>.service`
- log stream: `/var/log/koryxa/<service-name>/`
- env file: `/etc/koryxa/<service-name>.env`

## What This Preparation Changes Today

This preparation introduces:

- target directory skeleton under `services/`, `packages/`, `infra/`
- service placeholders and documentation
- migration conventions and phased plan

This preparation does not introduce:

- production cutover
- live reverse proxy changes
- live systemd changes
- live environment changes
- live data migration

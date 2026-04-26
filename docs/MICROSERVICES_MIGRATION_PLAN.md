# KORYXA Microservices Migration Plan

## Scope

This plan prepares the repository and migration sequence for a real production microservices architecture without breaking the current deployment.

## Migration principles

1. Do not move active runtime code blindly.
2. Extract one service boundary at a time.
3. Preserve backward-compatible routes during each cutover.
4. Separate code ownership before separating databases.
5. Separate healthchecks, env files, logs and units before declaring a service independent.
6. Keep `koryxa-core-service` as the principal auth authority.

## Baseline inventory

### Active today

- one backend runtime: `apps/koryxa/backend`
- one frontend runtime: `apps/koryxa/frontend`
- one training area: `apps/koryxa/training`
- one production backend env file
- one production backend unit
- shared Postgres bootstrap for auth and ChatLAYA
- partial Mongo usage for metrics and planning event logging

### Not yet extracted

- ChatLAYA is embedded in KORYXA
- notifications are embedded
- billing is only partially represented
- analytics are partially embedded
- MyPlanning exists as helper logic, not as its own service
- DataLAYA is absent
- PlayWork is absent

## Recommended migration phases

## Phase 0: Prepare contracts and skeletons

Goal:

- create the target repository structure
- document service boundaries
- define service conventions
- keep current runtime untouched

Exit criteria:

- `services/`, `packages/`, `infra/` skeleton exists
- migration and conventions docs exist
- no production config was changed

## Phase 1: Stabilize `koryxa-core-service` boundaries inside the monolith

Goal:

- identify core-owned modules and interfaces without moving them yet

Tasks:

1. Define the core contract for:
   - auth
   - users
   - roles
   - product/access registry
   - subscriptions / entitlements
2. Introduce explicit internal interfaces for session verification and entitlement checks.
3. Stop new business logic from being added directly to generic shared bootstrap modules.
4. Separate route groups in code comments and docs by target service ownership.

Exit criteria:

- core responsibilities are explicit
- downstream services can depend on a stable auth/access contract

## Phase 2: Extract `chatlaya-service` backend first

Goal:

- make ChatLAYA independently deployable without forcing a frontend rewrite

Tasks:

1. Copy or move ChatLAYA-specific backend code into `services/chatlaya-service/backend`.
2. Give it its own startup, env file, healthcheck and log stream.
3. Route new service traffic internally on port `8010`.
4. Keep current public behavior working through gateway aliases.
5. Keep auth delegated to `koryxa-core-service`.
6. Move ChatLAYA database ownership from shared bootstrap assumptions toward `chatlaya` schema migrations.

Current source candidates:

- `apps/koryxa/backend/app/routers/chatlaya.py`
- `apps/koryxa/backend/app/repositories/chatlaya_pg.py`
- `apps/koryxa/backend/app/services/chatlaya_*`
- `apps/koryxa/frontend/app/chatlaya`

Exit criteria:

- ChatLAYA backend can be restarted without restarting core
- ChatLAYA healthcheck exists
- ChatLAYA uses service-local env

## Phase 3: Extract `notification-service`

Goal:

- isolate delivery concerns and asynchronous event fanout

Tasks:

1. Move notification delivery adapters and workers out of the core backend runtime.
2. Define explicit notification intent APIs or event inputs.
3. Give the service its own data tables or schema.
4. Move alert workers under service-local execution.

Current source candidates:

- `apps/koryxa/backend/app/routers/notifications.py`
- `apps/koryxa/backend/app/services/alerts_v1.py`
- `apps/koryxa/backend/app/services/notifications/*`
- `apps/koryxa/backend/app/workers/alerts_worker.py`

Exit criteria:

- notifications deploy independently
- delivery failures do not require core restarts

## Phase 4: Extract `analytics-service`

Goal:

- separate event ingestion and product analytics from product APIs

Tasks:

1. Move product metrics endpoints and event logging into a dedicated service.
2. Decide whether analytics remains on Mongo initially or migrates to Postgres later.
3. Introduce service-local marts and healthchecks.

Current source candidates:

- `apps/koryxa/backend/app/routers/metrics.py`
- `apps/koryxa/backend/app/services/data_logging.py`
- `apps/koryxa/backend/app/db/mongo.py` planning and metrics collections

Exit criteria:

- analytics ingestion is independent
- reporting storage is no longer owned by the core runtime

## Phase 5: Extract `billing-service`

Goal:

- move payment execution and billing state into a dedicated service

Tasks:

1. Implement a real backend in `services/billing-service/backend`.
2. Move provider configuration and webhook handling there.
3. Keep entitlement state synchronized back to core.
4. Add billing migrations and invoice storage.

Current source candidates:

- `apps/koryxa/backend/app/routers/billing.py`
- PayDunya configuration in `apps/koryxa/backend/app/core/config.py`

Exit criteria:

- billing webhook handling is independent
- billing deploys and restarts independently

## Phase 6: Carve out `myplanning-service`

Goal:

- separate planning and execution logic from general KORYXA flows

Tasks:

1. Move planning AI helpers and planning event storage into a dedicated backend.
2. Define planning domain entities: spaces, tasks, schedules, execution events.
3. Add a dedicated frontend slice when the planning UI becomes independently deployable.

Current source candidates:

- `apps/koryxa/backend/app/services/myplanning_ai.py`
- planning event logging in `apps/koryxa/backend/app/services/data_logging.py`
- current connected shell areas referencing planning concepts

Exit criteria:

- planning backend owns its own domain tables and APIs

## Phase 7: Introduce `datalaya-service`

Goal:

- add a clean service for data files, analysis and reports instead of mixing it into ChatLAYA or enterprise flows later

Tasks:

1. Create initial data ingestion and report generation contracts.
2. Add file processing pipeline boundaries.
3. Define future storage ownership and job execution model.

Exit criteria:

- DataLAYA enters the repo as a first-class service skeleton with clear contracts

## Phase 8: Introduce `playwork-service`

Goal:

- add simulation and certification features without contaminating core or planning domains

Tasks:

1. Define play sessions, scores and attestations.
2. Add its own service APIs and test structure.
3. Integrate identity from core only.

Exit criteria:

- PlayWork is a standalone service module

## Phase 9: Optional frontend decomposition

Goal:

- split frontends only where independent release cadence is justified

Recommended order:

1. Keep the current frontend as the shell.
2. Extract ChatLAYA frontend if it needs separate deployment cadence.
3. Extract MyPlanning frontend if execution workspace becomes its own product surface.
4. Keep shared UI in `packages/ui`.

## Route migration strategy

### Target public routes

- `/api/v1/core/*`
- `/api/v1/chatlaya/*`
- `/api/v1/datalaya/*`
- `/api/v1/myplanning/*`
- `/api/v1/playwork/*`
- `/api/v1/notifications/*`
- `/api/v1/billing/*`
- `/api/v1/analytics/*`

### Compatibility strategy

Do not break current clients immediately.

Recommended sequence:

1. New services expose the target `/api/v1/...` APIs.
2. Gateway adds compatibility aliases from old routes to new internal services.
3. Frontend clients are progressively switched to new versioned endpoints.
4. Old aliases are removed only after verification and rollback windows.

## Database migration strategy

### Stage 1

- allow one shared Postgres cluster
- use service-owned schemas
- stop creating new cross-service tables in one generic namespace

### Stage 2

- move services to dedicated databases only after contracts and migrations are stable

## Production checklist before any extraction

1. Identify the exact runtime dependencies of the service being extracted.
2. Define the service-local env file.
3. Define liveness and readiness endpoints.
4. Define the service log path and systemd unit template.
5. Define rollback routing.
6. Define database schema ownership.
7. Define authentication verification method with core.
8. Define smoke tests for the service.
9. Define alerting and dashboard coverage.

## Cutover checklist per service

1. Service boots independently on its own port.
2. Service has its own env file.
3. Service has its own healthcheck.
4. Service has its own migrations.
5. Gateway template exists.
6. Rollback path is documented.
7. Logs are isolated.
8. Functional smoke tests pass.
9. Legacy route compatibility remains intact during cutover.

## Immediate recommendations

1. Extract `chatlaya-service` first because the boundary is already visible in code.
2. Extract `notification-service` second because it reduces side effects in the core process.
3. Extract `analytics-service` third because it already has distinct event ingestion behavior.
4. Move `billing-service` next once payment flows are fully implemented.
5. Introduce `myplanning-service`, `datalaya-service` and `playwork-service` as dedicated products after core and chat boundaries are stable.

# KORYXA Service Conventions

## Goal

These conventions define how every service in the future KORYXA architecture must be structured and operated.

## Standard service layout

For user-facing services:

```text
services/<service-name>/
  backend/
  frontend/
  migrations/
  tests/
  README.md
```

For headless services:

```text
services/<service-name>/
  backend/
  migrations/
  tests/
  README.md
```

## Naming

- Service folder: kebab-case, example `chatlaya-service`
- Python package name: snake_case if needed, example `chatlaya_service`
- systemd unit: same as service folder when possible
- database schema: service-owned schema, example `chatlaya`

## Ports

Reserved internal ports:

- `koryxa-core-service` -> `8000`
- `chatlaya-service` -> `8010`
- `datalaya-service` -> `8020`
- `myplanning-service` -> `8030`
- `playwork-service` -> `8040`
- `notification-service` -> `8050`
- `billing-service` -> `8060`
- `analytics-service` -> `8070`

## API versioning

Every service must expose a versioned API prefix:

- `/api/v1/core/*`
- `/api/v1/chatlaya/*`
- `/api/v1/datalaya/*`
- `/api/v1/myplanning/*`
- `/api/v1/playwork/*`
- `/api/v1/notifications/*`
- `/api/v1/billing/*`
- `/api/v1/analytics/*`

Rules:

1. No new public route without a version prefix.
2. No service should publish endpoints under another service prefix.
3. Compatibility aliases are temporary gateway concerns, not permanent service design.

## Healthchecks

Each service must expose:

- `GET /health/live`
- `GET /health/ready`

Optional gateway alias:

- `GET /api/v1/<service>/health`

Rules:

1. Liveness only proves the process is up.
2. Readiness proves critical dependencies are available enough to serve traffic.
3. A service must not report ready when required database connectivity is unavailable.

## Environment files

Each service must own:

- local example env: `services/<service-name>/backend/.env.example`
- production env file: `/etc/koryxa/<service-name>.env`

Rules:

1. Never share one production env file across all services.
2. Shared values must still be copied explicitly per service or injected through secrets tooling.
3. No service may read another service's env file directly.

## Logs

Each service must own its own log stream.

Recommended paths:

- `/var/log/koryxa/koryxa-core-service/`
- `/var/log/koryxa/chatlaya-service/`
- `/var/log/koryxa/datalaya-service/`
- `/var/log/koryxa/myplanning-service/`
- `/var/log/koryxa/playwork-service/`
- `/var/log/koryxa/notification-service/`
- `/var/log/koryxa/billing-service/`
- `/var/log/koryxa/analytics-service/`

Rules:

1. No mixed application log files.
2. Every log line must include service name, environment and correlation id when possible.

## Migrations and data ownership

Each service must own:

- its own `migrations/`
- its own schema or database namespace
- its own data model evolution

Rules:

1. A service must not apply migrations for another service.
2. Shared database cluster is acceptable temporarily.
3. Shared table ownership is not acceptable long term.
4. `koryxa-core-service` remains the only owner of primary identity and access state.

## Auth and identity

Rules:

1. `koryxa-core-service` is the principal auth authority.
2. Other services may validate tokens, introspect sessions or consume signed identity claims.
3. No business service should create its own primary user system outside core.
4. Service-local permissions must derive from core identity plus service entitlements.

## Inter-service communication

Preferred rule set:

1. Use synchronous HTTP only for direct request/response dependencies.
2. Use asynchronous events for notifications, analytics and background workflows.
3. Avoid direct database reads across service boundaries.
4. Prefer shared clients in `packages/auth-client` and `packages/api-client` over service-internal imports.

## Shared packages

Only cross-service reusable contracts belong in `packages/`:

- `shared-types`
- `auth-client`
- `api-client`
- `ui`
- `config`

Rules:

1. No business-specific code in shared packages.
2. Shared packages must stay backward compatible or versioned.
3. Service internals must not be imported directly by another service.

## Testing

Each service must own its tests:

- unit tests
- integration tests
- smoke tests

Minimum expectation per service:

1. boot test
2. healthcheck test
3. auth integration test when applicable
4. one core business workflow test

## Deployment

Each service must be:

- buildable independently
- restartable independently
- deployable independently
- observable independently

Rules:

1. No shared restart should be required for an isolated service code change.
2. Nginx or gateway routing must be template-driven in `infra/`, not edited ad hoc in application code.

## Frontend conventions

Rules:

1. Frontend extraction is optional and should follow backend extraction, not precede it.
2. Shared design primitives belong in `packages/ui`.
3. Shared auth and API clients must come from `packages/auth-client` and `packages/api-client`.
4. Current shell can remain centralized while services are being split.

## Backward compatibility

Rules:

1. Preserve legacy routes through the gateway during migration windows.
2. Deprecate old routes with explicit documentation.
3. Remove compatibility aliases only after monitoring confirms no remaining traffic.

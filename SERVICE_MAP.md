# KORYXA Service Map

This file is the fastest entry point for understanding which backend owns which responsibility.

Read this before changing backend code.

## Current production service map

| Logical service | Live systemd unit | Live bind | Public routing | Current code location | Status |
| --- | --- | --- | --- | --- | --- |
| `koryxa-core-service` | `innovaplus-backend.service` | `127.0.0.1:8000` | `/health`, `/innova/*`, `/innova/api/*` | `apps/koryxa/backend` | live |
| `chatlaya-service` | `chatlaya.service` | `127.0.0.1:8012` | `/api/chatlaya/*`, site `/chatlaya/*` proxy routes | `services/chatlaya-service/backend` | live |
| `rag-service` | not standardized here | `127.0.0.1:8011` | `/rag/*` | external/local runtime | live helper |

## Important truth

`apps/koryxa/backend` is no longer to be interpreted as “the monolith that owns everything”.

For current production, it is the implementation location of the logical `koryxa-core-service`.

That means:

- core concerns belong there for now;
- ChatLAYA concerns do not belong there anymore;
- future extraction should move code out of `apps/koryxa/backend` into `services/koryxa-core-service/backend`, but that move is a structural migration, not a day-to-day ownership excuse.

## Current ownership rules

- ChatLAYA routes and behavior belong to `services/chatlaya-service/backend`
- core auth, enterprise, trajectoire, public products and internal core APIs belong to `apps/koryxa/backend`

Detailed live routing:

- `docs/LIVE_SERVICE_OWNERSHIP.md`
- `docs/LIVE_ROUTE_OWNERSHIP_MATRIX.md`

## Rule for future developers and coding agents

1. identify the public route
2. identify the nginx target
3. identify the systemd service
4. edit the owning backend only

Never infer ownership from folder names alone.

## Pending repository cleanup

This work is intentionally not finished yet.

Future planned cleanup:

1. relocate the live core backend implementation from `apps/koryxa/backend` to `services/koryxa-core-service/backend`
2. align systemd naming from `innovaplus-backend.service` toward a service name consistent with `koryxa-core-service`
3. align environment ownership so the core service has its own explicit service-level env convention
4. continue the same ownership cleanup for every other service boundary that still mixes legacy app layout with service layout

Important:

- do not perform this relocation as a blind copy or rename
- complete it only as an explicit migration step with routing, runtime and ownership validation

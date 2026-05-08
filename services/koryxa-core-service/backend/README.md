# koryxa-core-service backend

This directory is the target home of the future extracted core backend implementation.

Current production note:

- the live logical `koryxa-core-service` is still implemented in `apps/koryxa/backend`
- do not start a second competing core backend here
- do not copy business logic here without an explicit migration step

Before moving code here, read:

- `SERVICE_MAP.md`
- `docs/LIVE_SERVICE_OWNERSHIP.md`
- `docs/LIVE_ROUTE_OWNERSHIP_MATRIX.md`

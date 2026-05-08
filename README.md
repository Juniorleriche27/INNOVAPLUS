# KORYXA Platform

This repo now follows a simple tiered layout so every product family lands in its own
space while sharing the same infrastructure tooling.

Important:

- current backend ownership is documented in `SERVICE_MAP.md`
- live route ownership is documented in `docs/LIVE_SERVICE_OWNERSHIP.md`
- do not assume `apps/koryxa/backend` owns every backend responsibility

## Layout

- `apps/` – core platform apps (actuellement `koryxa` avec backend/frontend/training).
- `services/` – dedicated and emerging backend service boundaries.
- `docs/` – shared documentation (models, ops, runbooks, handbook).
- Root files – CI/CD descriptors (`docker-compose.yml`, etc.).

Refer to `docs/koryxa-handbook.md` for per-app commands and environment requirements.
Refer to `docs/site-architecture.md` for the current KORYXA public and connected information architecture.

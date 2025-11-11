# KORYXA Platform

This repo now follows a simple tiered layout so every product family lands in its own
space while sharing the same infrastructure tooling.

## Layout

- `apps/` – core platform apps (actuellement `koryxa` avec backend/frontend/training).
- `products/` – vertical solutions (PlusBook, PieAgency, FarmLink, Koryxa Santé, …).
- `docs/` – shared documentation (models, ops, runbooks, handbook).
- Root files – CI/CD descriptors (`docker-compose.yml`, etc.).

Refer to `docs/koryxa-handbook.md` for per-app commands and environment requirements.

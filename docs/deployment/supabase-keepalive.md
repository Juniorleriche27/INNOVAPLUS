# Supabase Keepalive

Purpose: prevent Supabase project pause due to inactivity.

## Workflow

File: `.github/workflows/supabase-keepalive.yml`

- Runs every 12 hours.
- Can also be triggered manually from GitHub Actions.
- Executes `scripts/supabase_keepalive.py`, which runs a lightweight SQL ping (`select now(), 1`).

## Required GitHub secret

- `SUPABASE_DATABASE_URL`
  - Use the Postgres connection string for the Supabase project.
  - Do not commit this value in the repository.

## Local manual check

```bash
export SUPABASE_DATABASE_URL="postgres://..."
python scripts/supabase_keepalive.py
```


Supbase Usage
=============

Schema
------

Rejouer le schema:

```bash
psql "$DATABASE_URL" -f supbase/schema.sql
```

ou:

```bash
psql "$SUPABASE_DATABASE_URL" -f supbase/schema.sql
```

Backfill des embeddings RAG
---------------------------

Le script remplit `app.rag_chunks.embedding` pour le corpus `launch_structure_sell`.

Dry run:

```bash
cd apps/koryxa/backend
. .venv/bin/activate
python3 ../../../supbase/backfill_rag_embeddings.py --dry-run
```

Backfill par batch:

```bash
cd apps/koryxa/backend
. .venv/bin/activate
python3 ../../../supbase/backfill_rag_embeddings.py --batch-size 100
```

Limiter a un nombre de lignes:

```bash
cd apps/koryxa/backend
. .venv/bin/activate
python3 ../../../supbase/backfill_rag_embeddings.py --batch-size 100 --limit 300
```

Notes
-----

- Le script charge d'abord `/etc/innovaplus/backend.env`, puis `apps/koryxa/backend/.env`.
- Le script suppose que `supbase/schema.sql` a deja ete rejoue.
- Le backend utilise ensuite `app.match_rag_chunks(...)` quand les embeddings sont presents.

KORYXA — Déploiement des Frontends (Vercel)
==========================================

Backend commun (Hetzner)
------------------------
- URL backend: `https://api.innovaplus.africa`
- Préfixes de modules:
  - INNOVA (core): `/innova/api` (endpoints métier), `/innova/ingest`, `/innova/chat`, `/innova/feedback`, `/innova/health`
  - PlusBook: `/plusbook/api/...`, `/plusbook/health`
  - PieAgency: `/pieagency/health` (à compléter si API)
  - FarmLink: `/farmlink/health` (à compléter si API)
  - Santé: `/sante/health` (à compléter si API)

Variables backend (fichier `/etc/innovaplus/backend.env`)
- `ALLOWED_ORIGINS`: inclure tous les domaines Vercel (prod + previews) séparés par des virgules.
- `MONGO_URI`, `DB_NAME=innova_db`, `JWT_SECRET`, `JWT_EXPIRES_MINUTES`
- RAG: `LLM_PROVIDER`, `COHERE_API_KEY` (si Cohere), `LLM_MODEL`, `EMBED_MODEL`, `EMBED_DIM`, `VECTOR_INDEX_NAME`

Frontend unique (Next.js, portefeuille Koryxa)
----------------------------------------------
- Dossier: `apps/koryxa/frontend`
- Couvre les modules Opportunités IA, PieAgency, PlusBook, Marketplace, MyPlanning, Chatlaya, etc.
- Env (local et Vercel):
  - `NEXT_PUBLIC_API_URL=https://api.innovaplus.africa/innova/api`
  - (RAG): appeler `/innova/ingest`, `/innova/chat`, `/innova/feedback`
- Rewrites: `next.config.ts` créera un proxy `/api/*` → `NEXT_PUBLIC_API_URL` si défini.
- Ajouter le domaine Vercel à `ALLOWED_ORIGINS` côté backend.

FarmLink (Streamlit)
--------------------
- Dossier: `products/farmlink/farmlink/frontend`
- Secrets (local/Vercel via environment, ou Streamlit Cloud si utilisé):
  - `.streamlit/secrets.toml`: `API_URL = "https://api.innovaplus.africa/farmlink"`
- Ajouter le domaine à `ALLOWED_ORIGINS` si l’app appelle le backend via navigateur.

INNOVA_PLUS_SANTE (Streamlit)
-----------------------------
- Dossier: `products/koryxa-sante/streamlit_app`
- Secrets: `.streamlit/secrets.toml`: `API_URL = "https://api.innovaplus.africa/sante"`
- Ajouter le domaine à `ALLOWED_ORIGINS` si nécessaire.

Checklist Vercel par projet
---------------------------
1) Créer un projet Vercel pointant sur le bon sous-dossier (monorepo):
   - Root Directory = chemin du frontend (ex: `apps/koryxa/frontend`)
2) Ajouter les variables d’environnement listées ci-dessus (Production + Preview).
3) Build: Next par défaut (`next build`).
4) Vérifier CORS côté backend (`ALLOWED_ORIGINS`).
5) Déployer.

Tests rapides
-------------
- PlusBook: `GET https://api.innovaplus.africa/plusbook/health`
- INNOVA: `GET https://api.innovaplus.africa/innova/health` et `/health`
- RAG: `POST https://api.innovaplus.africa/innova/ingest` puis `POST /innova/chat`

Notes
-----
- Les secrets IA (clés provider) restent côté backend uniquement.
- Les uploads persistants (PDF eBooks) devraient viser un stockage durable (S3) au lieu du disque local (éphémère).

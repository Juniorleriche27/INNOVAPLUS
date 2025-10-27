INNOVAPLUS — Déploiement des Frontends (Vercel)
===============================================

Backend commun (Render)
-----------------------
- URL backend: `https://api.innovaplus.africa`
- Préfixes de modules:
  - INNOVA (core): `/innova/api` (endpoints métier), `/innova/ingest`, `/innova/chat`, `/innova/feedback`, `/innova/health`
  - PlusBook: `/plusbook/api/...`, `/plusbook/health`
  - PieAgency: `/pieagency/health` (à compléter si API)
  - FarmLink: `/farmlink/health` (à compléter si API)
  - Santé: `/sante/health` (à compléter si API)

Variables backend (Render → Environment)
- `ALLOWED_ORIGINS`: ajouter tous les domaines Vercel (prod + previews), séparés par des virgules.
- `MONGO_URI`, `DB_NAME=innova_db`, `JWT_SECRET`, `JWT_EXPIRES_MINUTES`
- RAG: `LLM_PROVIDER`, `COHERE_API_KEY` (si Cohere), `LLM_MODEL`, `EMBED_MODEL`, `EMBED_DIM`, `VECTOR_INDEX_NAME`

PlusBook (Vite)
---------------
- Dossier: `INNOVAPLUS/PlusBook/frontend`
- Env (local et Vercel):
  - `VITE_API_BASE=https://api.innovaplus.africa/plusbook`
- Côté backend Render: `ALLOWED_ORIGINS` doit contenir le domaine Vercel du front PlusBook.

INNOVA (Next.js)
----------------
- Dossier: `INNOVAPLUS/INNOVA/frontend`
- Env (local et Vercel):
  - `NEXT_PUBLIC_API_URL=https://api.innovaplus.africa/innova/api`
  - (RAG): appeler `/innova/ingest`, `/innova/chat`, `/innova/feedback`
- Rewrites: `next.config.ts` créera un proxy `/api/*` → `NEXT_PUBLIC_API_URL` si défini.
- Ajouter le domaine Vercel à `ALLOWED_ORIGINS` côté backend.

PieAgency (Vite)
----------------
- Dossier: `INNOVAPLUS/PieAgency/frontend`
- Env (local et Vercel):
  - `VITE_API_BASE=https://api.innovaplus.africa/pieagency`
- Ajouter le domaine Vercel à `ALLOWED_ORIGINS`.

FarmLink (Streamlit)
--------------------
- Dossier: `INNOVAPLUS/FarmLink/farmlink/frontend`
- Secrets (local/Vercel via environment si déployé sur Vercel, sinon Render/Streamlit Cloud):
  - `.streamlit/secrets.toml`: `API_URL = "https://api.innovaplus.africa/farmlink"`
- Ajouter le domaine à `ALLOWED_ORIGINS` si l’app appelle le backend via navigateur.

INNOVA_PLUS_SANTE (Streamlit)
-----------------------------
- Dossier: `INNOVAPLUS/INNOVA_PLUS_SANTE/streamlit_app`
- Secrets: `.streamlit/secrets.toml`: `API_URL = "https://api.innovaplus.africa/sante"`
- Ajouter le domaine à `ALLOWED_ORIGINS` si nécessaire.

Checklist Vercel par projet
---------------------------
1) Créer un projet Vercel pointant sur le bon sous-dossier (monorepo):
   - Root Directory = chemin du frontend (ex: `INNOVAPLUS/INNOVA/frontend`)
2) Ajouter les variables d’environnement listées ci-dessus (Production + Preview).
3) Build: par défaut (Next: `next build`, Vite: `npm run build`).
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
- Les uploads persistants (PDF eBooks) devraient viser un stockage durable (S3) au lieu du disque Render (éphémère).


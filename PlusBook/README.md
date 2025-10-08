PlusBook Monorepo
=================

Structure
---------

- `backend/` — FastAPI + MongoDB
  - `app/` (routers, schemas, core)
  - `storage/public/` (fichiers publics, ex: ebooks PDF via `/storage/...`)
  - `requirements.txt`
  - `.env` (MONGO_URI, DB_NAME, JWT_SECRET, JWT_EXPIRES_MINUTES)

- `frontend/` — React + Vite
  - `src/`, `public/`, `index.html`, `vite.config.js`
  - `package.json`, `package-lock.json`
  - `.env.local` (`VITE_API_BASE=http://localhost:8080` en dev)

Démarrer en local
-----------------

Backend

1) `cd PlusBook/backend`
2) `python -m venv .venv && .venv\\Scripts\\activate`
3) `pip install -r requirements.txt`
4) Configurer `.env` avec au minimum:

   MONGO_URI=your_mongodb_uri
   DB_NAME=plusbook_db
   JWT_SECRET=change_me
   JWT_EXPIRES_MINUTES=60

5) `uvicorn app.main:app --reload --port 8080`

Endpoints

- Racine (compat): `/api/...`
- Préfixe unifié: `/plusbook/api/...`
- Santé: `/health` et `/plusbook/health`

Frontend

1) `cd PlusBook/frontend`
2) `npm install`
3) `npm run dev`

Notes
-----

- Les routes API sont disponibles sous `/api` et sous `/plusbook/api` (pour le futur gateway unifié INNOVA+).
- Les uploads PDF sont servis via `/storage/ebooks/...`.
- CORS activé pour permettre l’accès depuis le frontend en dev.

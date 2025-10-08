INNOVAPLUS Monorepo
===================

Structure
---------

- `INNOVA/backend/` — Gateway FastAPI + MongoDB (projet mère)
  - `app/` (core, db, deps, routers des modules: plusbook, innova, pieagency, farmlink, sante)
  - `storage/public/` (fichiers publics, ex: ebooks PDF via `/storage/...`)
  - `requirements.txt`
  - `.env` (MONGO_URI, DB_NAME=innova_db, JWT_SECRET, JWT_EXPIRES_MINUTES)

- `PlusBook/frontend/` — React + Vite (app PlusBook)
  - `src/`, `public/`, `index.html`, `vite.config.js`
  - `package.json`, `package-lock.json`
  - `.env.local` (`VITE_API_BASE=http://localhost:8080/plusbook` en dev)

Démarrer en local
-----------------

Backend (Gateway)

1) `cd INNOVAPLUS/INNOVA/backend`
2) `python -m venv .venv && .venv\\Scripts\\activate`
3) `pip install -r requirements.txt`
4) `.env` minimal:

   MONGO_URI=your_mongodb_uri
   DB_INNOVA=innova_db
   DB_PLUSBOOK=plusbook_db
   DB_NAME=innova_db
   JWT_SECRET=change_me
   JWT_EXPIRES_MINUTES=60

5) `uvicorn app.main:app --reload --port 8080`

Endpoints

- Racine (INNOVA): `/health` (db: innova_db)
- PlusBook: `/plusbook/api/...` et `/plusbook/health`
- INNOVA: `/innova/health`
- PieAgency: `/pieagency/health`
- FarmLink: `/farmlink/health`
- Santé: `/sante/health`

Frontend (PlusBook)

1) `cd INNOVAPLUS/PlusBook/frontend`
2) `npm install`
3) `npm run dev`

Notes
-----

- Les uploads PDF sont servis via `/storage/ebooks/...` par le backend.
- CORS est activé pour le dev; restreins en prod si besoin.

Déploiement Render (Blueprint)
------------------------------

- Fichier racine `render.yaml` configure un service web sur `INNOVAPLUS/INNOVA/backend`.
- Variables d'env à renseigner: `MONGO_URI`, `DB_NAME` (innova_db), `JWT_SECRET`, `JWT_EXPIRES_MINUTES`.
- Bases optionnelles par module: `DB_INNOVA`, `DB_PLUSBOOK`, `DB_PIEAGENCY`, `DB_FARMLINK`, `DB_SANTE`.

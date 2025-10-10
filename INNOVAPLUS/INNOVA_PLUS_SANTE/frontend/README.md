INNOVA+ Santé — Frontend (React + Vite)
======================================

- Base URL backend (Render): `/sante`
- Définis `VITE_API_BASE` (local/Vercel) vers `https://innovaplus.onrender.com/sante`

Scripts
-------

- `npm ci`
- `npm run dev` (http://localhost:5174)
- `npm run build`
- `npm run preview`

Pages incluses
--------------

- Accueil
- Health (GET `/health`)
- Chat (POST `/chat`)
- Datasets (POST `/ingest`)
- Dashboard (placeholder)

Déploiement Vercel (monorepo)
-----------------------------

- Root Directory: `INNOVAPLUS/INNOVA_PLUS_SANTE/frontend`
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE=https://innovaplus.onrender.com/sante`

Assure-toi que CORS côté backend autorise ce domaine Vercel.

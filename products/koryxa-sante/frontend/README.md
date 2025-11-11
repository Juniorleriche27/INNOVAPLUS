KORYXA Santé — Frontend (React + Vite)
======================================

- Base URL backend (Hetzner API): `https://api.innovaplus.africa/sante`
- Définis `VITE_API_BASE` (local/Vercel) vers cette URL

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

- Root Directory: `products/koryxa-sante/frontend`
- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_BASE=https://api.innovaplus.africa/sante`

Assure-toi que CORS côté backend autorise ce domaine Vercel.

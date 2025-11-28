KORYXA Monorepo
===============

Structure
---------

- `apps/koryxa/backend` — passerelle FastAPI (MongoDB, auth, modules PlusBook, PieAgency, Farmlink, Santé, etc.).
- `apps/koryxa/frontend` — interface Next.js (app Chatlaya/Koryxa) qui sert désormais tout le portefeuille.
- `apps/koryxa/training` — scripts de fine-tuning / conversion des modèles (SmolLM, Llama, GGUF).
- `products/pie-agency` — prompts/docs/données PieAgency (pas de frontend dédié, intégré dans le Next).
- `products/farmlink` — assets FarmLink (Streamlit + données).
- `products/koryxa-sante` — stack Streamlit Koryxa Santé & Bien-être.

Les anciens chemins hérités ont été retirés ; utilise désormais uniquement `apps/koryxa/*` et `products/*` (les scripts d’automatisation sont alignés dessus).

Démarrer en local
-----------------

### Backend (apps/koryxa/backend)

1. `cd apps/koryxa/backend`
2. `python -m venv .venv && source .venv/bin/activate` (PowerShell : `.venv\Scripts\Activate.ps1`)
3. `pip install -r requirements.txt`
4. `.env` minimal :

   ```
   MONGO_URI=your_mongodb_uri
   DB_INNOVA=innova_db
   DB_PLUSBOOK=plusbook_db
   DB_NAME=innova_db
   JWT_SECRET=change_me
   JWT_EXPIRES_MINUTES=60
   ```

5. `uvicorn app.main:app --reload --port 8080`

Endpoints principaux : `/innova/health`, `/plusbook/health`, `/farmlink/health`, `/pieagency/health`, `/sante/health`, `/innova/api/*`, `/innova/chat`, `/innova/ingest`.

### Frontend Next.js (apps/koryxa/frontend)

1. `cd apps/koryxa/frontend`
2. `pnpm install` (ou `npm install`)
3. `cp .env.example .env.local` puis définir `NEXT_PUBLIC_API_URL=https://api.innovaplus.africa/innova/api`
4. `pnpm dev`

### Frontends produits

- PlusBook / PieAgency : frontends Vite retirés — tout est servi depuis `apps/koryxa/frontend`.
- FarmLink : `cd products/farmlink/farmlink/frontend && streamlit run ...` (`API_URL=https://api.innovaplus.africa/farmlink`).
- Koryxa Santé : `cd products/koryxa-sante/streamlit_app && streamlit run simple_main.py` (`API_URL=https://api.innovaplus.africa/sante`).

Notes
-----

- Les uploads (`apps/koryxa/backend/storage/public`) restent servis via `/storage/...`.
- `docs/models/smollm-360m.md` décrit l’intégration SmolLM locale.
- Scripts CI (GitHub Actions) / Vercel doivent pointer vers `apps/koryxa/*` ou `products/*` selon le module ciblé.

Missions & matching
-------------------

- API FastAPI : `/innova/api/missions/*` (voir `app/routers/missions.py`).
- Création / preview : `POST /missions?simulate=1` (résumé IA) puis `POST /missions` pour enregistrer (statut `new`).
- Vagues : `POST /missions/{id}/waves` déclenche la sélection (<3 s) + notifications (email/WhatsApp) et journalise dans `mission_events`.
- Offres : `POST /missions/{id}/offers/{offer_id}/respond` (prestataire), `POST /missions/{id}/confirm` (demandeur), `POST /missions/{id}/close` pour la note finale.
- Messagerie & jalons : `GET/POST /missions/{id}/messages`, `POST /missions/{id}/milestones`, `PATCH /missions/{id}/milestones/{mid}`.
- Exports : `GET /missions/{id}/export` (JSON anonymisé), `GET /missions/{id}/journal` (vagues), `GET /missions/dashboard` (KPI + escalades IA).
- Notifications : emails via `send_email_async`, WhatsApp via passerelle HTTP (`WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_SENDER`).
- Seed : si `workspace_profiles` est vide, des prestataires démo sont injectés automatiquement pour que le matching produise un Top N cohérent ; voir aussi `scripts/seed_workspace_profiles.py` pour remplir la base Mongo.

Déploiement Hetzner
-------------------

- Service systemd : `innovaplus-backend.service` (voir `apps/koryxa/backend/OPERATIONS.md`).
- Fichier `/etc/innovaplus/backend.env` : `ENABLE_SMOLLM=true`, `PROVIDER=local`, `SMOLLM_MODEL_PATH=/opt/innovaplus/models/smollm-360m-instruct`.
- FastAPI écoute sur `127.0.0.1:8000` derrière Nginx `https://api.innovaplus.africa`.

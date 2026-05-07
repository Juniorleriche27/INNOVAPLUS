KORYXA Backend API
==================

Important
---------

Ce backend n'est pas l'unique backend actif de KORYXA.

Avant de modifier une route, lire `docs/LIVE_SERVICE_OWNERSHIP.md`.

Règle actuelle de production :

- `apps/koryxa/backend` est le backend core exposé derrière `/innova/*` et `/innova/api/*`
- `services/chatlaya-service/backend` est le backend propriétaire du trafic ChatLAYA exposé derrière `/api/chatlaya/*`

Conséquence :

- ne pas corriger ChatLAYA dans ce backend si la route live est servie par `chatlaya.service`
- ne pas ajouter de nouvelles responsabilités ChatLAYA ici sans décision explicite d'architecture

API FastAPI connectée à Supabase/Postgres pour KORYXA: auth, trajectoire, entreprise, notifications et endpoints publics core de la plateforme.

Environment
-----------

Core variables (fichier `/etc/innovaplus/backend.env` en prod) :

- `DATABASE_URL`, `DB_NAME`, `JWT_SECRET`, `ALLOWED_ORIGINS`
- `FRONTEND_BASE_URL` (utilisé pour générer les CTA dans les emails/notifications)
- SMTP : `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`
- IA via API : `PROVIDER=cohere`, `COHERE_API_KEY=...` (ou `LLM_PROVIDER=cohere`)
- Notifications WhatsApp (optionnel) : `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_SENDER`
- Paiement PayDunya :
  - `PAYDUNYA_MODE=test|production`
  - `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN`
  - `BACKEND_BASE_URL=https://api.innovaplus.africa` (pour l'IPN)
  - `PAYDUNYA_CALLBACK_PATH=/paydunya/ipn`
  - `PAYDUNYA_AMOUNT_PRO_MONTHLY`, `PAYDUNYA_AMOUNT_PRO_YEARLY`
  - `PAYDUNYA_AMOUNT_TEAM_MONTHLY`, `PAYDUNYA_AMOUNT_TEAM_YEARLY`

Run locally
-----------

1. Create a virtual environment and install deps:

   python -m venv .venv
   .venv\\Scripts\\activate
   pip install -r requirements.txt

2. Ensure `DATABASE_URL` and `DB_NAME` are set in your shell or `.env`.

3. Start the server:

   uvicorn app.main:app --reload --port 8080

4. Test endpoints:

- Health: `GET http://localhost:8080/health`
- Items:
  - Create: `POST /items` with JSON `{ "title": "Test", "description": "..." }`
  - List: `GET /items`
  - Get: `GET /items/{id}`
  - Delete: `DELETE /items/{id}`

Notes
-----

- The runtime mounted by `app.main` is expected to run against Supabase/Postgres.
- Legacy Mongo-only modules may still exist in the repository, but they are not part of the main mounted path.
- Profils démo : une graine minimale est injectée automatiquement si `workspace_profiles` est vide. Pour forcer une regénération locale :

      cd apps/koryxa/backend
      . .venv/bin/activate
      python -m scripts.seed_workspace_profiles
# ci: trigger 2025-11-01T13:22:36+00:00

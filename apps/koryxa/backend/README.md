PlusBook FastAPI Backend
========================

This is a new FastAPI backend connected directly to MongoDB, intended to replace the previous Laravel API.

Environment
-----------

Core variables (fichier `/etc/innovaplus/backend.env` en prod) :

- `MONGO_URI`, `DB_NAME`, `JWT_SECRET`, `ALLOWED_ORIGINS`
- `FRONTEND_BASE_URL` (utilisé pour générer les CTA dans les emails/notifications)
- SMTP : `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`
- IA via API : `PROVIDER=cohere`, `COHERE_API_KEY=...` (ou `LLM_PROVIDER=cohere`)
- Notifications WhatsApp (optionnel) : `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_SENDER`

Run locally
-----------

1. Create a virtual environment and install deps:

   python -m venv .venv
   .venv\\Scripts\\activate
   pip install -r requirements.txt

2. Ensure `MONGO_URI` and `DB_NAME` are set in your shell or `.env`.

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

- This backend is asynchronous and uses Motor for MongoDB.
- You can now migrate real domain models/routes as needed.
- Missions / matching : `POST /innova/api/missions` (création + résumé IA), `POST /missions/{id}/waves` (matching + notifications email/WhatsApp), `GET /missions/dashboard` (KPI + escalades HF).
- Profils démo : une graine minimale est injectée automatiquement si `workspace_profiles` est vide. Pour forcer une regénération locale :

      cd apps/koryxa/backend
      . .venv/bin/activate
      python -m scripts.seed_workspace_profiles
# ci: trigger 2025-11-01T13:22:36+00:00

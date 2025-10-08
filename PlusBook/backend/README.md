PlusBook FastAPI Backend
========================

This is a new FastAPI backend connected directly to MongoDB, intended to replace the previous Laravel API.

Environment
-----------

Uses environment variables:

- `MONGO_URI` (e.g., your Atlas connection string)
- `DB_NAME` (e.g., `plusbook_db`)

By default, the app loads variables from the environment and also attempts to read:

- `PlusBook/my-app/plusbooks-fastapi/.env` (if present), and
- `PlusBook/my-app/plusbooks-api/.env` (Laravel folder) as a fallback.

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

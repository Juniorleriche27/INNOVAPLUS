# Backend Service

Structure FastAPI destinée à orchestrer le chatbot RAG et les parcours de conversion.

## Répartition

- `app/api/` : routes HTTP et WebSocket.
- `app/core/` : configuration, sécurité, dépendances globales.
- `app/models/` : modèles ORM / Pydantic pour la persistance.
- `app/schemas/` : schémas d''échange API et validations.
- `app/services/` : logique métier, marketing et paiements.
- `app/rag/` : pipelines retrieval, rerank, génération.
- `app/dependencies/` : dépendances FastAPI réutilisables.
- `scripts/ingestion/` : chargement des données vecteur.
- `scripts/maintenance/` : tâches planifiées.
- `tests/` : `unit/`, `integration/`, `e2e/`.


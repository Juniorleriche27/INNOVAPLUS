# PieAgency Chatbot Platform

PieAgency vise à construire un chatbot RAG qui renseigne les étudiants et convertit les prospects en clients tout en mettant en avant les offres internes et les partenaires.

## Architecture logique

- **Backend (FastAPI)** : orchestrateur RAG, pipelines marketing, gestion CTA & paiements.
- **Frontend (React + Vite)** : interface conversationnelle, vitrines offres et partenaires.
- **Données** : corpus marketing/FAQ, conversations nettoyées, résultats d''évaluations.
- **Infra & Ops** : Qdrant Cloud, intégrations LLM Groq/Mistral, scripts ingestion, CI/CD.

## Arborescence

- `backend/` — service FastAPI, scripts et tests.
- `frontend/` — application React orientée conversion.
- `data/` — jeux de données (`raw`, `interim`, `processed`, `external`, `tmp`).
- `knowledge/` — contenus métier destinés au RAG.
- `prompts/` — templates éditoriaux et paramètres assistant.
- `docs/` — documents produit, architecture, opérations, feuille de route.
- `evaluations/` — campagnes d''évaluation, playbooks et résultats.
- `infra/` — Docker, Terraform et monitoring.
- `ci/` — pipelines d''intégration continue.
- `notebooks/` — analyses exploratoires et prototypes RAG.

## Plan de développement

1. Collecte & structuration des données.
2. Mise en place du backend FastAPI et du RAG.
3. Intégration LLM Groq/Mistral et marketing dynamique.
4. Développement frontend et parcours de conversion.
5. Intégration paiements et CRM.
6. Ops, déploiement et observabilité.
7. Lancement, formation et amélioration continue.

## Prochaines étapes

- Documenter la stratégie de données dans `docs/product/`.
- Préparer les schémas API backend (`backend/app/schemas`).
- Définir les prompts marketing additionnels dans `prompts/`.


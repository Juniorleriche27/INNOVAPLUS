# Backend FastAPI — Phase 2

## 1. Installation minimale

Pour exécuter l’API localement sans les dépendances lourdes (tensorflow, catboost…)
créer éventuellement un fichier `requirements-api.txt` ou commenter les packages non essentiels
avant d’installer. À minima :

```bash
pip install fastapi uvicorn[standard] pyyaml pyarrow kaggle pandas
```

## 2. Lancement

Depuis la racine du projet :

```bash
uvicorn backend.main:app --reload --port 8000
```

- L’API s’expose sur `http://localhost:8000`
- La documentation interactive est disponible sur `http://localhost:8000/docs`

## 3. Endpoints disponibles

### `GET /health`
Vérifie que le service répond.

### `GET /datasets`
Retourne la liste des datasets catalogués avec nombre de lignes/colonnes, source et catégorie.

### `GET /datasets/{dataset_id}`
Retourne les métadonnées détaillées, le résumé de colonnes et un échantillon (5 lignes, issu du profil
ou du Parquet si le profil n’existe pas).

### `GET /datasets/{dataset_id}/data?limit=100`
Retourne les `limit` premières lignes du dataset traité (Parquet) au format JSON.

### `POST /predict/{model_id}`
Endpoint placeholder : renvoie un message indiquant que le moteur de prédiction n’est pas encore activé.
Permettra plus tard d’orchestrer les modèles.

## 4. Pré-requis côté données

- Lancer auparavant les scripts Phase 1 sur chaque dataset :
  ```bash
  python scripts/download_kaggle_datasets.py
  python scripts/process_datasets.py
  python scripts/profile_datasets.py
  ```
- Le catalogue `data/datasets_catalog.yml` doit être à jour.

## 5. Intégration Streamlit (à venir)

- L’interface peut requêter `http://localhost:8000/datasets` pour alimenter la page datasets.
- Ajouter une petite couche client (`streamlit_app/lib/api_client.py`) pour centraliser les appels.
- Prévoir un fallback mode offline (chargement direct via `data_catalog`) si l’API n’est pas démarrée.

## 6. Déploiement futur

- Sur Render/Cloud, prévoir :
  - Variables d’environnement pour la clé Kaggle (`KAGGLE_JSON`).
  - Commande de démarrage : `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
  - Volume ou stockage pérenne pour `data/processed/` si besoin de régénérer les datasets.

\n## 8. Modèle démo — prédiction hospital_risk\n\n- Script d'entraînement : python scripts/train_demo_model.py (génère models/hospital_risk_model.joblib).\n- Endpoint : POST /predict/hospital_risk avec ecords (liste d'objets contenant ge, severity_score, mi, length_of_stay, chronic_conditions).\n- À défaut de records, fournir dataset_id possédant ces colonnes (les 5 premières lignes seront utilisées).\n

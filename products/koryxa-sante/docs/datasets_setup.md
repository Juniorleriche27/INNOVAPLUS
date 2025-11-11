# Datasets — Phase 1 Setup

Ce document récapitule la procédure pour rapatrier les 10 datasets Kaggle utilisés par la plateforme KORYXA Santé.

## 1. Pré-requis

- Python >= 3.9
- Packages : `kaggle`, `PyYAML`
  ```bash
  pip install kaggle pyyaml
  ```
- Clés API Kaggle :
  1. Sur Kaggle, aller dans *Account* > *Create New API Token*.
  2. Placer le fichier `kaggle.json` dans `%USERPROFILE%\.kaggle\` (Windows) ou `~/.kaggle/` (Unix).
  3. Vérifier les droits `chmod 600 ~/.kaggle/kaggle.json` (Unix) si besoin.

## 2. Structure des dossiers

- `data/raw/` : fichiers bruts téléchargés (un dossier par dataset)
- `data/processed/` : destinés aux jeux de données nettoyés/convertis
- `data/datasets_catalog.yml` : liste et métadonnées des jeux de données cibles

## 3. Télécharger tous les datasets

```bash
python scripts/download_kaggle_datasets.py
```

Options disponibles :

- `--dataset-id <id>` : télécharger un dataset particulier (voir colonne `id` dans le catalogue)
- `--force` : forcer le re-téléchargement même si le dossier cible contient déjà des fichiers

## 4. Ajouter un nouveau dataset

1. Ajouter une entrée dans `data/datasets_catalog.yml` (respecter le schéma existant)
2. Relancer `python scripts/download_kaggle_datasets.py --dataset-id <nouvel_id>`

## 5. Ressources supplémentaires

- Lien Kaggle API : <https://www.kaggle.com/docs/api>
- Veillez à vérifier la licence de chaque dataset avant usage/exposition.

Prochaine étape (Phase 1) : définir les scripts de nettoyage/normalisation pour alimenter `data/processed/` et enrichir le catalogue avec les dates de mise à jour.
## 6. Traiter les datasets (conversion → processed)

Après téléchargement, générer les versions standardisées (parquet + métadonnées) :

```bash
python scripts/process_datasets.py
```

Options :
- `--dataset-id <id>` : traite uniquement le dataset ciblé
- `--force` : écrase les fichiers existants dans `data/processed/`

Chaque traitement crée :
- `data/processed/<id>/<id>.parquet`
- `data/processed/<id>/<id>.parquet.meta.json` (nombre de lignes/colonnes, noms de colonnes, fichier source)

Prochaine étape Phase 1 : enrichir ces métadonnées (profiling, statistiques) puis brancher le chargement dans l’app Streamlit.
## 7. Profiling qualité

Générer un profil basique (statistiques, échantillon) pour chaque dataset traité :

```bash
python scripts/profile_datasets.py
```

Options :
- `--dataset-id <id>` : profiler uniquement le dataset ciblé
- `--force` : écrase le fichier de profil existant (`*.parquet.profile.json`)

Ces profils (JSON) seront consommés par l’interface Streamlit.

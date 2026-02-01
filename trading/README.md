# Trading (workspace dédié)

Ce dossier sert uniquement à héberger un **projet Trading** séparé de KORYXA, sur le même serveur.

## Objectif
- Garder une séparation claire entre KORYXA et Trading.
- Déployer Trading via **Git** (pas besoin de `scp`).
- Éviter de committer des secrets et des données lourdes.

## Structure
- `trading/app/` : le code (ton projet Python, scripts, etc.)
- `trading/config/` : configuration locale au serveur (ex: `.env` réel — **non versionné**)
- `trading/data/` : datasets / artefacts lourds (ignoré par Git)
- `trading/logs/` : logs runtime (ignoré par Git)
- `trading/deploy/` : scripts de déploiement et templates

## Déploiement (serveur)
Sur le serveur (dans le repo), exécute :
- `bash trading/deploy/pull_and_sync.sh`

Ça fait :
1) `git pull`
2) copie `trading/app/` vers `/opt/innovaplus/trading/app/`
3) initialise `/opt/innovaplus/trading/{config,data,logs}` si besoin

## Recommandations (important)
- Ne commit pas de secrets : mets-les dans `/opt/innovaplus/trading/config/.env`.
- Ne commit pas de gros fichiers (parquet/csv/artefacts) : place-les dans `trading/data/` (ignoré).
- Si tu dois versionner un modèle, utilise Git LFS ou une storage externe.


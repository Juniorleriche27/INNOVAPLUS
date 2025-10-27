INNOVAPLUS Backend Operations
=============================

Service Overview
----------------
- Canonical systemd unit: `innovaplus-backend.service` (utiliser ce nom partout).
- Application FastAPI servie par Gunicorn/Uvicorn sur `127.0.0.1:8000`.
- Fichier d'environnement: `/etc/innovaplus/backend.env` (`root:innova`, mode `640`).
- Variables indispensables: `ENV=production`, `PORT=8000`, `MONGO_URI`, `DB_NAME=innova_db`,
  `ALLOWED_ORIGINS=https://innovaplus.africa,https://www.innovaplus.africa`.
- Authentification HTTP: cookie `innova_session` (HTTPOnly, Secure, SameSite=Lax) valide 7 jours.

MongoDB
-------
- Mongo tourne en local (Docker) sur `127.0.0.1:27017`.
- Base principale: `innova_db`; utilisateur applicatif: `appuser` (role `dbOwner`).
- Test manuel: `mongosh "mongodb://appuser:***@127.0.0.1:27017/innova_db?authSource=innova_db" --eval 'db.runCommand({ ping: 1 })'`.
- Sauvegarde ponctuelle: `mongodump --uri "$MONGO_URI" --db innova_db --out /var/backups/innova-$(date +%F)`.

Reverse Proxy & TLS
-------------------
- Nginx: `/etc/nginx/sites-available/innovaplus-api` (lien dans `sites-enabled`).
- Endpoint public: `https://api.innovaplus.africa` (HTTP redirigé vers HTTPS).
- Certificats Let's Encrypt via `certbot`; renouvellement systemd timer actif.

Firewall
--------
- UFW actif avec uniquement les ports `22`, `80`, `443` ouverts (IPv4/IPv6). Le backend reste accessible en local.

Authentification & Sessions
---------------------------
- Inscriptions / connexions sur `/auth/register` et `/auth/login`.
- À la connexion, un cookie `innova_session` est posé (HTTPOnly, Secure, Lax) avec un TTL de 7 jours.
- Les sessions sont persistées dans `sessions` (hash SHA-256 du token, TTL automatique sur `expires_at`).
- Déconnexion: `/auth/logout` révoque la session et supprime le cookie.
- Endpoint `/auth/me` renvoie l'utilisateur courant si le cookie est valide.

Mot de passe oublié
-------------------
- Endpoint `/auth/forgot` génère un token à usage unique stocké dans `password_reset_tokens`
  (hashé, TTL 30 min, flag `used`).
- Un email est envoyé via SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_USE_TLS`).
- Le front consomme `https://innovaplus.africa/reset?token=...&email=...`.
- Endpoint `/auth/reset` met à jour le hash (`password_hash`), marque le token comme utilisé et révoque toutes les sessions actives.

Chatlaya (copilote)
-------------------
- Nouvelles routes `/chatlaya/*`:
  - `POST /chatlaya/session` : récupère ou crée la conversation active.
  - `GET /chatlaya/conversations` : liste paginée des conversations.
  - `GET /chatlaya/messages?conversation_id=...` : messages historiques.
  - `POST /chatlaya/message` : streaming SSE (`event: token`, `event: done`).
- Messages persistés dans la collection `messages` (`conversation_id`, `user_id`, `role`, `content`, `created_at`).
- Conversations dans `conversations` (`user_id`, `title`, `created_at`, `updated_at`, `archived`).

CI/CD Workflow
--------------
- Fichier GitHub Actions: `.github/workflows/deploy-backend.yml`.
- Déclenchement: push sur `main` touchant `INNOVAPLUS/INNOVA/backend/**` ou dispatch manuel.
- Étapes principales : checkout → clé SSH → rsync du dossier `backend/` → bootstrap `.venv` → `pip install -r requirements.txt`
  → restart `innovaplus-backend.service` → sondage `https://api.innovaplus.africa/health` (attend `status=mongo=ok`).
- En cas d'échec santé, les 200 dernières lignes `journalctl` sont renvoyées dans les logs du job.

Runbook
-------
- Santé: `curl -sS https://api.innovaplus.africa/health | jq .` (attendu : `status="ok"`, `mongo="ok"`).
- Service: `sudo systemctl status innovaplus-backend.service --no-pager`.
- Logs live: `journalctl -u innovaplus-backend.service -f`.
- Redéploiement manuel: push sur `main` ou `sudo systemctl restart innovaplus-backend.service`.
- Modifier l'env: `sudo nano /etc/innovaplus/backend.env` puis restart du service.
- Certificat: `sudo certbot renew --dry-run`.

Monitoring (optionnel)
----------------------
- Prévu : endpoint FastAPI `/m
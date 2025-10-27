INNOVAPLUS Backend Operations
=============================

Service Overview
----------------
- Canonical systemd unit: `innovaplus-backend.service` (keep this exact name).
- Gunicorn with Uvicorn workers listens on `127.0.0.1:8000`.
- Runtime env file: `/etc/innovaplus/backend.env` (`root:innova`, mode `640`).
- Required variables include `ENV=production`, `PORT=8000`, `MONGO_URI`, `DB_NAME=innova_db`,
  and `ALLOWED_ORIGINS=https://innovaplus.africa,https://www.innovaplus.africa`.
- Secrets and `.env` files must stay off the repository (store only on the server or in GitHub Secrets).

MongoDB
-------
- Local Docker container bound to `127.0.0.1:27017`.
- Database: `innova_db`; user: `appuser` (`dbOwner`) with a strong password.
- Smoke test:  
  `mongosh "mongodb://appuser:***@127.0.0.1:27017/innova_db?authSource=innova_db" --eval 'db.runCommand({ ping: 1 })'`.
- Manual backup target directory: `/var/backups/innova`.

Reverse Proxy & TLS
-------------------
- Nginx vhost: `/etc/nginx/sites-available/innovaplus-api` (symlinked in `sites-enabled`).
- Public endpoint: `https://api.innovaplus.africa` (HTTP redirected to HTTPS).
- Certificates handled by Let's Encrypt (`certbot`), renewal timer active.

Firewall
--------
- UFW enabled with only ports `22`, `80`, `443` opened (IPv4/IPv6); backend stays on loopback.

Health Endpoint
---------------
- Public health URL: `https://api.innovaplus.africa/health`.
- Expected JSON: `"status": "ok"` and `"mongo": "ok"`; other fields (db, vector_index, etc.) are informative.
- Manual verification:  
  `curl -sS https://api.innovaplus.africa/health | jq '{status, mongo, db, version}'`.

CI/CD Workflow
--------------
- Workflow file: `.github/workflows/deploy-backend.yml`.
- Trigger: push to `main` touching `INNOVAPLUS/INNOVA/backend/**` or manual dispatch.
- Execution steps:
  1. Checkout code.
  2. Provision SSH key and ensure the remote deploy directory exists.
  3. `rsync` only `INNOVAPLUS/INNOVA/backend/` to `${DEPLOY_PATH}` on the server.
  4. Bootstrap/update `${DEPLOY_PATH}/.venv` and install `backend/requirements.txt`.
  5. `sudo systemctl restart innovaplus-backend.service` then confirm the unit is active.
  6. Poll `https://api.innovaplus.africa/health` until both `status` and `mongo` equal `"ok"`.
     On failure the workflow streams the latest 200 lines from `journalctl -u innovaplus-backend.service`.
- Outcome: a successful push on `main` redeploys without manual intervention.

Runbook
-------
- Check health: `curl -sS https://api.innovaplus.africa/health | jq .`.
- Service status: `sudo systemctl status innovaplus-backend.service --no-pager`.
- Live logs: `journalctl -u innovaplus-backend.service -f`.
- Manual restart: `sudo systemctl restart innovaplus-backend.service`.
- Edit env vars: `sudo nano /etc/innovaplus/backend.env` then restart the service.
- Certbot dry run: `sudo certbot renew --dry-run`.

Monitoring (optional)
---------------------
- Status: not enabled yet. Planned endpoints:
  - FastAPI `/metrics` (Prometheus format). Restrict access to admin IPs or private network.
  - Nginx `stub_status` exposed via a locked-down location block.
- Document access rules and authentication before enabling either endpoint.

Mongo Backups (optional)
------------------------
- Status: manual backup only.
- Suggested automation:
  - Nightly cron on the server running  
    `mongodump --uri "$MONGO_URI" --db innova_db --out /var/backups/innova-$(date +%F)`.
  - Rotate to keep the 7 most recent directories (e.g., via `find /var/backups/innova-* -maxdepth 0 -mtime +7 -exec rm -rf {} \;`).
- Restoring from a dump:  
  `mongorestore --uri "$MONGO_URI" --db innova_db /var/backups/innova-YYYY-MM-DD/innova_db`.

Backups & Operations
====================

MongoDB Atlas backup (daily)
----------------------------
1. Enable daily snapshots in Atlas (Project → Backups → Continuous or Snapshot) with min 7 days retention.
2. Verify restore by creating a temporary cluster from snapshot monthly.

Manual dump
-----------
```
mongodump --uri "$MONGODB_URI" --db "$DB_NAME" --out backups/$(date +%F)
```

Restore
-------
```
mongorestore --uri "$MONGODB_URI" --db "$DB_NAME" backups/DATE/$DB_NAME
```

Health & Logs
-------------
- GET /health returns DB ping, uptime and missing env keys.
- Set env: LLM_TIMEOUT (seconds), RATE_LIMIT_RPM_PUBLIC.
- Errors are logged with structured message (include route and payload hash only, no PII).


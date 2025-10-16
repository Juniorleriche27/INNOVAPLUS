# Pack Render CHATLAYA (CPU)

Start Command (Render)

bash bin/prestart.sh && uvicorn app.main:app --host 0.0.0.0 --port $PORT

Variables d’environnement (Render)

MODEL_DIR=/var/models/chatlaya

MODEL_FILE=chatlaya-smollm-1.7b-q4_k_m.gguf

HF_FILE_URL=https://huggingface.co/<TON_USER>/<REPO>/resolve/main/chatlaya-smollm-1.7b-q4_k_m.gguf

(optionnel) N_THREADS=6, N_CTX=2048

Persistent Disk : monter un disque sur /var/models pour conserver le GGUF.

Tests après déploiement :

curl -sS https://<service>.onrender.com/healthz
curl -sS -X POST https://<service>.onrender.com/chatlaya/complete \
  -H "Content-Type: application/json" \
  -d '{"user":"Propose un plan en 4 étapes pour lancer AKPAN-VITAL.","max_new_tokens":180}'

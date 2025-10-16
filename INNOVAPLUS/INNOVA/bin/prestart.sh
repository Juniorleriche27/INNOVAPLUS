#!/usr/bin/env bash
set -e

: "${MODEL_DIR:=/var/models/chatlaya}"
: "${MODEL_FILE:=chatlaya-smollm-1.7b-q4_k_m.gguf}"
: "${HF_FILE_URL:=}"  # ex: https://huggingface.co/<user>/<repo>/resolve/main/chatlaya-smollm-1.7b-q4_k_m.gguf
: "${S3_URI:=}"       # ex: s3://bucket/path/chatlaya-smollm-1.7b-q4_k_m.gguf

mkdir -p "$MODEL_DIR"

if [ ! -f "$MODEL_DIR/$MODEL_FILE" ]; then
  echo "[prestart] Téléchargement du modèle manquant..."
  if [ -n "$HF_FILE_URL" ]; then
    curl -L "$HF_FILE_URL" -o "$MODEL_DIR/$MODEL_FILE"
  elif [ -n "$S3_URI" ]; then
    aws s3 cp "$S3_URI" "$MODEL_DIR/$MODEL_FILE"
  else
    echo "[prestart] ERREUR: définir HF_FILE_URL ou S3_URI"
    exit 1
  fi
fi

echo "[prestart] Modèle prêt: $MODEL_DIR/$MODEL_FILE"


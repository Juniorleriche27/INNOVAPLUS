# SmolLM-360M-Instruct Integration

This document explains how the 360M instruct model is wired inside the INNOVA+ backend.
The goal is to keep everything local while staying light enough to run comfortably on the
Hetzner instance.

## Model Layout

Download the weights from Hugging Face (for example with `huggingface-cli` or `curl`) and
place them under `INNOVAPLUS/INNOVA/backend/models/smollm-360m-instruct/`.

Expected files:

- `config.json`
- `generation_config.json`
- `merges.txt`
- `special_tokens_map.json`
- `tokenizer.json`
- `tokenizer_config.json`
- `model.safetensors` (~610 MB)

The repository keeps the directory ignored in `.gitignore`, so only the server needs the
actual weights.

## Environment Variables

```
ENABLE_SMOLLM=true
PROVIDER=local
SMOLLM_MODEL_PATH=models/smollm-360m-instruct
```

`SMOLLM_MODEL_PATH` accepts absolute paths as well; the loader resolves relative values
from the backend root.

## Dependencies

`backend/requirements.txt` already bundles the required libraries:

```
accelerate>=0.25.0
huggingface_hub>=0.35.0
safetensors>=0.4.0
torch>=2.0.0
transformers>=4.40.0
```

Create or update the virtual environment and install the dependencies as usual:

```
python -m venv .venv
source .venv/bin/activate  # PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## API Endpoints

Exposed under `/innova/api/smollm/*`:

- `POST /smollm/chat` – chat completion wrapper around the local model.
- `POST /smollm/generate` – raw text generation helper.
- `GET /smollm/info` – returns device and metadata.
- `POST /smollm/health` – lightweight readiness probe.

Sample chat payload:

```json
{
  "messages": [
    {"role": "user", "content": "Bonjour, que peux-tu faire pour INNOVA+ ?"}
  ],
  "max_tokens": 512,
  "temperature": 0.7
}
```

Sample response:

```json
{
  "response": "Bonjour ! Je peux analyser vos besoins et proposer des actions...",
  "model_info": {
    "model_name": "SmolLM-360M-Instruct",
    "device": "cpu",
    "parameters": 360000000
  }
}
```

## Using the Model in Code

```python
from app.core.smollm import get_smollm_model

model = get_smollm_model()
response = model.chat_completion(
    messages=[{"role": "user", "content": "Bonjour"}],
    max_tokens=256,
)
```

## Performance Notes

- Parameter count: ~360M (~610 MB on disk).
- CPU friendly: works on the Hetzner CX/RX range without GPU.
- VRAM/RAM usage: ~1.5 GB resident with default settings.
- Latency: first request may take a few seconds (model load), subsequent ones are faster.

## Deployment on Hetzner

1. Copy the model directory to `/opt/innovaplus/models/smollm-360m-instruct/` (or any
   location owned by the `innova` user). The backend now auto-detects this path and
   re-creates a symlink inside `INNOVAPLUS/INNOVA/backend/models/` so redeploying the
   repository will not delete the weights.
2. (Optional) keep `/etc/innovaplus/backend.env` with:
   - `ENABLE_SMOLLM=true`
   - `PROVIDER=local`
   - `SMOLLM_MODEL_PATH=/opt/innovaplus/models/smollm-360m-instruct` *(the loader will
     fall back to this location automatically if the variable points elsewhere)*
3. (Optionnel) pour charger un adapter LoRA, positionner `SMOLLM_ADAPTER_PATH` vers le dossier
   produit par le script `scripts/finetune_smollm_lora.py`. Au démarrage, le backend fusionne
   automatiquement l’adapter.
4. Reload the service:

```
sudo systemctl daemon-reload
sudo systemctl restart innovaplus-backend.service
```

The FastAPI layer streams tokens through `/chatlaya/message`, so no additional llama.cpp
process is required.

## Monitoring

```
curl -s http://127.0.0.1:8000/innova/api/smollm/health | jq .
```

Logs remain available through `journalctl -u innovaplus-backend.service -f`.

## Troubleshooting

- `FileNotFoundError`: verify `SMOLLM_MODEL_PATH` and that the directory contains all
  expected files.
- `torch.cuda.OutOfMemoryError`: the code automatically falls back to CPU; ensure no
  leftover CUDA env variables force GPU mode.
- Empty answers: check the application logs; the router falls back to the echo provider
  when SmolLM raises an exception.

## References

- https://huggingface.co/HuggingFaceTB/SmolLM-360M-Instruct
- https://huggingface.co/docs/transformers/

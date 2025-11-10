# Local LLM (Llama-3.2-3B-Instruct 4-bit)

This document explains how the local LLM integration is wired inside the KORYXA backend
when we use the **Llama-3.2-3B-Instruct** model quantized in 4 bits (GGUF).  
The goal is to keep everything local while staying light enough to run comfortably on the
Hetzner instance without GPU.

## Model Layout

Download the GGUF file from Hugging Face (for example `TheBloke/Llama-3.2-3B-Instruct-GGUF`)
and place it under `INNOVAPLUS/INNOVA/backend/models/`.

Recommended placement:

- `INNOVAPLUS/INNOVA/backend/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf`

You can choose any other GGUF quantization variant if you prefer a different balance
between memory footprint and quality (e.g. `Q4_0`, `Q4_K_S`, ...). The path is ignored by
Git so only the server needs the file.

## Environment Variables

```
ENABLE_SMOLLM=true
PROVIDER=local
SMOLLM_MODEL_PATH=models/Llama-3.2-3B-Instruct-Q4_K_M.gguf
```

`SMOLLM_MODEL_PATH` accepts absolute paths as well; the loader resolves relative values
from the backend root. When the path ends with `.gguf`, the backend automatically switches
to the llama.cpp backend for inference.

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
    {"role": "user", "content": "Bonjour, que peux-tu faire pour KORYXA ?"}
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
    "model_name": "Llama-3.2-3B-Instruct-Q4_K_M",
    "device": "cpu",
    "parameters": 1500000000
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

- Parameter count: ~3B (quantized to ~3.6 GB in Q4_K_M).
- CPU friendly: thanks to the 4-bit quantization it runs on the Hetzner CX/RX range.
- RAM usage: ~4 GB resident with default settings (plan accordingly).
- Latency: first request loads the GGUF into memory; subsequent requests stream tokens promptly.

## Deployment on Hetzner

1. Copy the GGUF file to `/opt/innovaplus/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf`
   (or any location owned by the `innova` user).
2. Update `/etc/innovaplus/backend.env` with:
   - `ENABLE_SMOLLM=true`
   - `PROVIDER=local`
   - `SMOLLM_MODEL_PATH=/opt/innovaplus/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf`
3. Reload the service:

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

- https://huggingface.co/TheBloke/Llama-3.2-3B-Instruct-GGUF
- https://github.com/ggerganov/llama.cpp

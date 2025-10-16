from fastapi import APIRouter
from pydantic import BaseModel
from llama_cpp import Llama
import os
from app.prompts import SYSTEM_PROMPT

router = APIRouter(prefix="/chatlaya", tags=["chatlaya"])

MODEL_DIR = os.getenv("MODEL_DIR", "/var/models/chatlaya")
MODEL_FILE = os.getenv("MODEL_FILE", "chatlaya-smollm-1.7b-q4_k_m.gguf")
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_FILE)

# Chargement unique du modèle
llm = Llama(
    model_path=MODEL_PATH,
    n_threads=int(os.getenv("N_THREADS", "6")),
    n_ctx=int(os.getenv("N_CTX", "2048")),
    verbose=False,
)


class ChatIn(BaseModel):
    user: str
    max_new_tokens: int = 256
    temperature: float = 0.7
    top_p: float = 0.9


@router.post("/complete")
def complete(inp: ChatIn):
    prompt = f"[SYSTEM]\n{SYSTEM_PROMPT}\n\n[USER]\n{inp.user}\n\n[ASSISTANT]\n"
    out = llm.create_completion(
        prompt=prompt,
        max_tokens=inp.max_new_tokens,
        temperature=inp.temperature,
        top_p=inp.top_p,
    )
    return {"text": out["choices"][0]["text"].strip()}


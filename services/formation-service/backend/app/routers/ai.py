import json
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.database import supabase
from app.middleware.auth import get_current_user
from app.services.llm import generate_text

router = APIRouter()

CONTENT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "content")

SYSTEM_PROMPT = """Tu es un assistant pédagogique expert pour la formation "Analyse de Données avec Python" de KORYXA Tech Store.
Tu aides des étudiants débutants à comprendre Python, NumPy, Pandas, Matplotlib et la data analyse.
Réponds toujours en français, de façon claire, simple et encourageante.
Utilise des exemples concrets. Si tu donnes du code, garde-le minimal et commenté.
Ne réponds qu'aux questions liées à la formation ou à la data science."""


def load_notebook_text(module_id: str, max_chars: int = 8000) -> str:
    """Charge le contenu textuel du notebook pour le contexte RAG."""
    result = supabase.table("modules").select("notebook_path, title").eq("id", module_id).single().execute()
    if not result.data or not result.data.get("notebook_path"):
        return ""
    path = os.path.join(CONTENT_DIR, result.data["notebook_path"])
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8") as f:
        nb = json.load(f)
    parts = []
    for cell in nb.get("cells", []):
        source = "".join(cell.get("source", []))
        if source.strip():
            parts.append(source)
    return "\n\n".join(parts)[:max_chars]


# ── A. ASSISTANT PÉDAGOGIQUE ────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    message: str

class ChatRequest(BaseModel):
    module_id: str
    question: str
    history: list[ChatMessage] = []

@router.post("/chat")
def chat(req: ChatRequest, user=Depends(get_current_user)):
    context = load_notebook_text(req.module_id)

    system = SYSTEM_PROMPT
    if context:
        system += f"\n\nContenu du module actuel (utilise-le comme référence):\n---\n{context}\n---"

    history_lines = []
    for msg in req.history[-10:]:
        role = "Assistant" if msg.role == "assistant" else "Utilisateur"
        history_lines.append(f"{role}: {msg.message}")

    prompt = system
    if history_lines:
        prompt += "\n\nHistorique récent:\n" + "\n".join(history_lines)
    prompt += f"\n\nQuestion actuelle:\n{req.question}\n\nRéponse pédagogique:"

    answer = generate_text(prompt, max_tokens=500, temperature=0.4)
    return {"answer": answer}


# ── B. EXPLICATION DE CODE ──────────────────────────────────────────────────

class ExplainRequest(BaseModel):
    code: str
    module_title: Optional[str] = ""

@router.post("/explain")
def explain_code(req: ExplainRequest, user=Depends(get_current_user)):
    prompt = f"""Tu es un professeur Python bienveillant. Explique le code suivant à un débutant complet, en français.
Sois simple, clair, et explique chaque ligne importante. Maximum 200 mots.
{f"Contexte : ce code vient du module '{req.module_title}'." if req.module_title else ""}

Code à expliquer:
```python
{req.code[:3000]}
```

Explication:"""

    explanation = generate_text(prompt, max_tokens=400, temperature=0.3)
    return {"explanation": explanation}


# ── C. QUIZ GÉNÉRATIF ───────────────────────────────────────────────────────

class QuizRequest(BaseModel):
    module_id: str

@router.post("/quiz")
def generate_quiz(req: QuizRequest, user=Depends(get_current_user)):
    context = load_notebook_text(req.module_id, max_chars=6000)

    if not context:
        raise HTTPException(status_code=404, detail="Contenu du module introuvable.")

    prompt = f"""Tu es un créateur de quiz pédagogique. Génère exactement 5 questions QCM en français basées sur ce contenu de cours Python.

Contenu du cours:
---
{context}
---

Génère un JSON valide UNIQUEMENT, sans texte avant ou après, avec ce format exact:
{{
  "questions": [
    {{
      "question": "La question ici ?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "answer": "A"
    }}
  ]
}}

Les questions doivent tester la compréhension réelle. La bonne réponse doit être dans "answer" (A, B, C ou D).
JSON:"""

    raw = generate_text(prompt, max_tokens=1200, temperature=0.2)
    # Extraire le JSON même si du texte parasite est présent
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    if start == -1 or end == 0:
        raise HTTPException(status_code=500, detail="Impossible de générer le quiz.")

    try:
        quiz = json.loads(raw[start:end])
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Format de quiz invalide.")

    return quiz

from __future__ import annotations

import json
from typing import Optional

import cohere
import httpx
from fastapi import HTTPException

from app.config import settings


def _resolve_provider() -> str:
    provider = (settings.CHAT_PROVIDER or settings.LLM_PROVIDER or "cohere").strip().lower()
    if provider in {"gateway", "koryxa_gateway"}:
        return "ai_gateway"
    return provider or "cohere"


def _resolve_model() -> str:
    return (settings.CHAT_MODEL or settings.LLM_MODEL or "").strip()


def _call_ai_gateway(prompt: str, *, max_tokens: Optional[int] = None, temperature: float = 0.3) -> str:
    base_url = (settings.AI_GATEWAY_BASE_URL or "").rstrip("/")
    api_key = (settings.AI_GATEWAY_API_KEY or "").strip()

    if not base_url:
        raise HTTPException(status_code=503, detail="AI gateway non configuré.")
    if not api_key:
        raise HTTPException(status_code=503, detail="Clé AI gateway non configurée.")

    payload = {
        "messages": [
            {
                "role": "user",
                "content": prompt,
            }
        ],
        "temperature": temperature,
        "max_tokens": max_tokens or settings.LLM_MAX_NEW_TOKENS,
    }

    try:
        with httpx.Client(timeout=settings.AI_GATEWAY_TIMEOUT_SECONDS) as client:
            response = client.post(
                f"{base_url}/v1/chat",
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "X-API-Key": api_key,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        body = exc.response.text[:500]
        raise HTTPException(status_code=502, detail=f"AI gateway HTTP {exc.response.status_code}: {body}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"AI gateway indisponible: {exc}") from exc

    try:
        parsed = response.json()
    except ValueError:
        return response.text.strip()

    text = parsed.get("response") or parsed.get("text") or parsed.get("content") or ""
    if not text and isinstance(parsed.get("choices"), list) and parsed["choices"]:
        first = parsed["choices"][0]
        if isinstance(first, dict):
            message = first.get("message") or {}
            text = message.get("content") or first.get("text") or ""

    final = str(text).strip()
    if not final:
        raise HTTPException(status_code=502, detail="Réponse AI gateway vide.")
    return final


def _call_cohere(prompt: str, *, max_tokens: Optional[int] = None, temperature: float = 0.3) -> str:
    if not settings.COHERE_API_KEY:
        raise HTTPException(status_code=503, detail="Clé API Cohere non configurée.")

    client = cohere.Client(settings.COHERE_API_KEY)
    model = _resolve_model() or "command-r"

    try:
        response = client.generate(
            model=model,
            prompt=prompt,
            max_tokens=max_tokens or settings.LLM_MAX_NEW_TOKENS,
            temperature=temperature,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Cohere indisponible: {exc}") from exc

    generations = getattr(response, "generations", None) or []
    if not generations:
        raise HTTPException(status_code=502, detail="Réponse Cohere vide.")
    return generations[0].text.strip()


def generate_text(prompt: str, *, max_tokens: Optional[int] = None, temperature: float = 0.3) -> str:
    provider = _resolve_provider()
    if provider == "ai_gateway":
        return _call_ai_gateway(prompt, max_tokens=max_tokens, temperature=temperature)
    if provider == "cohere":
        return _call_cohere(prompt, max_tokens=max_tokens, temperature=temperature)
    raise HTTPException(status_code=503, detail=f"Provider IA non supporté: {provider}")

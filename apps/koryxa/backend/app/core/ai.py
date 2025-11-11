from __future__ import annotations

import hashlib
from typing import List, Sequence, Optional, Dict, Any, Callable

import logging

from app.core.config import settings

try:
    from app.prompts import SYSTEM_PROMPT  # type: ignore
except ImportError:
    SYSTEM_PROMPT = (
        "Tu es CHATLAYA, copilote IA d'KORYXA. Réponds en français clair, "
        "en tenant compte du contexte utilisateur et en restant factuel."
    )
    logging.getLogger(__name__).warning("app.prompts absent: fallback SYSTEM_PROMPT loaded.")

logger = logging.getLogger(__name__)
FALLBACK_REPLY = "Je rencontre un problème technique pour le moment. Merci de réessayer plus tard."


def _hash_to_float32(seed: bytes) -> float:
    h = int.from_bytes(seed[:8], byteorder="big", signed=False)
    return (h % 2_000_000) / 1_000_000.0 - 1.0


_cohere_client = None


def _get_cohere_client():
    global _cohere_client
    if _cohere_client is None:
        try:
            import cohere  # type: ignore

            if not settings.COHERE_API_KEY:
                raise RuntimeError("Missing COHERE_API_KEY")
            _cohere_client = cohere.Client(api_key=settings.COHERE_API_KEY)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Cohere client init failed: %s", exc)
            _cohere_client = False
    return _cohere_client


def embed_texts(texts: Sequence[str], dim: int | None = None) -> List[List[float]]:
    client = None
    if (settings.LLM_PROVIDER or "").lower() == "cohere":
        client = _get_cohere_client()
    if client:
        try:
            model = settings.EMBED_MODEL or "embed-multilingual-v3.0"
            resp = client.embed(texts=list(texts), model=model, input_type="search_query")
            return [list(map(float, vector)) for vector in resp.embeddings]
        except Exception as exc:  # noqa: BLE001
            logger.warning("Cohere embed failed, falling back to stub: %s", exc)
    dimension = dim or settings.EMBED_DIM
    vectors: List[List[float]] = []
    for text in texts:
        base = hashlib.sha256(text.encode("utf-8")).digest()
        vector: List[float] = []
        chunk = base
        i = 0
        while len(vector) < dimension:
            if i % len(base) == 0:
                chunk = hashlib.sha256(chunk).digest()
            vector.append(_hash_to_float32(chunk[i % len(chunk):] + i.to_bytes(2, "big")))
            i += 1
        vectors.append(vector)
    return vectors


def generate_answer(
    prompt: str,
    provider: str | None = None,
    model: str | None = None,
    timeout: int | None = None,
    history: Optional[List[dict[str, str]]] = None,
    context: str | None = None,
    rag_sources: Optional[List[Dict[str, Any]]] = None,
    on_token: Optional[Callable[[str], None]] = None,
) -> str:
    provider_name = (provider or settings.CHAT_PROVIDER or settings.LLM_PROVIDER or "echo").lower()
    effective_prompt = prompt or (history[-1]["content"] if history else "")
    logger.debug(
        "generate_answer provider=%s history=%d snippet=%r",
        provider_name,
        len(history or []),
        effective_prompt[:80],
    )

    if provider_name in {"local", "smollm", "chatlaya"}:
        try:
            from app.core.smollm import get_smollm_model

            conversation = list(history or [])
            if not conversation:
                conversation = [{"role": "user", "content": effective_prompt}]
            system_prompt = SYSTEM_PROMPT
            if context:
                system_prompt = f"{SYSTEM_PROMPT}\n\n{context}"
            if conversation[0].get("role") == "system":
                conversation[0]["content"] = f"{system_prompt}\n\n{conversation[0].get('content','')}"
            else:
                conversation.insert(0, {"role": "system", "content": system_prompt})
            smollm = get_smollm_model()
            configured_max = settings.CHAT_MAX_NEW_TOKENS or 320
            max_tokens = max(64, min(configured_max, 768))
            if on_token and getattr(smollm, "chat_completion_stream", None):
                response = smollm.chat_completion_stream(
                    conversation,
                    max_tokens=max_tokens,
                    temperature=0.7,
                    top_p=0.9,
                    repeat_penalty=1.05,
                    stop_tokens=["</s>", "<|im_end|>", "###"],
                    ignore_eos=True,
                    on_token=on_token,
                )
            else:
                response = smollm.chat_completion(
                    conversation,
                    max_tokens=max_tokens,
                    temperature=0.7,
                    top_p=0.9,
                    repeat_penalty=1.05,
                    stop_tokens=["</s>", "<|im_end|>", "###"],
                    ignore_eos=True,
                )
            cleaned = response.strip()
            logger.debug(
                "SmolLM returned len=%d snippet=%r",
                len(cleaned),
                cleaned[:120],
            )
            if cleaned:
                if on_token and not getattr(smollm, "chat_completion_stream", None):
                    on_token(cleaned)
                return cleaned
            logger.debug("SmolLM empty response, returning fallback reply.")
            return FALLBACK_REPLY
        except Exception as exc:  # noqa: BLE001
            logger.warning("Local provider failed, returning fallback reply: %s", exc)
            return FALLBACK_REPLY

    if provider_name == "cohere":
        client = _get_cohere_client()
        if client:
            try:
                mdl = model or settings.LLM_MODEL or "command-r"
                last_user = effective_prompt
                if history:
                    last_user = next((msg["content"] for msg in reversed(history) if msg.get("role") == "user"), effective_prompt)
                resp = client.chat(model=mdl, message=last_user)
                text = getattr(resp, "text", None) or str(resp)
                if text and on_token:
                    on_token(text)
                return text
            except Exception as exc:  # noqa: BLE001
                logger.warning("Cohere chat failed, falling back to echo: %s", exc)

    if provider_name == "echo":
        if on_token:
            on_token(effective_prompt)
        return effective_prompt

    if provider_name in {"openai", "mistral"}:
        logger.warning("Provider '%s' not configured. Falling back to echo.", provider_name)
        if on_token:
            on_token(effective_prompt)
        return effective_prompt

    logger.debug("Returning fallback reply for provider=%s", provider_name)
    if on_token:
        on_token(FALLBACK_REPLY)
    return FALLBACK_REPLY


def detect_embed_dim() -> int:
    try:
        vector = embed_texts(["dimension_probe"], dim=None)[0]
        return len(vector)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to detect embed dim automatically: %s", exc)
        return settings.EMBED_DIM

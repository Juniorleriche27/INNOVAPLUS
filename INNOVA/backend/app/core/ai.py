from __future__ import annotations

import hashlib
from typing import List, Sequence, Optional, Dict, Any

import logging

from app.core.config import settings
from pathlib import Path
import os
import unicodedata
import json

try:
    from app.prompts import SYSTEM_PROMPT  # type: ignore
except ImportError:
    SYSTEM_PROMPT = (
        "Tu es CHATLAYA, copilote IA d'INNOVA+. Réponds en français clair, "
        "en tenant compte du contexte utilisateur et en restant factuel."
    )
    logging.getLogger(__name__).warning("app.prompts absent: fallback SYSTEM_PROMPT loaded.")

logger = logging.getLogger(__name__)
FALLBACK_REPLY = "Je rencontre un problème technique pour le moment. Merci de réessayer plus tard."
FORMAT_PROMPT = (
    "Respecte strictement ce format:\n"
    "1) Resume bref (1-2 phrases)\n"
    "2) Reponse detaillee (5-8 lignes, concret)\n"
    "3) Pistes d'action (3 puces max, phrase d'intro)\n"
    "4) KPIs (1-3) si utiles\n"
    "5) Risques/limites (1-2) si utiles\n"
    "Longueur cible: 8-12 lignes. Pas de phrases vides."
)
LENGTH_GUARD = (
    'Exigence: la reponse finale doit contenir au moins 8 lignes '
    'et la section "Pistes d\'action" en 3 puces max.'
)


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


_faq_lookup: Dict[str, str] | None = None


def _normalize_question(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    normalized = "".join(
        ch for ch in normalized if unicodedata.category(ch)[0] != "M"
    )
    normalized = "".join(ch if ch.isalnum() else " " for ch in normalized)
    return " ".join(normalized.lower().split())


def _load_faq_lookup() -> Dict[str, str]:
    global _faq_lookup
    if _faq_lookup is not None:
        return _faq_lookup

    dataset_path = os.getenv("FAQ_DATASET_PATH", "/opt/innovaplus/datasets/ntci_faq.jsonl")
    lookup: Dict[str, str] = {}
    path = Path(dataset_path)
    if path.is_file():
        try:
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                except json.JSONDecodeError:
                    continue
                question = (
                    (item.get("question") or item.get("prompt") or "").strip()
                )
                answer = (
                    (item.get("answer") or item.get("response") or "").strip()
                )
                if question and answer:
                    lookup[_normalize_question(question)] = answer
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to load FAQ dataset from %s: %s", path, exc)
    else:
        logger.info("FAQ dataset not found at %s; lookup disabled.", path)
    _faq_lookup = lookup
    return lookup


def _format_structured_answer(answer: str) -> str:
    summary = answer
    detailed = (
        f"{answer} Cela permet de sécuriser les engagements commerciaux, "
        "d'éviter les litiges répétés et de protéger la réputation de l'entreprise."
    )
    bullets = [
        "Identifier les clauses ou pratiques à corriger et planifier leur mise à jour.",
        "Aligner les équipes concernées sur les nouvelles règles pour standardiser les processus.",
        "Suivre l'application des ajustements pour vérifier qu'ils réduisent les litiges."
    ]
    bullet_text = "\n".join(f"- {item}" for item in bullets)
    return (
        "**Résumé bref**\n"
        f"{summary}\n\n"
        "**Réponse détaillée**\n"
        f"{detailed}\n\n"
        "**Pistes d'action ou prochaines étapes**\n"
        f"{bullet_text}"
    )


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


def _render_context(context: str | None, rag_sources: Optional[List[Dict[str, Any]]]) -> str:
    if context and context.strip():
        return context.strip()
    if rag_sources:
        lines: List[str] = []
        for idx, chunk in enumerate(rag_sources, start=1):
            text = str(chunk.get("text") or "").strip()
            if not text:
                continue
            lines.append(f"- [{idx}] {text[:600]}")
        if lines:
            return "\n".join(lines)
    return "- Aucun extrait pertinent fourni."


def generate_answer(
    prompt: str,
    provider: str | None = None,
    model: str | None = None,
    timeout: int | None = None,
    history: Optional[List[dict[str, str]]] = None,
    context: str | None = None,
    rag_sources: Optional[List[Dict[str, Any]]] = None,
) -> str:
    provider_name = (provider or settings.CHAT_PROVIDER or settings.LLM_PROVIDER or "echo").lower()
    effective_prompt = prompt or (history[-1]["content"] if history else "")
    logger.debug(
        "generate_answer provider=%s history=%d snippet=%r",
        provider_name,
        len(history or []),
        effective_prompt[:80],
    )

    faq_lookup = _load_faq_lookup()
    last_user_message = effective_prompt
    if history:
        last_user_message = next(
            (msg["content"] for msg in reversed(history) if msg.get("role") == "user"),
            effective_prompt,
        )
    normalized_question = _normalize_question(last_user_message)
    faq_answer = faq_lookup.get(normalized_question)
    if faq_answer:
        logger.info("FAQ lookup hit: %s", normalized_question[:80])
        return _format_structured_answer(faq_answer)

    if provider_name in {"local", "smollm", "chatlaya"}:
        try:
            from app.core.smollm import get_smollm_model

            conversation = list(history or [])
            if not conversation:
                conversation = [{"role": "user", "content": effective_prompt}]
            last_user = effective_prompt
            for message in reversed(conversation):
                if message.get("role") == "user" and message.get("content"):
                    last_user = message["content"]
                    break
            history_without_last: List[Dict[str, str]] = []
            if conversation:
                history_without_last = [
                    {"role": msg.get("role", "user"), "content": msg.get("content", "")}
                    for msg in conversation[:-1]
                    if msg.get("role") != "system"
                ]
            rendered_context = _render_context(context, rag_sources)
            user_payload = (
                f"{LENGTH_GUARD}\n\n"
                "Contexte (extraits paraphrases, fiabilite variable):\n"
                f"{rendered_context}\n\n"
                f"Question: {last_user}\n\n"
                "Produis la reponse en suivant STRICTEMENT le FORMAT ci-dessus."
            )
            messages: List[Dict[str, str]] = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": FORMAT_PROMPT},
            ]
            messages.extend(history_without_last)
            messages.append({"role": "user", "content": user_payload})
            smollm = get_smollm_model()
            configured_max = settings.CHAT_MAX_NEW_TOKENS or 600
            max_tokens = max(400, min(configured_max, 800))
            response = smollm.chat_completion(
                messages,
                max_tokens=max_tokens,
                temperature=0.4,
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
                history_messages = list(history or [])
                if all(msg.get("role") != "system" for msg in history_messages):
                    history_messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

                client_history = []
                for msg in history_messages:
                    content = msg.get("content", "")
                    if not content:
                        continue
                    role = msg.get("role", "user").lower()
                    cohere_role = "USER"
                    if role in {"assistant", "system"}:
                        cohere_role = "CHATBOT"
                    client_history.append({"role": cohere_role, "message": content})

                hist = client_history
                if hist and hist[0].get("role") == "CHATBOT":
                    hist = hist[1:]
                resp = client.chat(
                    model=mdl,
                    message=effective_prompt,
                    chat_history=hist,
                    preamble_override=SYSTEM_PROMPT,
                )
                return getattr(resp, "text", None) or str(resp)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Cohere chat failed, falling back to echo: %s", exc)

    if provider_name == "echo":
        return effective_prompt

    if provider_name in {"openai", "mistral"}:
        logger.warning("Provider '%s' not configured. Falling back to echo.", provider_name)
        return effective_prompt

    logger.debug("Returning fallback reply for provider=%s", provider_name)
    return FALLBACK_REPLY


def detect_embed_dim() -> int:
    try:
        vector = embed_texts(["dimension_probe"], dim=None)[0]
        return len(vector)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to detect embed dim automatically: %s", exc)
        return settings.EMBED_DIM

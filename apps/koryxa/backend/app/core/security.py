from __future__ import annotations

import hashlib

from app.core.config import settings


def get_user_id_anon(user_internal_id: str) -> str:
    """
    Retourne un identifiant anonymisé, stable et non réversible pour un utilisateur.
    Utilise un secret côté serveur pour éviter les collisions triviales.
    """
    secret = settings.USER_HASH_SECRET
    to_hash = f"{secret}:{user_internal_id}"
    return hashlib.sha256(to_hash.encode("utf-8")).hexdigest()


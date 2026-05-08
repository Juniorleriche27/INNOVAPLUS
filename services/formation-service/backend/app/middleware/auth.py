from types import SimpleNamespace

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database import supabase

bearer = HTTPBearer(auto_error=False)


def _user_from_core_payload(payload: dict) -> SimpleNamespace:
    return SimpleNamespace(
        id=str(payload.get("id") or ""),
        email=payload.get("email"),
        first_name=payload.get("first_name"),
        last_name=payload.get("last_name"),
        roles=payload.get("roles") or [],
    )


async def _resolve_koryxa_cookie_user(request: Request) -> SimpleNamespace | None:
    cookie_header = request.headers.get("cookie") or ""
    if not cookie_header or settings.KORYXA_SESSION_COOKIE_NAME not in cookie_header:
        return None

    try:
        async with httpx.AsyncClient(timeout=settings.CORE_AUTH_TIMEOUT_S) as client:
            response = await client.get(
                settings.CORE_AUTH_ME_URL,
                headers={"cookie": cookie_header},
            )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Auth KORYXA indisponible: {exc}") from exc

    if response.status_code == status.HTTP_401_UNAUTHORIZED:
        return None
    if not response.is_success:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Validation session KORYXA impossible.")

    data = response.json()
    if not isinstance(data, dict) or not data.get("id"):
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Réponse auth KORYXA invalide.")
    return _user_from_core_payload(data)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
):
    if credentials and credentials.credentials:
        token = credentials.credentials
        try:
            user = supabase.auth.get_user(token)
            return user.user
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    user = await _resolve_koryxa_cookie_user(request)
    if user is not None:
        return user

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session KORYXA requise")

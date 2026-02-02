from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Optional

import requests


class IGError(RuntimeError):
    pass


@dataclass
class IGSession:
    api_key: str
    username: str
    password: str
    account_id: Optional[str] = None
    env: str = "demo"  # demo|live

    cst: Optional[str] = None
    x_security_token: Optional[str] = None

    @property
    def base_url(self) -> str:
        if self.env.lower() == "live":
            return "https://api.ig.com/gateway/deal"
        return "https://demo-api.ig.com/gateway/deal"

    def _headers(self, *, version: Optional[str] = None) -> dict[str, str]:
        headers: dict[str, str] = {
            "X-IG-API-KEY": self.api_key,
            "Accept": "application/json; charset=UTF-8",
            "Content-Type": "application/json; charset=UTF-8",
        }
        if self.cst:
            headers["CST"] = self.cst
        if self.x_security_token:
            headers["X-SECURITY-TOKEN"] = self.x_security_token
        if self.account_id:
            headers["IG-ACCOUNT-ID"] = self.account_id
        if version:
            headers["Version"] = version
        return headers

    def login(self) -> None:
        url = f"{self.base_url}/session"
        payload = {"identifier": self.username, "password": self.password}
        r = requests.post(url, json=payload, headers=self._headers(version="2"), timeout=30)
        if r.status_code not in (200, 201):
            raise IGError(f"IG login failed: {r.status_code} {r.text[:300]}")
        self.cst = r.headers.get("CST")
        self.x_security_token = r.headers.get("X-SECURITY-TOKEN")
        if not self.cst or not self.x_security_token:
            raise IGError("IG login missing CST / X-SECURITY-TOKEN headers.")
        if not self.account_id:
            # Try to get account id from body if present
            try:
                data = r.json()
                self.account_id = data.get("currentAccountId") or data.get("accountId") or self.account_id
            except Exception:
                pass

    def request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[dict[str, Any]] = None,
        json_body: Optional[dict[str, Any]] = None,
        version: Optional[str] = None,
    ) -> requests.Response:
        url = f"{self.base_url}{path}"
        r = requests.request(
            method.upper(),
            url,
            params=params,
            json=json_body,
            headers=self._headers(version=version),
            timeout=60,
        )
        return r


def session_from_env() -> IGSession:
    api_key = os.environ.get("IG_API_KEY", "").strip()
    username = os.environ.get("IG_USERNAME", "").strip()
    password = os.environ.get("IG_PASSWORD", "").strip()
    account_id = os.environ.get("IG_ACCOUNT_ID", "").strip() or None
    env = (os.environ.get("IG_ENV", "demo") or "demo").strip().lower()
    if not api_key or not username or not password:
        raise IGError("Missing IG env vars: IG_API_KEY, IG_USERNAME, IG_PASSWORD (and optional IG_ACCOUNT_ID).")
    return IGSession(api_key=api_key, username=username, password=password, account_id=account_id, env=env)


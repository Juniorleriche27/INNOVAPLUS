"""Minimal HTTP client for the FastAPI backend."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import os
import requests

DEFAULT_BASE_URL = os.getenv("INNOVA_API_BASE_URL", "http://localhost:8000")


class BackendUnavailable(Exception):
    """Raised when the backend API cannot be reached."""


def _request(method: str, path: str, *, params: Optional[Dict[str, Any]] = None, json_body: Optional[Dict[str, Any]] = None) -> Any:
    url = f"{DEFAULT_BASE_URL}{path}"
    try:
        response = requests.request(method, url, params=params, json=json_body, timeout=10)
    except requests.RequestException as exc:  # noqa: BLE001
        raise BackendUnavailable(f"Backend non joignable: {exc}") from exc

    if response.status_code >= 400:
        raise BackendUnavailable(f"Erreur API ({response.status_code}): {response.text}")
    return response.json()


def list_datasets() -> List[Dict[str, Any]]:
    return _request("GET", "/datasets")


def dataset_detail(dataset_id: str) -> Dict[str, Any]:
    return _request("GET", f"/datasets/{dataset_id}")


def dataset_preview(dataset_id: str, limit: int = 100) -> Dict[str, Any]:
    return _request("GET", f"/datasets/{dataset_id}/data", params={"limit": limit})


def health() -> Dict[str, Any]:
    return _request("GET", "/health")


def predict_hospital_risk(records):
    return _request("POST", "/predict/hospital_risk", json_body={"records": records})

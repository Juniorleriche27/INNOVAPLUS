"""Prediction services for INNOVA+ backend."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / "models" / "hospital_risk_model.joblib"

_model_cache: Dict[str, object] = {}


class PredictionPayloadError(HTTPException):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=400, detail=detail)


def _load_hospital_risk_model() -> Dict[str, object]:
    if "hospital_risk" in _model_cache:
        return _model_cache["hospital_risk"]
    if not MODEL_PATH.exists():
        raise PredictionPayloadError("Modèle hospitalier indisponible. Exécutez scripts/train_demo_model.py.")
    bundle = joblib.load(MODEL_PATH)
    _model_cache["hospital_risk"] = bundle
    return bundle


def predict_hospital_risk(records: List[Dict[str, float]]) -> List[Dict[str, float]]:
    if not records:
        raise PredictionPayloadError("Aucune donnée fournie")
    bundle = _load_hospital_risk_model()
    model = bundle["model"]
    feature_order = bundle["feature_order"]

    matrix = []
    for idx, record in enumerate(records):
        try:
            row = [float(record[feature]) for feature in feature_order]
        except KeyError as exc:
            raise PredictionPayloadError(f"Champ manquant: {exc.args[0]}") from exc
        except ValueError as exc:
            raise PredictionPayloadError(f"Valeur invalide sur l'enregistrement {idx}: {exc}") from exc
        matrix.append(row)

    matrix_np = np.asarray(matrix)
    proba = model.predict_proba(matrix_np)[:, 1]
    preds = model.predict(matrix_np)
    return [
        {
            "risk_probability": float(prob),
            "risk_label": int(pred),
        }
        for prob, pred in zip(proba, preds)
    ]

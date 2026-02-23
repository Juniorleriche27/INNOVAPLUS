from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Tuple

import numpy as np


EISENHOWER_VALUES = (
    "urgent_important",
    "important_not_urgent",
    "urgent_not_important",
    "not_urgent_not_important",
)


def _clamp_int(value: int, lo: int, hi: int) -> int:
    if value < lo:
        return lo
    if value > hi:
        return hi
    return value


def _as_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    raw = str(value).strip()
    if not raw:
        return None
    try:
        return date.fromisoformat(raw)
    except Exception:
        return None


def _as_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    raw = str(value).strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except Exception:
        return None


@dataclass(frozen=True)
class TaskCycleTimeTrainResult:
    model: Dict[str, Any]
    metrics: Dict[str, Any]


def build_task_features_v1(task: Dict[str, Any]) -> Tuple[List[str], List[float]]:
    title = str(task.get("title") or "")
    description = str(task.get("description") or "")
    created_at = _as_datetime(task.get("created_at"))
    due_date = _as_date(task.get("due_date")) or _as_date(task.get("due_datetime"))

    title_len = _clamp_int(len(title), 0, 200)
    desc_len = _clamp_int(len(description), 0, 800)

    has_due = 1.0 if due_date else 0.0
    due_in_days = 0.0
    weekday = 0
    if created_at is not None:
        weekday = int(created_at.weekday())
        if due_date is not None:
            try:
                due_in_days = float((due_date - created_at.date()).days)
            except Exception:
                due_in_days = 0.0

    high_impact = 1.0 if bool(task.get("high_impact")) else 0.0
    is_workspace = 1.0 if task.get("workspace_id") else 0.0

    pe = str(task.get("priority_eisenhower") or "important_not_urgent").strip()
    if pe not in EISENHOWER_VALUES:
        pe = "important_not_urgent"

    feature_names: List[str] = []
    values: List[float] = []

    feature_names.append("bias")
    values.append(1.0)

    feature_names.append("title_len")
    values.append(float(title_len))

    feature_names.append("desc_len")
    values.append(float(desc_len))

    feature_names.append("has_due")
    values.append(has_due)

    feature_names.append("due_in_days")
    values.append(float(due_in_days))

    feature_names.append("high_impact")
    values.append(high_impact)

    feature_names.append("is_workspace")
    values.append(is_workspace)

    for v in EISENHOWER_VALUES:
        feature_names.append(f"pe:{v}")
        values.append(1.0 if pe == v else 0.0)

    for i in range(7):
        feature_names.append(f"weekday:{i}")
        values.append(1.0 if weekday == i else 0.0)

    return feature_names, values


def _standardize_matrix(x: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    mean = x.mean(axis=0)
    std = x.std(axis=0)
    std = np.where(std <= 1e-12, 1.0, std)
    x_scaled = (x - mean) / std
    # Keep intercept stable (no scaling)
    x_scaled[:, 0] = 1.0
    mean[0] = 0.0
    std[0] = 1.0
    return x_scaled, mean, std


def _ridge_fit(x: np.ndarray, y: np.ndarray, alpha: float) -> np.ndarray:
    n_features = x.shape[1]
    reg = np.eye(n_features, dtype=float) * float(alpha)
    reg[0, 0] = 0.0  # don't regularize intercept
    a = x.T @ x + reg
    b = x.T @ y
    return np.linalg.solve(a, b)


def train_task_cycle_time_model_v1(
    tasks: Iterable[Dict[str, Any]],
    *,
    alpha: float = 8.0,
    min_samples: int = 12,
    max_cycle_minutes: int = 60 * 24 * 30,
) -> TaskCycleTimeTrainResult:
    x_rows: List[List[float]] = []
    y_rows: List[float] = []
    feature_names: List[str] | None = None

    used = 0
    for t in tasks:
        created_at = _as_datetime(t.get("created_at"))
        completed_at = _as_datetime(t.get("done_at")) or _as_datetime(t.get("completed_at"))
        if created_at is None or completed_at is None:
            continue
        if completed_at <= created_at:
            continue
        cycle_minutes = int((completed_at - created_at).total_seconds() / 60.0)
        cycle_minutes = _clamp_int(cycle_minutes, 1, int(max_cycle_minutes))

        fn, fv = build_task_features_v1(t)
        if feature_names is None:
            feature_names = fn
        if fn != feature_names:
            # Should never happen, but keep training robust.
            continue

        x_rows.append(fv)
        y_rows.append(math.log1p(float(cycle_minutes)))
        used += 1

    if used < int(min_samples):
        raise ValueError(f"not enough completed tasks to train (have={used}, need>={min_samples})")

    x = np.asarray(x_rows, dtype=float)
    y = np.asarray(y_rows, dtype=float)

    x_scaled, mean, std = _standardize_matrix(x)
    w = _ridge_fit(x_scaled, y, alpha=alpha)

    y_pred = x_scaled @ w
    minutes_true = np.expm1(y)
    minutes_pred = np.expm1(y_pred)
    abs_err = np.abs(minutes_pred - minutes_true)
    mae_minutes = float(abs_err.mean())
    medae_minutes = float(np.median(abs_err))
    r2 = float(1.0 - (np.sum((y_pred - y) ** 2) / max(np.sum((y - y.mean()) ** 2), 1e-9)))

    model: Dict[str, Any] = {
        "name": "task_cycle_time_v1",
        "type": "ridge_regression_log1p_minutes",
        "alpha": float(alpha),
        "feature_names": feature_names or [],
        "weights": w.tolist(),
        "x_mean": mean.tolist(),
        "x_std": std.tolist(),
    }
    metrics: Dict[str, Any] = {
        "n_samples": int(used),
        "mae_minutes": mae_minutes,
        "medae_minutes": medae_minutes,
        "mae_hours": mae_minutes / 60.0,
        "r2_log": r2,
    }
    return TaskCycleTimeTrainResult(model=model, metrics=metrics)


def predict_task_cycle_time_minutes_v1(model: Dict[str, Any], task: Dict[str, Any]) -> float:
    feature_names, fv = build_task_features_v1(task)
    if feature_names != list(model.get("feature_names") or []):
        raise ValueError("model feature mismatch")

    x = np.asarray([fv], dtype=float)
    mean = np.asarray(model.get("x_mean") or [], dtype=float)
    std = np.asarray(model.get("x_std") or [], dtype=float)
    w = np.asarray(model.get("weights") or [], dtype=float)
    if mean.shape[0] != x.shape[1] or std.shape[0] != x.shape[1] or w.shape[0] != x.shape[1]:
        raise ValueError("model shape mismatch")

    x_scaled = (x - mean) / std
    x_scaled[:, 0] = 1.0
    y_pred = float((x_scaled @ w)[0])
    minutes_pred = float(np.expm1(y_pred))
    if not math.isfinite(minutes_pred) or minutes_pred <= 0:
        minutes_pred = 30.0
    return float(_clamp_int(int(minutes_pred), 1, 60 * 24 * 30))


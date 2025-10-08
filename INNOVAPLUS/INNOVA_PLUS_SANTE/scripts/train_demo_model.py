"""Train a demo hospital risk model and persist it under models/."""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH = MODELS_DIR / "hospital_risk_model.joblib"

np.random.seed(42)
size = 2000
ages = np.random.normal(55, 12, size)
severity = np.random.uniform(0, 10, size)
bmi = np.random.normal(27, 5, size)
length_of_stay = np.random.normal(4, 1.2, size)
chronic_conditions = np.random.poisson(1.5, size)
readmission = (
    1 / (1 + np.exp(-(-4 + 0.04 * ages + 0.6 * (severity > 7) + 0.3 * chronic_conditions + 0.2 * (length_of_stay > 5))))
    > np.random.rand(size)
).astype(int)

features = pd.DataFrame(
    {
        "age": ages,
        "severity_score": severity,
        "bmi": bmi,
        "length_of_stay": length_of_stay,
        "chronic_conditions": chronic_conditions,
    }
)
X_train, X_test, y_train, y_test = train_test_split(features, readmission, test_size=0.3, random_state=42)
pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=500)),
])
pipeline.fit(X_train, y_train)

joblib.dump({
    "model": pipeline,
    "feature_order": list(features.columns),
    "train_score": float(pipeline.score(X_train, y_train)),
    "test_score": float(pipeline.score(X_test, y_test)),
}, MODEL_PATH)
print(f"Model trained and saved to {MODEL_PATH}")

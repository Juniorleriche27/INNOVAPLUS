import os
from pathlib import Path

import pandas as pd
import xgboost as xgb


DATA_PATH = Path("/opt/innovaplus/KORYXA/koryxa_matching_synthetic_dataset.csv")
MODEL_DIR = Path("/opt/innovaplus/KORYXA/models")
MODEL_PATH = MODEL_DIR / "koryxa_ranking_xgb.json"

# Features used for ranking (métier + similarités)
FEATURES = [
    "mission_complexity_level",
    "mission_duration_days",
    "time_to_deadline_days",
    "is_remote",
    "mission_budget_min",
    "mission_budget_max",
    "profile_experience_level",
    "profile_expected_rate",
    "n_previous_missions_total",
    "n_previous_missions_same_domain",
    "profile_acceptance_rate",
    "profile_completion_rate",
    "profile_avg_response_time_min",
    "profile_rating_mean",
    "same_country",
    "same_region",
    "language_match_score",
    "profile_remote_ok",
    "budget_fit_ratio",
    "skill_overlap_jaccard",
    "embedding_similarity",
]

TARGET = "good_match_label"
GROUP = "group_id"


def load_data(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = [c for c in FEATURES + [TARGET, GROUP] if c not in df.columns]
    if missing:
        raise ValueError(f"Colonnes manquantes dans le CSV: {missing}")
    return df


def train_model(df: pd.DataFrame) -> xgb.Booster:
    X = df[FEATURES]
    y = df[TARGET]
    group = df.groupby(GROUP).size().to_numpy()

    dtrain = xgb.DMatrix(X, label=y)
    dtrain.set_group(group)

    params = {
        "objective": "rank:ndcg",
        "eval_metric": "ndcg",
        "eta": 0.1,
        "max_depth": 6,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "min_child_weight": 1.0,
        "tree_method": "hist",
        "seed": 42,
    }

    booster = xgb.train(
        params=params,
        dtrain=dtrain,
        num_boost_round=200,
    )
    return booster


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset introuvable: {DATA_PATH}")

    print(f"Lecture du dataset: {DATA_PATH}")
    df = load_data(DATA_PATH)

    print("Entraînement du modèle XGBoost (ranking)...")
    model = train_model(df)

    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save_model(MODEL_PATH)
    print(f"Modèle sauvegardé: {MODEL_PATH}")


if __name__ == "__main__":
    main()

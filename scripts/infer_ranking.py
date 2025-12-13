"""
Script d'inférence : classe les profils pour une mission donnée
en utilisant le modèle XGBoost ranking entraîné.

Usage :
  /opt/innovaplus/KORYXA/apps/koryxa/backend/.venv/bin/python scripts/infer_ranking.py --mission-id 1 --top-k 5
"""

import argparse
from pathlib import Path
import pandas as pd
import xgboost as xgb


DATA_PATH = Path("/opt/innovaplus/KORYXA/koryxa_matching_synthetic_dataset.csv")
MODEL_PATH = Path("/opt/innovaplus/KORYXA/models/koryxa_ranking_xgb.json")

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


def load_data() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset introuvable: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    return df


def load_model() -> xgb.Booster:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Modèle introuvable: {MODEL_PATH}")
    booster = xgb.Booster()
    booster.load_model(MODEL_PATH)
    return booster


def score_mission(df: pd.DataFrame, booster: xgb.Booster, mission_id: int, top_k: int = 10):
    subset = df[df["mission_id"] == mission_id].copy()
    if subset.empty:
        raise ValueError(f"Aucune ligne pour mission_id={mission_id} dans le dataset.")
    dmat = xgb.DMatrix(subset[FEATURES])
    preds = booster.predict(dmat)
    subset["match_score"] = preds
    subset = subset.sort_values("match_score", ascending=False)
    return subset.head(top_k)[["profile_id", "match_score", "good_match_label", "skill_overlap_jaccard", "embedding_similarity", "same_country", "language_match_score"]]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mission-id", type=int, required=True, help="mission_id à scorer")
    parser.add_argument("--top-k", type=int, default=10, help="nombre de profils à retourner")
    args = parser.parse_args()

    df = load_data()
    model = load_model()
    result = score_mission(df, model, args.mission_id, args.top_k)
    print(result)


if __name__ == "__main__":
    main()

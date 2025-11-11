"""Generate profiling information for processed datasets."""

from __future__ import annotations

import json
import math
import sys
from collections import Counter
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
import yaml

ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "data" / "datasets_catalog.yml"


class ProfilingError(Exception):
    """Raised when profiling fails for a dataset."""


def load_catalog() -> list[dict]:
    if not CATALOG_PATH.exists():
        raise FileNotFoundError(f"Catalog not found: {CATALOG_PATH}")
    with CATALOG_PATH.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or []


def processed_file_path(entry: dict) -> Path:
    processed_dir = ROOT / entry["processed_dir"]
    return processed_dir / f"{entry['id']}.parquet"


def to_serializable(value):
    if value is None:
        return None
    if isinstance(value, (np.integer, np.int64, np.int32)):
        return int(value)
    if isinstance(value, (np.floating, np.float64, np.float32)):
        if math.isnan(value):
            return None
        return float(value)
    if isinstance(value, (pd.Timestamp, pd.Timedelta)):
        return value.isoformat()
    return value


def summarize_column(series: pd.Series) -> dict:
    non_null = int(series.notna().sum())
    total = len(series)
    summary = {
        "dtype": str(series.dtype),
        "non_null": non_null,
        "missing_pct": round(float(100 - (non_null / total * 100)) if total else 0.0, 2),
        "unique": int(series.nunique(dropna=True)),
    }

    if pd.api.types.is_numeric_dtype(series):
        summary.update(
            {
                "min": to_serializable(series.min()),
                "max": to_serializable(series.max()),
                "mean": to_serializable(series.mean()),
                "std": to_serializable(series.std()),
            }
        )
    elif pd.api.types.is_datetime64_any_dtype(series):
        summary.update(
            {
                "min": to_serializable(series.min()),
                "max": to_serializable(series.max()),
            }
        )
    else:
        most_common = series.dropna().astype(str)
        if not most_common.empty:
            top = Counter(most_common).most_common(1)[0]
            summary["top"] = {"value": top[0], "count": int(top[1])}
    return summary


def profile_dataset(entry: dict, force: bool = False) -> None:
    file_path = processed_file_path(entry)
    if not file_path.exists():
        raise ProfilingError(f"Processed file not found: {file_path}")

    profile_path = file_path.with_suffix(file_path.suffix + ".profile.json")
    if profile_path.exists() and not force:
        print(f"[skip] {entry['id']} profile already exists")
        return

    df = pd.read_parquet(file_path)
    row_count, column_count = df.shape

    columns = {col: summarize_column(df[col]) for col in df.columns}
    sample_rows = json.loads(df.head(5).to_json(orient="records"))

    profile = {
        "rows": int(row_count),
        "columns": int(column_count),
        "column_summary": columns,
        "sample_rows": sample_rows,
    }

    profile_path.write_text(json.dumps(profile, indent=2), encoding="utf-8")
    print(f"[done] profile generated for {entry['id']}")


def main(argv: Iterable[str]) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Profile processed datasets")
    parser.add_argument("--dataset-id", help="Dataset id to restrict profiling.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing profile files.")
    args = parser.parse_args(list(argv))

    catalog = load_catalog()
    if args.dataset_id:
        catalog = [item for item in catalog if item["id"] == args.dataset_id]
        if not catalog:
            print(f"Dataset id '{args.dataset_id}' not found in catalog.")
            return 1

    errors = []
    for entry in catalog:
        try:
            profile_dataset(entry, force=args.force)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{entry['id']}: {exc}")
            print(f"[error] {entry['id']} -> {exc}")

    if errors:
        print("\nSome datasets failed to profile:")
        for err in errors:
            print(" -", err)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

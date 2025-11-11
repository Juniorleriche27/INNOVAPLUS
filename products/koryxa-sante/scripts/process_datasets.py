"""Data processing utilities to normalize raw datasets into the processed area."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

import json

import pandas as pd
import yaml

CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "datasets_catalog.yml"

SUPPORTED_EXTENSIONS = {".csv", ".tsv", ".parquet", ".xlsx"}


class ProcessingError(Exception):
    """Raised when a dataset cannot be processed."""


def load_catalog() -> list[dict]:
    if not CATALOG_PATH.exists():
        raise FileNotFoundError(f"Catalog not found: {CATALOG_PATH}")
    with CATALOG_PATH.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or []


def iter_raw_files(raw_dir: Path) -> Iterable[Path]:
    if not raw_dir.exists():
        raise ProcessingError(f"Raw directory does not exist: {raw_dir}")
    for path in raw_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield path


def read_dataset(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path, low_memory=False)
    if suffix == ".tsv":
        return pd.read_csv(path, sep="\t")
    if suffix == ".parquet":
        return pd.read_parquet(path)
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    raise ProcessingError(f"Unsupported file format: {path}")


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [
        col.strip()
        .replace(" ", "_")
        .replace("/", "_")
        .replace("-", "_")
        .lower()
        for col in df.columns
    ]
    return df




def write_metadata(processed_file: Path, dataframe: pd.DataFrame, *, source: Path) -> None:
    """Persist simple metadata (rows, columns, source file)."""
    meta = {
        "rows": int(dataframe.shape[0]),
        "columns": int(dataframe.shape[1]),
        "column_names": list(map(str, dataframe.columns)),
        "source_file": source.name,
    }
    meta_path = processed_file.with_suffix(processed_file.suffix + '.meta.json')
    meta_path.write_text(json.dumps(meta, indent=2), encoding='utf-8')

def process_dataset(entry: dict, force: bool = False) -> None:
    raw_dir = Path(entry["raw_dir"]).resolve()
    processed_dir = Path(entry["processed_dir"]).resolve()
    processed_file = processed_dir / f"{entry['id']}.parquet"

    processed_dir.mkdir(parents=True, exist_ok=True)

    if processed_file.exists() and not force:
        print(f"[skip] {entry['id']} already processed")
        return

    files = list(iter_raw_files(raw_dir))
    if not files:
        raise ProcessingError(f"No supported files in {raw_dir}")

    # Strategy: pick the largest file as main (most informative)
    files.sort(key=lambda p: p.stat().st_size, reverse=True)
    main_file = files[0]
    print(f"[process] {entry['id']} using {main_file.name}")

    df = read_dataset(main_file)
    df = normalize_columns(df)
    df = df.convert_dtypes()
    df = df.drop_duplicates()

    # Basic clean-up: remove unnamed columns often created by CSV export
    unnamed = [col for col in df.columns if col.startswith("unnamed")]
    if unnamed:
        df = df.drop(columns=unnamed)

    df.to_parquet(processed_file, index=False)
    write_metadata(processed_file, df, source=main_file)
    print(f"[done] {entry['id']} -> {processed_file}")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Process raw datasets into parquet format")
    parser.add_argument(
        "--dataset-id",
        help="Optional dataset id (catalog entry) to process a single dataset.",
    )
    parser.add_argument("--force", action="store_true", help="Override existing processed files.")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    catalog = load_catalog()
    if not catalog:
        print("Catalog is empty. Nothing to process.")
        return 0

    if args.dataset_id:
        catalog = [item for item in catalog if item["id"] == args.dataset_id]
        if not catalog:
            print(f"Dataset id '{args.dataset_id}' not found in catalog.")
            return 1

    errors: list[str] = []
    for entry in catalog:
        try:
            process_dataset(entry, force=args.force)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{entry['id']}: {exc}")
            print(f"[error] {entry['id']} -> {exc}")

    if errors:
        print("\nSome datasets failed to process:")
        for err in errors:
            print(" -", err)
        return 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))




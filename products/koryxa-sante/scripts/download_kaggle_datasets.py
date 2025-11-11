"""Utilities to download all datasets listed in `data/datasets_catalog.yml` using the Kaggle API."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import yaml
from kaggle.api.kaggle_api_extended import KaggleApi

CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "datasets_catalog.yml"


def load_catalog() -> list[dict]:
    if not CATALOG_PATH.exists():
        raise FileNotFoundError(f"Catalog not found: {CATALOG_PATH}")
    with CATALOG_PATH.open("r", encoding="utf-8") as fh:
        return yaml.safe_load(fh) or []


def ensure_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def download_dataset(api: KaggleApi, dataset: dict, force: bool = False) -> None:
    raw_dir = Path(dataset["raw_dir"]).resolve()
    ensure_directory(raw_dir)

    already_downloaded = any(raw_dir.iterdir())
    if already_downloaded and not force:
        print(f"[skip] {dataset['id']} already populated in {raw_dir}")
        return

    print(f"[download] Fetching {dataset['kaggle_dataset']} -> {raw_dir}")
    api.dataset_download_files(
        dataset["kaggle_dataset"], path=str(raw_dir), unzip=True, quiet=False
    )
    print(f"[done] {dataset['id']} ready in {raw_dir}")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download datasets from Kaggle")
    parser.add_argument(
        "--dataset-id",
        help="Optional dataset id (as defined in catalog) to download a single entry.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-download even if target folder already has files.",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    catalog = load_catalog()
    if not catalog:
        print("Catalog is empty. Nothing to download.")
        return 0

    if args.dataset_id:
        catalog = [item for item in catalog if item["id"] == args.dataset_id]
        if not catalog:
            print(f"Dataset id '{args.dataset_id}' not found in catalog.")
            return 1

    api = KaggleApi()
    api.authenticate()

    for entry in catalog:
        download_dataset(api, entry, force=args.force)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

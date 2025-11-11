"""Utility helpers to work with processed datasets and metadata."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
import yaml

ROOT_DIR = Path(__file__).resolve().parents[2]
CATALOG_PATH = ROOT_DIR / "data" / "datasets_catalog.yml"

ADDITIONAL_INFO: Dict[str, Dict[str, Any]] = {
    "hospital_patient_records": {
        "description": "Enregistrements hospitaliers synthétiques (admissions, diagnostics, traitements).",
    },
    "hospital_admissions": {
        "description": "Historique des admissions hospitalières avec variables démographiques et médicales.",
    },
    "hospital_general_information": {
        "description": "Informations officielles CMS sur les établissements hospitaliers américains.",
    },
    "hospital_inpatient_discharges": {
        "description": "Données de sorties hospitalières et séjours hospitaliers.",
    },
    "hospital_length_of_stay": {
        "description": "Durée de séjour et facteurs associés issue du challenge Microsoft.",
    },
    "hospital_emergency": {
        "description": "Flux de passages aux urgences et temps de prise en charge.",
    },
    "hospital_management": {
        "description": "Gestion hospitalière : ressources humaines, inventaires, activités.",
    },
    "genomics_gdsc": {
        "description": "Sensibilité aux médicaments pour des lignées cancéreuses (GDSC).",
    },
    "genetic_disorders": {
        "description": "Jeu de données multi-catégories sur les désordres génétiques.",
    },
    "human_genome_features": {
        "description": "Caractéristiques dérivées du génome humain complet.",
    },
}


@dataclass
class DatasetEntry:
    id: str
    name: str
    category: str
    raw_dir: Path
    processed_dir: Path
    processed_file: Path
    metadata: Optional[Dict[str, Any]]
    profile: Optional[Dict[str, Any]]
    source_url: Optional[str] = None
    license: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None

    @property
    def row_count(self) -> Optional[int]:
        if self.profile and "rows" in self.profile:
            return int(self.profile["rows"])
        if self.metadata and "rows" in self.metadata:
            return int(self.metadata["rows"])
        return None

    @property
    def column_count(self) -> Optional[int]:
        if self.profile and "columns" in self.profile:
            return int(self.profile["columns"])
        if self.metadata and "columns" in self.metadata:
            return int(self.metadata["columns"])
        return None

    @property
    def description(self) -> str:
        extra_desc = (self.extra or {}).get("description")
        return extra_desc or "Description à compléter."


def _resolve_path(relative: str) -> Path:
    rel_path = Path(relative)
    if rel_path.is_absolute():
        return rel_path
    return ROOT_DIR / rel_path


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    if not path.exists():
        return None
    import json

    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


@lru_cache(maxsize=1)
def load_catalog() -> List[DatasetEntry]:
    if not CATALOG_PATH.exists():
        return []
    with CATALOG_PATH.open("r", encoding="utf-8") as fh:
        raw_catalog = yaml.safe_load(fh) or []

    entries: List[DatasetEntry] = []
    for item in raw_catalog:
        processed_dir = _resolve_path(item["processed_dir"])
        processed_file = processed_dir / f"{item['id']}.parquet"
        metadata = _load_json(processed_file.with_suffix(processed_file.suffix + ".meta.json"))
        profile = _load_json(processed_file.with_suffix(processed_file.suffix + ".profile.json"))
        extra = ADDITIONAL_INFO.get(item["id"], {})
        entries.append(
            DatasetEntry(
                id=item["id"],
                name=item["name"],
                category=item.get("category", ""),
                raw_dir=_resolve_path(item["raw_dir"]),
                processed_dir=processed_dir,
                processed_file=processed_file,
                metadata=metadata,
                profile=profile,
                source_url=item.get("source_url"),
                license=item.get("license"),
                extra=extra,
            )
        )
    return entries


def get_dataset(dataset_id: str) -> Optional[DatasetEntry]:
    for entry in load_catalog():
        if entry.id == dataset_id:
            return entry
    return None


def load_dataframe(dataset_id: str, limit: Optional[int] = None) -> pd.DataFrame:
    entry = get_dataset(dataset_id)
    if not entry:
        raise ValueError(f"Dataset '{dataset_id}' not found in catalog")
    if not entry.processed_file.exists():
        raise FileNotFoundError(f"Processed file missing: {entry.processed_file}")
    df = pd.read_parquet(entry.processed_file)
    if limit is not None:
        return df.head(limit)
    return df


def categories_summary(entries: Optional[List[DatasetEntry]] = None) -> Dict[str, int]:
    entries = entries or load_catalog()
    summary: Dict[str, int] = {}
    for entry in entries:
        summary[entry.category] = summary.get(entry.category, 0) + 1
    return summary

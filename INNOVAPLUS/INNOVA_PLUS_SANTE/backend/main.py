"""FastAPI backend exposing dataset catalogue and placeholder predictions."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from streamlit_app.lib.data_catalog import get_dataset, load_catalog, load_dataframe
from backend.services.prediction import predict_hospital_risk, PredictionPayloadError

app = FastAPI(
    title="KORYXA Santé Data API",
    description="Endpoints d’accès aux jeux de données et services IA",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class ColumnDetail(BaseModel):
    column: str = Field(..., description="Nom de la colonne")
    dtype: Optional[str] = Field(None, description="Type Pandas")
    non_null: Optional[int] = Field(None, description="Nombre de valeurs non nulles")
    missing_pct: Optional[float] = Field(None, description="Pourcentage de valeurs manquantes")
    unique: Optional[int] = Field(None, description="Nombre de valeurs uniques")
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    std: Optional[float] = None
    top: Optional[Dict[str, Any]] = Field(None, description="Valeur la plus fréquente pour les colonnes catégorielles")


class DatasetSummary(BaseModel):
    id: str
    name: str
    category: Optional[str]
    description: str
    rows: Optional[int]
    columns: Optional[int]
    source_url: Optional[str]
    license: Optional[str]


class DatasetDetail(BaseModel):
    summary: DatasetSummary
    profile_available: bool
    column_summary: List[ColumnDetail]
    sample_rows: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class PredictionRequest(BaseModel):
    dataset_id: Optional[str] = Field(None, description="Identifiant d’un dataset connu")
    records: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Enregistrements à analyser lorsqu’aucun dataset_id n’est fourni",
    )


class PredictionResponse(BaseModel):
    message: str
    pending: bool = True
    details: Optional[Any] = None


@app.get("/health", tags=["infrastructure"])
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/datasets", response_model=List[DatasetSummary], tags=["datasets"])
def list_datasets() -> List[DatasetSummary]:
    entries = load_catalog()
    summaries: List[DatasetSummary] = []
    for entry in entries:
        summaries.append(
            DatasetSummary(
                id=entry.id,
                name=entry.name,
                category=entry.category or None,
                description=entry.description,
                rows=entry.row_count,
                columns=entry.column_count,
                source_url=entry.source_url,
                license=entry.license,
            )
        )
    return summaries


@app.get("/datasets/{dataset_id}", response_model=DatasetDetail, tags=["datasets"])
def dataset_detail(dataset_id: str) -> DatasetDetail:
    entry = get_dataset(dataset_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Dataset non trouvé")

    profile = entry.profile or {}
    column_summary_data = profile.get("column_summary", {})
    columns: List[ColumnDetail] = []
    for column, info in column_summary_data.items():
        columns.append(
            ColumnDetail(
                column=column,
                dtype=info.get("dtype"),
                non_null=info.get("non_null"),
                missing_pct=info.get("missing_pct"),
                unique=info.get("unique"),
                min=info.get("min"),
                max=info.get("max"),
                mean=info.get("mean"),
                std=info.get("std"),
                top=info.get("top"),
            )
        )

    if profile.get("sample_rows"):
        sample_rows = profile["sample_rows"]
    else:
        df = load_dataframe(dataset_id, limit=5)
        sample_rows = df.to_dict("records")

    metadata = entry.metadata or {}
    if entry.profile:
        metadata = {**metadata, "profile_generated": True}

    summary = DatasetSummary(
        id=entry.id,
        name=entry.name,
        category=entry.category or None,
        description=entry.description,
        rows=entry.row_count,
        columns=entry.column_count,
        source_url=entry.source_url,
        license=entry.license,
    )

    return DatasetDetail(
        summary=summary,
        profile_available=entry.profile is not None,
        column_summary=columns,
        sample_rows=sample_rows,
        metadata=metadata,
    )


@app.get("/datasets/{dataset_id}/data", tags=["datasets"])
def dataset_data(dataset_id: str, limit: int = 100) -> Dict[str, Any]:
    if limit <= 0:
        raise HTTPException(status_code=400, detail="Le paramètre limit doit être positif")
    df = load_dataframe(dataset_id, limit=limit)
    return {"dataset_id": dataset_id, "limit": limit, "data": df.to_dict("records")}


@app.post("/predict/{model_id}", response_model=PredictionResponse, tags=["predictions"])
def predict(model_id: str, payload: PredictionRequest) -> PredictionResponse:
    if model_id == "hospital_risk":
        if payload.records:
            results = predict_hospital_risk(payload.records)
        elif payload.dataset_id:
            df = load_dataframe(payload.dataset_id)
            required = ["age", "severity_score", "bmi", "length_of_stay", "chronic_conditions"]
            if not set(required).issubset(df.columns):
                raise PredictionPayloadError("Le dataset sélectionné ne contient pas les colonnes requises")
            records = df[required].head(5).to_dict("records")
            results = predict_hospital_risk(records)
        else:
            raise PredictionPayloadError("Fournir 'records' ou 'dataset_id'.")
        return PredictionResponse(
            message="Prédiction effectuée",
            pending=False,
            details=results,
        )
    return PredictionResponse(
        message=f"Modèle '{model_id}' non pris en charge.",
        pending=True,
    )


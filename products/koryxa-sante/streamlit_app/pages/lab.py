"""KORYXA Santé — Laboratoire d'analyse personnalisée."""

from __future__ import annotations

import io
from typing import Dict, List

import pandas as pd
import streamlit as st

from streamlit_app.utils.ui import metric_cards, section_header, stat_pills
from streamlit_app.lib.api_client import BackendUnavailable, predict_hospital_risk

MAX_FILE_SIZE_MB = 20
ALLOWED_TYPES = {"csv", "xls", "xlsx", "parquet"}


def _read_uploaded_file(uploaded_file: st.UploadedFile) -> pd.DataFrame:
    suffix = uploaded_file.name.lower().split('.')[-1]
    buffer = uploaded_file.read()
    bio = io.BytesIO(buffer)

    if suffix == "csv":
        return pd.read_csv(bio)
    if suffix in {"xls", "xlsx"}:
        return pd.read_excel(bio)
    if suffix == "parquet":
        return pd.read_parquet(bio)
    raise ValueError(f"Format non supporté: {suffix}")


def _column_summary(df: pd.DataFrame) -> List[Dict[str, object]]:
    summary: List[Dict[str, object]] = []
    for column in df.columns:
        series = df[column]
        non_null = int(series.notna().sum())
        total = len(series)
        summary.append(
            {
                "Colonne": column,
                "Type": str(series.dtype),
                "Non nuls": non_null,
                "Manquants %": round(100 - (non_null / total * 100) if total else 0, 2),
                "Unique": int(series.nunique(dropna=True)),
            }
        )
    return summary


def lab_page() -> None:
    section_header(
        "Laboratoire de données",
        "Chargez vos fichiers (CSV, Excel ou Parquet) pour explorer rapidement les données et préparer des analyses IA.",
        icon="🧪",
    )

    with st.sidebar:
        st.subheader("Instructions")
        st.markdown(
            """
            - Taille maximale : **20 Mo**
            - Formats supportés : CSV, XLSX, Parquet
            - Les données restent en mémoire (non stockées sur le serveur)
            - Exportez ou supprimez votre session à tout moment
            """
        )

    uploaded_file = st.file_uploader(
        "Déposer un fichier",
        type=list(ALLOWED_TYPES),
        help="Chargez un jeu de données pour obtenir un aperçu instantané."
    )

    if not uploaded_file:
        st.info("Aucun fichier chargé pour le moment.")
        return

    file_size_mb = uploaded_file.size / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        st.error(f"Fichier trop volumineux ({file_size_mb:.1f} Mo). Limite : {MAX_FILE_SIZE_MB} Mo.")
        return

    try:
        df = _read_uploaded_file(uploaded_file)
    except Exception as exc:  # noqa: BLE001
        st.error(f"Impossible de lire le fichier : {exc}")
        return

    rows, cols = df.shape
    memory_mb = df.memory_usage(index=True).sum() / (1024 * 1024)
    numeric_cols = df.select_dtypes(include="number").columns
    categorical_cols = df.select_dtypes(exclude="number").columns

    total_missing = df.isna().sum().sum()
    missing_pct = (total_missing / (rows * cols) * 100) if rows and cols else 0.0

    metric_cards(
        [
            {
                "icon": "📥",
                "label": "Nom du fichier",
                "value": uploaded_file.name,
                "helper": f"Taille : {file_size_mb:.1f} Mo",
            },
            {
                "icon": "📊",
                "label": "Dimensions",
                "value": f"{rows:,} × {cols}".replace(",", " "),
                "helper": f"Colonnes numériques : {len(numeric_cols)}",
            },
            {
                "icon": "💾",
                "label": "Mémoire en RAM",
                "value": f"{memory_mb:.2f} Mo",
                "helper": "Estimation d'utilisation",
            },
            {
                "icon": "🧮",
                "label": "Valeurs manquantes",
                "value": f"{missing_pct:.1f} %",
                "helper": f"Total : {int(total_missing):,}".replace(",", " "),
            },
        ]
    )

    stat_pills(
        [
            {"label": "Colonnes numériques", "value": str(len(numeric_cols))},
            {"label": "Colonnes catégorielles", "value": str(len(categorical_cols))},
            {"label": "Index", "value": df.index.name or "non défini"},
        ]
    )

    section_header(
        "Aperçu",
        "Visualisez les premières lignes pour valider la structure de vos données.",
        icon="👀",
    )
    st.dataframe(df.head(20), use_container_width=True)

    section_header(
        "Profil rapide",
        "Indicateurs de base pour chaque colonne.",
        icon="📋",
    )
    summary_df = pd.DataFrame(_column_summary(df))
    st.dataframe(summary_df, use_container_width=True, hide_index=True)

    with st.expander("Statistiques descriptives", expanded=False):
        try:
            st.dataframe(df.describe(include="all").transpose(), use_container_width=True)
        except ValueError:
            st.info("Statistiques non disponibles pour le format de données fourni.")

    section_header(
        "Export",
        "Téléchargez la version nettoyée pour poursuivre vos analyses.",
        icon="💾",
    )
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    st.download_button(
        label="Télécharger en CSV",
        data=csv_buffer.getvalue(),
        file_name=f"{uploaded_file.name.rsplit('.', 1)[0]}_preview.csv",
        mime="text/csv",
    )

    parquet_buffer = io.BytesIO()
    df.to_parquet(parquet_buffer, index=False)
    st.download_button(
        label="Télécharger en Parquet",
        data=parquet_buffer.getvalue(),
        file_name=f"{uploaded_file.name.rsplit('.', 1)[0]}_preview.parquet",
        mime="application/octet-stream",
    )

    required_features = {"age", "severity_score", "bmi", "length_of_stay", "chronic_conditions"}
    if required_features.issubset(df.columns):
        section_header(
            "Prédiction de risque",
            "Utilisez le modèle hospital_risk pour estimer la probabilité de réadmission.",
            icon="⚙️",
        )
        nb_rows = st.slider(
            "Nombre de patients à envoyer",
            min_value=1,
            max_value=min(50, len(df)),
            value=min(10, len(df)),
        )
        if st.button("Calculer le risque avec l'API", type="primary"):
            try:
                payload = df[list(required_features)].head(nb_rows).to_dict("records")
                response = predict_hospital_risk(payload)
                details = response.get("details", []) if isinstance(response, dict) else response
                if details:
                    results_df = pd.DataFrame(details)
                    st.dataframe(results_df, use_container_width=True, hide_index=True)
                else:
                    st.info("L'API n'a retourné aucun résultat exploitable.")
            except BackendUnavailable as exc:
                st.error(f"API indisponible : {exc}")
            except Exception as exc:
                st.error(f"Erreur durant la prédiction : {exc}")
    else:
        st.caption("Ajoutez les colonnes age, severity_score, bmi, length_of_stay et chronic_conditions pour activer la prédiction.")

    st.success("Analyse terminée. Vous pouvez charger un nouveau fichier ou passer à la suite.")

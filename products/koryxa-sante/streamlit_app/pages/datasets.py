
"""
KORYXA Santé — Datasets explorer connecté aux données traitées.
"""

from __future__ import annotations

from typing import Dict, Optional

import pandas as pd
import plotly.express as px
import streamlit as st

from streamlit_app.lib.data_catalog import (
    categories_summary,
    load_catalog,
    load_dataframe,
)
from streamlit_app.lib.api_client import (
    BackendUnavailable,
    dataset_detail,
    list_datasets,
)
from streamlit_app.utils.ui import metric_cards, section_header, stat_pills


@st.cache_data(show_spinner=False)
def get_dataframe(dataset_id: str, limit: Optional[int] = None) -> pd.DataFrame:
    return load_dataframe(dataset_id, limit)


def datasets_page() -> None:
    """Render the dataset governance page using catalog & profiling data."""
    try:
        remote_datasets = list_datasets()
        using_api = bool(remote_datasets)
    except BackendUnavailable:
        remote_datasets = []
        using_api = False

    catalog = load_catalog()
    if not catalog:
        st.warning("Aucun dataset référencé dans le catalogue. Téléchargez-les d'abord.")
        return

    processed_entries = [entry for entry in catalog if entry.processed_file.exists()]
    profiled_entries = [entry for entry in catalog if entry.profile]

    total_rows_local = sum(entry.row_count or 0 for entry in catalog)
    total_columns_local = sum(entry.column_count or 0 for entry in catalog)

    if using_api:
        total_rows_display = sum((item.get("rows") or 0) for item in remote_datasets)
        total_columns_display = sum((item.get("columns") or 0) for item in remote_datasets)
        processed_count_display = len(remote_datasets)
    else:
        total_rows_display = total_rows_local
        total_columns_display = total_columns_local
        processed_count_display = len(processed_entries)

    stroke = " via API" if using_api else " (mode local)"
    metric_cards(
        [
            {
                "icon": "🧾",
                "label": "Datasets catalogués",
                "value": str(len(catalog)),
                "helper": "Source : data/datasets_catalog.yml",
            },
            {
                "icon": "✅",
                "label": "Datasets disponibles",
                "value": str(processed_count_display),
                "helper": "Parquet local" if not using_api else "Réponse API",
            },
            {
                "icon": "📊",
                "label": "Profiling local",
                "value": str(len(profiled_entries)),
                "helper": "Statistiques générées via scripts/profile_datasets.py",
            },
            {
                "icon": "📦",
                "label": f"Volume total (lignes){stroke}",
                "value": f"{total_rows_display:,}".replace(",", " ") if total_rows_display else "—",
                "helper": f"Colonnes cumulées : {total_columns_display:,}".replace(",", " ") if total_columns_display else "",
            },
        ]
    )

    section_header(
        "Panorama du catalogue",
        "Répartition par catégorie et état de disponibilité.",
        icon="🌐",
    )

    category_counts = categories_summary(catalog)
    if category_counts:
        categories_df = (
            pd.DataFrame(
                [
                    {"Catégorie": category or "Non renseignée", "Datasets": count}
                    for category, count in category_counts.items()
                ]
            )
            .sort_values("Datasets", ascending=False)
        )
        fig = px.bar(
            categories_df,
            x="Catégorie",
            y="Datasets",
            title="Répartition des datasets par catégorie",
            text="Datasets",
            color="Datasets",
            color_continuous_scale="Blues",
        )
        fig.update_layout(template="plotly_white", margin=dict(l=20, r=20, t=60, b=40))
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Aucune catégorie définie dans le catalogue.")

    section_header(
        "Sélection du dataset",
        "Choisissez un dataset pour consulter ses métadonnées, profil qualité et échantillons.",
        icon="🗂️",
    )

    dataset_options = {entry.name: entry.id for entry in catalog}
    selected_name = st.selectbox("Dataset", options=list(dataset_options.keys()), index=0)
    selected_entry = next(entry for entry in catalog if entry.id == dataset_options[selected_name])

    api_detail = None
    if using_api:
        try:
            api_detail = dataset_detail(selected_entry.id)
        except BackendUnavailable:
            api_detail = None
            using_api = False

    column_summary: Dict[str, Dict[str, object]] = {}
    sample_rows: list[dict[str, object]] = []
    profile_available = False

    if api_detail:
        summary = api_detail.get("summary", {})
        selected_rows = summary.get("rows")
        selected_columns = summary.get("columns")
        column_summary = {
            item.get("column"): {k: v for k, v in item.items() if k != "column"}
            for item in api_detail.get("column_summary", [])
            if item.get("column")
        }
        sample_rows = api_detail.get("sample_rows", [])
        profile_available = api_detail.get("profile_available", False)
    elif selected_entry.profile:
        column_summary = selected_entry.profile.get("column_summary", {})
        sample_rows = selected_entry.profile.get("sample_rows", [])
        profile_available = True
        selected_rows = selected_entry.profile.get("rows") if isinstance(selected_entry.profile, dict) else None
        selected_columns = selected_entry.profile.get("columns") if isinstance(selected_entry.profile, dict) else None
    else:
        selected_rows = selected_entry.row_count
        selected_columns = selected_entry.column_count

    pills = []
    if selected_rows is not None:
        pills.append({"label": "Lignes", "value": f"{selected_rows:,}".replace(",", " ")})
    elif selected_entry.row_count is not None:
        pills.append({"label": "Lignes", "value": f"{selected_entry.row_count:,}".replace(",", " ")})
    if selected_columns is not None:
        pills.append({"label": "Colonnes", "value": str(selected_columns)})
    elif selected_entry.column_count is not None:
        pills.append({"label": "Colonnes", "value": str(selected_entry.column_count)})
    if selected_entry.license:
        pills.append({"label": "Licence", "value": selected_entry.license})
    if selected_entry.source_url:
        pills.append({"label": "Source", "value": "Kaggle"})

    stat_pills(pills)

    st.markdown(f"**Description** · {selected_entry.description}")
    if selected_entry.source_url:
        st.markdown(f"[Voir la source Kaggle]({selected_entry.source_url})")

    if not selected_entry.processed_file.exists() and not using_api:
        st.warning("Le fichier traité n'est pas encore disponible. Lancez `process_datasets.py`.")
        return

    if not profile_available and not using_api:
        st.info("Profil détaillé absent. Exécutez `profile_datasets.py` pour générer les statistiques.")

    col_left, col_right = st.columns((1.8, 1.2), gap="large")

    with col_left:
        section_header(
            "Aperçu des données",
            "Prévisualisation des premières lignes du fichier traité ou fournies par l'API.",
            icon="🔍",
        )
        if sample_rows:
            sample_df = pd.DataFrame(sample_rows)
        elif selected_entry.processed_file.exists():
            sample_df = get_dataframe(selected_entry.id, limit=10)
        else:
            sample_df = pd.DataFrame()

        if sample_df.empty:
            st.info("Impossible d'afficher un aperçu (dataset vide ou profil manquant).")
        else:
            st.dataframe(sample_df, use_container_width=True)

    with col_right:
        section_header(
            "Colonnes",
            "Type, complétude et dispersion.",
            icon="📇",
        )
        if column_summary:
            summary_rows = []
            for column, info in column_summary.items():
                summary_rows.append(
                    {
                        "Colonne": column,
                        "Type": info.get("dtype", ""),
                        "Non nuls": info.get("non_null", 0),
                        "Manquants %": info.get("missing_pct", 0.0),
                        "Unique": info.get("unique", 0),
                        "Min": info.get("min"),
                        "Max": info.get("max"),
                        "Moyenne": info.get("mean"),
                    }
                )
            summary_df = pd.DataFrame(summary_rows)
            st.dataframe(summary_df, use_container_width=True, hide_index=True)

            missing_df = summary_df.nlargest(10, "Manquants %")
            if not missing_df.empty and missing_df["Manquants %"].max() > 0:
                fig_missing = px.bar(
                    missing_df,
                    x="Colonne",
                    y="Manquants %",
                    title="Colonnes les plus manquantes",
                    color="Manquants %",
                    color_continuous_scale="Sunset",
                )
                fig_missing.update_layout(template="plotly_white", margin=dict(l=30, r=20, t=40, b=40))
                st.plotly_chart(fig_missing, use_container_width=True)
        else:
            st.info("Aucune statistique de colonnes disponible.")

    section_header(
        "Téléchargement",
        "Récupérez le fichier parquet traité pour vos analyses locales.",
        icon="💾",
    )
    if selected_entry.processed_file.exists():
        with selected_entry.processed_file.open("rb") as fh:
            st.download_button(
                label="Télécharger le fichier parquet",
                data=fh.read(),
                file_name=selected_entry.processed_file.name,
                mime="application/octet-stream",
            )
    else:
        st.caption("Fichier local indisponible : utilisez l'API pour consommer les données.")

    if using_api:
        st.caption("Données synchronisées via l'API backend (mode en ligne).")
    else:
        st.caption("Mode local : affichage basé sur les profils générés en phase 1.")

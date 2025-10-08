"""
INNOVA+ Santé — Models operations centre.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

from streamlit_app.utils.ui import metric_cards, section_header, stat_pills
from streamlit_app.lib.api_client import predict_hospital_risk, BackendUnavailable

MODELS: List[Dict[str, object]] = [
    {
        "key": "health_risk",
        "emoji": "❤️",
        "name": "Prédiction des risques sanitaires",
        "algorithm": "XGBoost",
        "version": "v1.7.0",
        "accuracy": 0.94,
        "precision": 0.90,
        "recall": 0.91,
        "f1": 0.905,
        "latency_ms": 380,
        "owner": "Cellule data clinique",
        "status": "Production",
        "last_training": "2024-09-27",
        "deployment_date": "2024-09-29",
        "serving": "API temps réel (GPU T4)",
        "retraining_cadence": "15 jours",
        "feature_importance": [
            {"feature": "age", "importance": 0.21},
            {"feature": "severity_score", "importance": 0.18},
            {"feature": "co_morbidities", "importance": 0.16},
            {"feature": "treatment_lines", "importance": 0.14},
            {"feature": "adherence_index", "importance": 0.11},
        ],
        "alerts": [
            "Monitoring drift stable (KS p-value 0.42)",
            "Aucune alerte critique sur les 7 derniers jours",
        ],
    },
    {
        "key": "nutrition",
        "emoji": "🥗",
        "name": "Recommandations nutritionnelles",
        "algorithm": "Random Forest",
        "version": "v2.3.1",
        "accuracy": 0.89,
        "precision": 0.87,
        "recall": 0.86,
        "f1": 0.875,
        "latency_ms": 280,
        "owner": "Pôle nutrition",
        "status": "Production",
        "last_training": "2024-09-18",
        "deployment_date": "2024-09-20",
        "serving": "Batch quotidien + API",
        "retraining_cadence": "30 jours",
        "feature_importance": [
            {"feature": "macro_ratio", "importance": 0.22},
            {"feature": "activity_minutes", "importance": 0.19},
            {"feature": "dietary_goal", "importance": 0.17},
            {"feature": "sleep_efficiency", "importance": 0.13},
            {"feature": "stress_level", "importance": 0.1},
        ],
        "alerts": [
            "Suggestion : recalibrer la pondération des apports lipidiques",
            "Latence moyenne 280 ms (objectif < 300 ms)",
        ],
    },
    {
        "key": "anomalies",
        "emoji": "🩺",
        "name": "Détection d'anomalies médicales",
        "algorithm": "Auto-encoder",
        "version": "v1.12.0",
        "accuracy": 0.92,
        "precision": 0.88,
        "recall": 0.90,
        "f1": 0.89,
        "latency_ms": 460,
        "owner": "Unité vigilance",
        "status": "Production",
        "last_training": "2024-09-05",
        "deployment_date": "2024-09-06",
        "serving": "Streaming Kafka",
        "retraining_cadence": "Hebdomadaire",
        "feature_importance": [
            {"feature": "abnormal_value_zscore", "importance": 0.24},
            {"feature": "trend_break", "importance": 0.2},
            {"feature": "device_reliability", "importance": 0.15},
            {"feature": "patient_risk_score", "importance": 0.14},
            {"feature": "clinic_id", "importance": 0.09},
        ],
        "alerts": [
            "Alerte niveau 1 : surveiller dérive capteurs cardio",
            "Retraining programmé demain 03:00",
        ],
    },
    {
        "key": "epidemiology",
        "emoji": "🦠",
        "name": "Prévision épidémiologique",
        "algorithm": "Temporal Fusion Transformer",
        "version": "v0.9.4",
        "accuracy": 0.87,
        "precision": 0.84,
        "recall": 0.88,
        "f1": 0.86,
        "latency_ms": 620,
        "owner": "Veille sanitaire",
        "status": "Production",
        "last_training": "2024-09-22",
        "deployment_date": "2024-09-23",
        "serving": "Batch journalier",
        "retraining_cadence": "7 jours",
        "feature_importance": [
            {"feature": "mobility_index", "importance": 0.2},
            {"feature": "vaccination_rate", "importance": 0.19},
            {"feature": "temperature_anomaly", "importance": 0.14},
            {"feature": "pollution_index", "importance": 0.12},
            {"feature": "hospital_capacity", "importance": 0.1},
        ],
        "alerts": [
            "Nouvelle vague grippale détectée dans 3 régions",
            "Planification d'un recalibrage sur données locales",
        ],
    },
]

MODELS_LOOKUP: Dict[str, Dict[str, object]] = {model["key"]: model for model in MODELS}
MODELS_DF = pd.DataFrame(MODELS)


def _history_dataframe(model_key: str, periods: int = 12) -> pd.DataFrame:
    """Generate synthetic monitoring history for a given model."""
    rng = np.random.default_rng(abs(hash(model_key)) % (2**32))
    dates = pd.date_range(end=pd.Timestamp.today(), periods=periods, freq="W")

    base_accuracy = MODELS_LOOKUP[model_key]["accuracy"]
    base_recall = MODELS_LOOKUP[model_key]["recall"]
    base_precision = MODELS_LOOKUP[model_key]["precision"]

    accuracy = np.clip(rng.normal(base_accuracy, 0.01, size=periods), 0.8, 0.98)
    recall = np.clip(rng.normal(base_recall, 0.015, size=periods), 0.78, 0.97)
    precision = np.clip(rng.normal(base_precision, 0.012, size=periods), 0.78, 0.97)

    return pd.DataFrame(
        {
            "date": dates,
            "accuracy": accuracy,
            "recall": recall,
            "precision": precision,
        }
    )


def models_page() -> None:
    """Render the MLOps cockpit for INNOVA+ models."""
    metric_cards(
        [
            {
                "icon": "🚀",
                "label": "Modèles en production",
                "value": str(len(MODELS)),
                "helper": "Couverture risques, nutrition, anomalies, épidémies",
            },
            {
                "icon": "🎯",
                "label": "Précision moyenne",
                "value": f"{MODELS_DF['accuracy'].mean():.2f}",
                "delta": "± 0.04",
                "helper": "Basée sur la validation 30 derniers jours",
            },
            {
                "icon": "🔄",
                "label": "Dernier redéploiement",
                "value": "3 jours",
                "helper": "Cycle moyen : 18 jours",
            },
            {
                "icon": "🛡️",
                "label": "Alertes critiques",
                "value": "0",
                "helper": "Monitoring en continu",
            },
        ]
    )

    section_header(
        "Performance globale",
        "Comparaison des scores et latences des modèles en production.",
        icon="🎛️",
    )

    performance_df = MODELS_DF.melt(
        id_vars=["emoji", "name"],
        value_vars=["accuracy", "precision", "recall"],
        var_name="metric",
        value_name="score",
    )

    col_scores, col_latency = st.columns((1.7, 1.1), gap="large")

    with col_scores:
        fig_scores = px.bar(
            performance_df,
            x="name",
            y="score",
            color="metric",
            barmode="group",
            color_discrete_sequence=px.colors.sequential.Aggrnyl,
        )
        fig_scores.update_layout(
            template="plotly_dark",
            margin=dict(l=30, r=20, t=40, b=40),
            yaxis=dict(range=[0.7, 1.0], tickformat=".0%"),
            xaxis_title="Modèle",
            yaxis_title="Score",
            legend_title="Métrique",
        )
        st.plotly_chart(fig_scores, use_container_width=True)

    with col_latency:
        latency_df = MODELS_DF[["name", "latency_ms"]]
        fig_latency = px.bar(
            latency_df,
            x="latency_ms",
            y="name",
            orientation="h",
            color_discrete_sequence=["#a855f7"],
            labels={"latency_ms": "Latence (ms)", "name": ""},
        )
        fig_latency.update_layout(
            template="plotly_dark",
            margin=dict(l=10, r=10, t=40, b=40),
            height=380,
        )
        st.plotly_chart(fig_latency, use_container_width=True)

    section_header(
        "Explorateur de modèles",
        "Sélectionnez un modèle pour consulter ses courbes de monitoring et sa gouvernance.",
        icon="🧭",
    )

    selected_key = st.selectbox(
        "Modèle",
        options=[model["key"] for model in MODELS],
        format_func=lambda key: f"{MODELS_LOOKUP[key]['emoji']} {MODELS_LOOKUP[key]['name']}",
        label_visibility="collapsed",
    )
    selected = MODELS_LOOKUP[selected_key]

    last_training = datetime.strptime(str(selected["last_training"]), "%Y-%m-%d")
    days_since_training = (datetime.utcnow().date() - last_training.date()).days

    stat_pills(
        [
            {"label": "Propriétaire", "value": str(selected["owner"])},
            {"label": "Algorithme", "value": str(selected["algorithm"])},
            {"label": "Dernier entraînement", "value": f"J-{days_since_training}"},
        ]
    )

    metric_cards(
        [
            {
                "icon": "🎯",
                "label": "Précision",
                "value": f"{selected['accuracy']:.2f}",
                "helper": f"Version {selected['version']}",
            },
            {
                "icon": "🤝",
                "label": "F1-score",
                "value": f"{selected['f1']:.2f}",
                "delta": f"Rappel {selected['recall']:.2f}",
                "helper": f"Précision {selected['precision']:.2f}",
            },
            {
                "icon": "⚡",
                "label": "Latence",
                "value": f"{selected['latency_ms']} ms",
                "helper": selected["serving"],
            },
        ]
    )

    tab_performance, tab_explainability, tab_mlops = st.tabs(
        ["Performance", "Explicabilité", "MLOps & observabilité"]
    )

    with tab_performance:
        history_df = _history_dataframe(selected_key)
        history_long = history_df.melt(
            id_vars=["date"],
            value_vars=["accuracy", "precision", "recall"],
            var_name="metric",
            value_name="score",
        )
        fig_history = px.line(
            history_long,
            x="date",
            y="score",
            color="metric",
            markers=True,
            color_discrete_sequence=px.colors.sequential.Agsunset,
        )
        fig_history.update_layout(
            template="plotly_dark",
            margin=dict(l=30, r=10, t=40, b=30),
            yaxis=dict(range=[0.75, 1.0], tickformat=".0%"),
            xaxis_title="",
            yaxis_title="Score",
            legend_title="",
        )
        st.plotly_chart(fig_history, use_container_width=True)

        stat_pills(
            [
                {"label": "Drift data", "value": "0.018"},
                {"label": "Incidents 30j", "value": "0"},
                {"label": "Population active", "value": "57 k"},
            ]
        )

    with tab_explainability:
        fi_df = pd.DataFrame(selected["feature_importance"])
        fig_fi = px.bar(
            fi_df,
            x="importance",
            y="feature",
            orientation="h",
            color="importance",
            color_continuous_scale=px.colors.sequential.Sunset,
        )
        fig_fi.update_layout(
            template="plotly_dark",
            margin=dict(l=40, r=10, t=40, b=40),
            height=360,
            coloraxis_showscale=False,
        )
        st.plotly_chart(fig_fi, use_container_width=True)

        st.markdown("**Insights clés**")
        st.markdown(
            "\n".join(
                f"- Importance de {row['feature']} : {row['importance'] * 100:.1f} %"
                for row in selected["feature_importance"]
            )
        )

    with tab_mlops:
        st.markdown("**Pipeline & opérations**")
        st.markdown(
            f"- Redeploiement : {selected['deployment_date']}"
            f"\n- Cadence de retraining : {selected['retraining_cadence']}"
            f"\n- Mode de serving : {selected['serving']}"
        )

        st.markdown("**Journal des alertes**")
        st.markdown("\n".join(f"- {alert}" for alert in selected["alerts"]))

        stat_pills(
            [
                {"label": "Statut", "value": str(selected["status"])},
                {"label": "Latence", "value": f"{selected['latency_ms']} ms"},
                {"label": "Next retraining", "value": selected["retraining_cadence"]},
            ]
        )

    section_header(
        "Synthèse fleet",
        "Vue tabulaire des modèles et indicateurs principaux.",
        icon="📋",
    )

    summary = MODELS_DF[
        [
            "emoji",
            "name",
            "version",
            "algorithm",
            "accuracy",
            "precision",
            "recall",
            "latency_ms",
            "last_training",
        ]
    ].rename(
        columns={
            "emoji": "",
            "name": "Modèle",
            "version": "Version",
            "algorithm": "Algorithme",
            "accuracy": "Accuracy",
            "precision": "Précision",
            "recall": "Rappel",
            "latency_ms": "Latence (ms)",
            "last_training": "Dernier entraînement",
        }
    )
    st.dataframe(summary, use_container_width=True, hide_index=True)

    section_header(
        "Démo API prédictive",
        "Envoyez des paramètres patients et obtenez un score de risque (modèle hospital_risk).",
        icon="🧪",
    )
    with st.form("hospital-risk-form"):
        col_a, col_b, col_c = st.columns(3)
        with col_a:
            age = st.number_input("Âge", min_value=0, max_value=120, value=55)
            bmi = st.number_input("BMI", min_value=10.0, max_value=60.0, value=27.5)
        with col_b:
            severity = st.slider("Indice de sévérité", 0.0, 10.0, 6.5)
            length_of_stay = st.number_input("Durée de séjour (jours)", min_value=0.0, max_value=30.0, value=4.0)
        with col_c:
            chronic = st.number_input("Comorbidités", min_value=0, max_value=10, value=1)
        submitted = st.form_submit_button("Calculer le risque")

    if submitted:
        try:
            response = predict_hospital_risk([
                {
                    "age": age,
                    "severity_score": severity,
                    "bmi": bmi,
                    "length_of_stay": length_of_stay,
                    "chronic_conditions": chronic,
                }
            ])
            details = response.get("details", [])
            if details:
                score = details[0]["risk_probability"] * 100
                st.success(f"Probabilité de risque : {score:.1f} % (label: {details[0]['risk_label']})")
            else:
                st.warning("Réponse inattendue de l'API.")
        except BackendUnavailable as exc:
            st.error(f"API indisponible : {exc}")

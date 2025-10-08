"""
INNOVA+ Santé — Tableau de bord modernisé.
"""

from __future__ import annotations

from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from streamlit_app.utils.ui import metric_cards, section_header, stat_pills


@st.cache_data
def _generate_prediction_activity(days: int = 30) -> pd.DataFrame:
    """Simulate daily prediction activity for the past days days."""
    today = datetime.utcnow().date()
    dates = pd.date_range(end=today, periods=days)
    base = np.linspace(42, 95, num=days)
    noise = np.random.normal(0, 6, size=days)
    values = np.clip(base + noise, a_min=12, a_max=None).round()
    return pd.DataFrame({"date": dates, "predictions": values})


@st.cache_data
def _generate_chatbot_usage(days: int = 14) -> pd.DataFrame:
    """Simulate chatbot interaction statistics."""
    today = datetime.utcnow().date()
    dates = pd.date_range(end=today, periods=days)
    conversations = np.random.poisson(lam=80, size=days)
    satisfaction = np.clip(np.random.normal(92, 3, size=days), 80, 99)
    return pd.DataFrame(
        {
            "date": dates,
            "conversations": conversations,
            "taux_satisfaction": satisfaction,
        }
    )


def dashboard_page() -> None:
    """Render the main monitoring dashboard."""
    metric_cards(
        [
            {
                "icon": "🗂️",
                "label": "Datasets actifs",
                "value": "10",
                "delta": "▲ +2 vs semaine dernière",
                "helper": "Indice qualité moyen : 92 %",
            },
            {
                "icon": "🤖",
                "label": "Modèles déployés",
                "value": "4",
                "delta": "▲ +1 nouvelle version",
                "helper": "Temps moyen d'inférence : 420 ms",
            },
            {
                "icon": "💬",
                "label": "Sessions chatbot (30j)",
                "value": "1 247",
                "delta": "▲ +23 %",
                "helper": "Score satisfaction : 94 %",
            },
            {
                "icon": "📈",
                "label": "Prédictions aujourd'hui",
                "value": "89",
                "delta": "▲ +12 % vs hier",
                "helper": "Alertes critiques : 0",
            },
        ]
    )

    section_header(
        "Flux prédictif",
        "Activation quotidienne des pipelines d'inférence sur les 30 derniers jours.",
        icon="⚡",
    )

    predictions_df = _generate_prediction_activity()
    col_activity, col_distribution = st.columns((2, 1.2), gap="large")

    with col_activity:
        fig = px.line(
            predictions_df,
            x="date",
            y="predictions",
            markers=True,
            title="Volume quotidien de prédictions",
            color_discrete_sequence=["#38bdf8"],
        )
        fig.update_layout(
            template="plotly_dark",
            margin=dict(l=40, r=12, t=60, b=30),
            yaxis_title="Prédictions",
            xaxis_title="",
            hovermode="x unified",
        )
        st.plotly_chart(fig, use_container_width=True)

    with col_distribution:
        latest_value = int(predictions_df.iloc[-1]["predictions"])
        fig = go.Figure(
            go.Indicator(
                mode="gauge+number+delta",
                value=latest_value,
                number={"suffix": " préd./jour"},
                delta={"reference": int(predictions_df["predictions"].mean()), "increasing": {"color": "#38bdf8"}},
                title={"text": "Charge actuelle", "font": {"color": "#e2e8f0"}},
                gauge={
                    "axis": {"range": [0, max(120, latest_value + 10)]},
                    "bar": {"color": "#a855f7"},
                    "steps": [
                        {"range": [0, 60], "color": "rgba(56,189,248,0.28)"},
                        {"range": [60, 90], "color": "rgba(168,85,247,0.25)"},
                    ],
                },
            )
        )
        fig.update_layout(
            template="plotly_dark",
            margin=dict(l=24, r=24, t=50, b=10),
            height=360,
        )
        st.plotly_chart(fig, use_container_width=True)

    section_header(
        "Utilisation du copilote clinique",
        "Suivi de la relation utilisateurs ↔ chatbot RAG sur deux semaines.",
        icon="💡",
    )

    usage_df = _generate_chatbot_usage()
    tab_interactions, tab_questions = st.tabs(["Interactions", "Questions fréquentes"])

    with tab_interactions:
        fig = px.area(
            usage_df,
            x="date",
            y="conversations",
            title="Engagement quotidien",
            color_discrete_sequence=["rgba(56,189,248,0.65)"],
        )
        fig.update_traces(mode="lines", line_shape="spline")
        fig.update_layout(
            template="plotly_dark",
            margin=dict(l=36, r=16, t=58, b=30),
            xaxis_title="",
            yaxis_title="Sessions",
        )
        st.plotly_chart(fig, use_container_width=True)

        stat_pills(
            [
                {"label": "Satisfaction", "value": f"{usage_df['taux_satisfaction'].mean():.1f} %"},
                {"label": "Pic journalier", "value": f"{usage_df['conversations'].max()} sessions"},
                {"label": "Taux de résolution", "value": "87 %"},
            ]
        )

    with tab_questions:
        top_questions = pd.DataFrame(
            {
                "Requête": [
                    "Quels sont les facteurs de risque cardiovasculaire ?",
                    "Comment interpréter mon bilan nutritionnel ?",
                    "Quelle est la tendance épidémiologique actuelle ?",
                    "Comment optimiser mon entraînement ?",
                    "Quels impacts de la pollution sur la santé ?",
                ],
                "Fréquence": [45, 38, 32, 28, 25],
            }
        )
        st.dataframe(top_questions, use_container_width=True, hide_index=True)

    section_header(
        "Alertes & opérations",
        "Points d'attention générés automatiquement par les observateurs IA.",
        icon="🛡️",
    )

    col_alert_a, col_alert_b, col_alert_c = st.columns(3, gap="large")

    with col_alert_a:
        st.success(
            "🛠️ **Maintenance pipeline** — Redéploiement réussi du modèle Nutrition v1.4."
        )

    with col_alert_b:
        st.warning(
            "📉 **Dérive détectée** — Dataset télémedecine : vérifier la complétude des formulaires patients."
        )

    with col_alert_c:
        st.info(
            "📚 **Base documentaire** — 18 nouvelles ressources intégrées dans le corpus RAG."
        )

    stat_pills(
        [
            {"label": "Latence API", "value": "420 ms"},
            {"label": "Disponibilité", "value": "99.4 %"},
            {"label": "Temps de réponse chatbot", "value": "2.1 s"},
        ]
    )

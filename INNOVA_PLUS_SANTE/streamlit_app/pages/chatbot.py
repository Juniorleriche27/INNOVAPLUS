"""
INNOVA+ Santé — Clinical copilot (RAG) experience.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st

from streamlit_app.utils.ui import metric_cards, section_header, stat_pills

CHATBOT_CONFIG: Dict[str, str] = {
    "name": "Dr. INNOVA+",
    "version": "2.3.0",
    "embedding_model": "text-embedding-3-large",
    "generation_model": "GPT-4o mini",
    "knowledge_base": "Corpus clinique & guidelines",
    "datasets_connected": "10 datasets",
    "models_connected": "4 modèles IA",
}

KNOWLEDGE_SOURCES = [
    {
        "Collection": "Guidelines HAS",
        "Domaine": "Soins hospitaliers",
        "Documents": 182,
        "Dernière mise à jour": "2024-09-30",
    },
    {
        "Collection": "Protocoles nutrition",
        "Domaine": "Nutrition",
        "Documents": 128,
        "Dernière mise à jour": "2024-09-28",
    },
    {
        "Collection": "Essais cliniques",
        "Domaine": "Recherche clinique",
        "Documents": 94,
        "Dernière mise à jour": "2024-09-26",
    },
    {
        "Collection": "Veille épidémiologique",
        "Domaine": "Santé publique",
        "Documents": 156,
        "Dernière mise à jour": "2024-09-29",
    },
]


@st.cache_data
def _usage_activity(periods: int = 14) -> pd.DataFrame:
    """Generate synthetic usage statistics for the chatbot."""
    rng = np.random.default_rng(2024)
    dates = pd.date_range(end=pd.Timestamp.today(), periods=periods)
    sessions = rng.poisson(lam=110, size=periods)
    satisfaction = np.clip(rng.normal(94, 2.5, size=periods), 86, 99)
    avg_latency = np.clip(rng.normal(2.1, 0.3, size=periods), 1.4, 3.5)
    return pd.DataFrame(
        {
            "date": dates,
            "sessions": sessions,
            "satisfaction": satisfaction,
            "latency": avg_latency,
        }
    )


def _simulate_response(message: str) -> Dict[str, object]:
    """Generate a contextual answer based on simple heuristics."""
    lower = message.lower()
    timestamp = datetime.utcnow().strftime("%Hh%M")

    if "nutrition" in lower or "aliment" in lower:
        answer = (
            "**Synthèse nutritionnelle**\n\n"
            "- Apport calorique recommandé : 1 950 kcal/jour selon le profil actuel.\n"
            "- Ratio conseillé : 45 % glucides, 25 % protéines, 30 % lipides.\n"
            "- Ajuster l'apport en oméga-3 (+12 %) pour réduire l'inflammation chronique.\n\n"
            "**Prochaine action**\nProgramme repas personnalisé envoyé au coach nutrition (notification {timestamp})."
        )
        sources = ["Guide HAS 2024 - Nutrition", "Dataset Nutrition · lot #2024-09-28"]
    elif "risque" in lower or "cardio" in lower:
        answer = (
            "**Score de risque cardiovasculaire**\n\n"
            "- Probabilité sur 12 mois : 14.8 % (modèle XGBoost v1.7.0).\n"
            "- Facteurs contributifs principaux : hypertension (0.28), IMC (0.24), tabac (0.18).\n"
            "- Recommandation : plan de suivi hebdomadaire + consultation cardiologie sous 30 jours."
        )
        sources = ["Rapport clinique patient #45621", "Guideline ESC 2023"]
    elif "épid" in lower or "grippe" in lower:
        answer = (
            "**Projection épidémiologique**\n\n"
            "- Incidence projetée grippe S+2 : +18 % (intervalle 12-24 %).\n"
            "- Régions à surveiller : IDF, ARA, PACA.\n"
            "- Conseils : déclencher campagne vaccination ciblée + renforcer lits réa (+12 %)."
        )
        sources = ["Dashboard surveillance Semaine 39", "Dataset Épidémiologie · 2024-09-28"]
    else:
        answer = (
            "**Analyse clinique**\n\n"
            "- Données patient intégrées.\n"
            "- Aucun signal critique détecté.\n"
            "- Pour approfondir : demander un rapport PDF détaillé ou consulter les mesures en temps réel."
        )
        sources = ["Knowledge base INNOVA+", "Logs inférence temps réel"]

    return {"answer": answer, "sources": sources}


def _render_chat_interface() -> None:
    """Render the Streamlit chat interface with the simulated backend."""
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    for message in st.session_state.chat_history:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
            if message["role"] == "assistant" and message.get("sources"):
                st.caption("Sources : " + " · ".join(message["sources"]))

    prompt = st.chat_input("Posez une question clinique, ex: 'Quel est le risque cardio ?'")
    if prompt:
        st.session_state.chat_history.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        response = _simulate_response(prompt)
        st.session_state.chat_history.append(
            {
                "role": "assistant",
                "content": response["answer"],
                "sources": response["sources"],
            }
        )
        with st.chat_message("assistant"):
            st.markdown(response["answer"])
            st.caption("Sources : " + " · ".join(response["sources"]))


def chatbot_page() -> None:
    """Render the modernised chatbot / RAG interface."""
    usage_df = _usage_activity()

    metric_cards(
        [
            {
                "icon": "💬",
                "label": "Conversations aujourd'hui",
                "value": "132",
                "delta": "▲ +18 %",
                "helper": "Utilisateurs actifs : 56 praticiens",
            },
            {
                "icon": "🧠",
                "label": "Sources RAG",
                "value": "4 collections",
                "helper": CHATBOT_CONFIG["knowledge_base"],
            },
            {
                "icon": "⚡",
                "label": "Latence moyenne",
                "value": "2.1 s",
                "helper": "Pipeline RAG/vector store", 
            },
            {
                "icon": "👍",
                "label": "Satisfaction",
                "value": "94 %",
                "delta": "95e percentile : 98 %",
                "helper": "NPS praticiens +42",
            },
        ]
    )

    section_header(
        "Session active",
        "Discutez avec le copilote clinique augmenté par RAG & modèles prédictifs.",
        icon="🤝",
    )

    chat_col, status_col = st.columns((1.8, 1), gap="large")

    with chat_col:
        _render_chat_interface()

    with status_col:
        st.markdown("**Configuration**")
        st.markdown(
            "\n".join(
                f"- **{label}** : {value}" for label, value in CHATBOT_CONFIG.items()
            )
        )
        stat_pills(
            [
                {"label": "Embedding", "value": CHATBOT_CONFIG["embedding_model"]},
                {"label": "Génération", "value": CHATBOT_CONFIG["generation_model"]},
                {"label": "Collections", "value": "4"},
            ]
        )

        st.markdown("**Santé du service**")
        st.success("API live • 99.7 % disponibilité")
        st.info("Index vectoriel synchronisé le 2024-09-30")

    section_header(
        "Analytics d'usage",
        "Tendances des conversations, latence et satisfaction utilisateurs.",
        icon="📊",
    )

    tab_activity, tab_sources, tab_monitoring = st.tabs(
        ["Activité", "Sources & couverture", "Monitoring"]
    )

    with tab_activity:
        fig_sessions = px.area(
            usage_df,
            x="date",
            y="sessions",
            title="Volume quotidien",
            color_discrete_sequence=["rgba(56,189,248,0.65)"],
        )
        fig_sessions.update_traces(mode="lines", line_shape="spline")
        fig_sessions.update_layout(
            template="plotly_dark",
            margin=dict(l=30, r=20, t=40, b=30),
            xaxis_title="",
            yaxis_title="Sessions",
        )
        st.plotly_chart(fig_sessions, use_container_width=True)

        stat_pills(
            [
                {"label": "Pic 7j", "value": f"{usage_df['sessions'].max()} conversations"},
                {"label": "Latence moyenne", "value": f"{usage_df['latency'].mean():.1f} s"},
                {"label": "Satisfaction", "value": f"{usage_df['satisfaction'].mean():.1f} %"},
            ]
        )

    with tab_sources:
        st.dataframe(pd.DataFrame(KNOWLEDGE_SOURCES), use_container_width=True, hide_index=True)
        st.markdown("**Couverture thématique**")
        st.markdown(
            "- Soins critiques : 38 %\n"
            "- Prévention : 27 %\n"
            "- Recherche clinique : 22 %\n"
            "- Santé publique : 13 %"
        )

    with tab_monitoring:
        fig_latency = px.line(
            usage_df,
            x="date",
            y="latency",
            title="Latence moyenne",
            color_discrete_sequence=["#a855f7"],
        )
        fig_latency.update_traces(mode="lines+markers")
        fig_latency.update_layout(
            template="plotly_dark",
            margin=dict(l=30, r=10, t=40, b=30),
            xaxis_title="",
            yaxis_title="Secondes",
        )
        st.plotly_chart(fig_latency, use_container_width=True)

        st.markdown("**Alertes récentes**")
        st.warning("Taux de rephrasing +9 % → ajuster les prompts guidance.")
        st.success("Retention contextual embeddings stable (drift 0.012)")

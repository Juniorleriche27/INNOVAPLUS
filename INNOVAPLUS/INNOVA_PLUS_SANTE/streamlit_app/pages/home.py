"""
KORYXA Santé — Accueil et synthèse exécutive.
"""

from __future__ import annotations

from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st

from streamlit_app.utils.ui import metric_cards, section_header, stat_pills


def _news_feed() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Date": datetime.now().strftime("%d/%m/%Y"),
                "Initiative": "Déploiement du copilote clinique v2.3",
                "Impact": "+23 % satisfaction praticiens",
            },
            {
                "Date": (datetime.now()).strftime("%d/%m/%Y"),
                "Initiative": "Certification HDS renouvelée",
                "Impact": "Conformité hébergement santé validée",
            },
            {
                "Date": (datetime.now()).strftime("%d/%m/%Y"),
                "Initiative": "Nouveau pipeline nutrition personnalisé",
                "Impact": "Coaching IA sur 1 200 patients",
            },
        ]
    )


def _engagement_chart() -> None:
    timeline = pd.date_range(end=pd.Timestamp.today(), periods=10, freq="ME")
    df = pd.DataFrame(
        {
            "date": timeline,
            "Projets IA": [3, 4, 5, 7, 9, 10, 12, 14, 15, 18],
            "Utilisateurs": [45, 63, 88, 120, 156, 201, 248, 296, 332, 385],
        }
    )

    long_df = df.melt("date", var_name="Indicateur", value_name="Valeur")
    fig = px.line(
        long_df,
        x="date",
        y="Valeur",
        color="Indicateur",
        color_discrete_sequence=["#2563eb", "#0ea5e9"],
    )
    fig.update_traces(mode="lines+markers")
    fig.update_layout(
        template="plotly_white",
        margin=dict(l=30, r=10, t=30, b=20),
        legend_title="",
        xaxis_title="",
    )
    st.plotly_chart(fig, use_container_width=True)


def home_page() -> None:
    """Render the welcome and overview page."""
    metric_cards(
        [
            {
                "icon": "🚀",
                "label": "Innovations IA actives",
                "value": "18",
                "delta": "▲ +4 depuis Q2",
                "helper": "Couvrent soins critiques, prévention et bien-être",
            },
            {
                "icon": "👩‍⚕️",
                "label": "Praticiens engagés",
                "value": "385",
                "delta": "▲ +19 cette semaine",
                "helper": "Utilisateurs du copilote clinique",
            },
            {
                "icon": "📚",
                "label": "Sources de connaissances",
                "value": "240",
                "helper": "Guidelines, protocoles, publications intégrées",
            },
            {
                "icon": "🔐",
                "label": "Conformité",
                "value": "100 %",
                "helper": "HDS, RGPD, ISO 27001 aligné",
            },
        ]
    )

    section_header(
        "Navigation rapide",
        "Passez à l'action en un clic sur les modules clés de la plateforme.",
        icon="✨",
    )

    col1, col2, col3 = st.columns(3)
    card_style = (
        "background: rgba(255,255,255,0.98); border: 1px solid rgba(226,232,240,0.85);"
        "border-radius: 22px; padding: 1.3rem 1.4rem; box-shadow: 0 18px 42px rgba(15,23,42,0.08);"
    )

    with col1:
        st.markdown(
            f"""
            <div style="{card_style}">
                <h4 style="margin:0; color:#0f172a;">📊 Monitoring temps réel</h4>
                <p style="margin-top:0.65rem; color:#475569;">Suivez les prédictions IA, alertes qualité et volumétrie des flux.</p>
                <p style="margin:0; font-weight:600; color:#2563eb;">Accéder au tableau de bord →</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col2:
        st.markdown(
            f"""
            <div style="{card_style}">
                <h4 style="margin:0; color:#0f172a;">🧾 Gouvernance data</h4>
                <p style="margin-top:0.65rem; color:#475569;">Consultez la qualité, la fraîcheur et les usages des datasets santé.</p>
                <p style="margin:0; font-weight:600; color:#2563eb;">Explorer le catalogue →</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col3:
        st.markdown(
            f"""
            <div style="{card_style}">
                <h4 style="margin:0; color:#0f172a;">💬 Copilote clinique</h4>
                <p style="margin-top:0.65rem; color:#475569;">Demandez des analyses patient, recommandations nutrition et projections.</p>
                <p style="margin:0; font-weight:600; color:#2563eb;">Démarrer une session →</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

    section_header(
        "Adoption & impact",
        "Croissance de l'utilisation de la plateforme IA et bénéfices observés.",
        icon="📈",
    )

    stat_pills(
        [
            {"label": "ROI moyen", "value": "2.6 x"},
            {"label": "Temps d'analyse gagné", "value": "-38 %"},
            {"label": "Patients accompagnés", "value": "12 400"},
        ]
    )

    _engagement_chart()

    section_header(
        "Actualités produit",
        "Les trois dernières évolutions marquantes d'KORYXA Santé.",
        icon="📰",
    )

    st.dataframe(_news_feed(), use_container_width=True, hide_index=True)

    section_header(
        "Objectifs du trimestre",
        "Axes de focalisation IA & data pour les équipes médicales et produit.",
        icon="🎯",
    )

    objectives = [
        "Déployer la surveillance dérive pour 100 % des modèles en production",
        "Industrialiser la personnalisation nutrition (pipeline batch + temps réel)",
        "Renforcer l'onboarding data : documentation, quality checks automatisés",
        "Étendre le corpus RAG aux protocoles régionaux et retours d'expérience",
    ]
    st.markdown("\n".join(f"- {item}" for item in objectives))


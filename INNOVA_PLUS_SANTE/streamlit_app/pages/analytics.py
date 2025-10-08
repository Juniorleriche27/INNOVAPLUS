"""
INNOVA+ Santé — Augmented analytics workspace.
"""

from __future__ import annotations


import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from streamlit_app.utils.ui import metric_cards, section_header, stat_pills


def _timeseries(periods: int = 60) -> pd.DataFrame:
    rng = np.random.default_rng(42)
    dates = pd.date_range(end=pd.Timestamp.today(), periods=periods)
    baseline = 420 + np.sin(np.linspace(0, 3.2, periods)) * 35
    admissions = np.clip(baseline + rng.normal(0, 18, periods), 320, None)
    anomalies = np.clip(rng.normal(24, 3.5, periods), 15, 36)
    nutrition = np.clip(68 + rng.normal(0, 5, periods), 50, 90)
    risk_high = np.clip(rng.normal(18, 2, periods), 12, 24)
    risk_medium = np.clip(rng.normal(33, 3, periods), 24, 40)
    risk_low = 100 - risk_high - risk_medium
    return pd.DataFrame(
        {
            "date": dates,
            "admissions": admissions,
            "anomalies": anomalies,
            "nutrition_engagement": nutrition,
            "risk_high": risk_high,
            "risk_medium": risk_medium,
            "risk_low": risk_low,
        }
    )


def _segments(sample: int = 500) -> pd.DataFrame:
    rng = np.random.default_rng(19)
    cluster = rng.choice(
        ["Prévention", "Chronicité", "Suivi intensif"],
        size=sample,
        p=[0.42, 0.36, 0.22],
    )
    data = pd.DataFrame(
        {
            "cluster": cluster,
            "score_risque": np.clip(rng.normal(0.55, 0.18, sample), 0, 1),
            "engagement": np.clip(rng.normal(0.64, 0.15, sample), 0, 1),
            "cout_annuel": np.clip(rng.normal(2800, 620, sample), 900, 4800),
        }
    )
    return data


def _correlation_matrix() -> pd.DataFrame:
    rng = np.random.default_rng(7)
    cov = np.array(
        [
            [1.0, 0.62, 0.55, -0.32, 0.48],
            [0.62, 1.0, 0.44, -0.28, 0.51],
            [0.55, 0.44, 1.0, -0.22, 0.35],
            [-0.32, -0.28, -0.22, 1.0, -0.47],
            [0.48, 0.51, 0.35, -0.47, 1.0],
        ]
    )
    features = rng.multivariate_normal(np.zeros(5), cov, size=1200)
    columns = [
        "Score risque",
        "Stress",
        "Activité physique",
        "Sommeil",
        "Adhérence",
    ]
    df = pd.DataFrame(features, columns=columns)
    return df.corr()


def _recommendations() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Insight": "Patients à risque cardio",
                "Impact": "-15 % réadmissions",
                "Action recommandée": "Programme coaching + téléconsultation cardiologue",
            },
            {
                "Insight": "Nutrition et stress",
                "Impact": "+12 % satisfaction",
                "Action recommandée": "Ateliers nutrition + séances relaxation",
            },
            {
                "Insight": "Suivi télémédecine",
                "Impact": "-9 % temps de séjour",
                "Action recommandée": "Renforcer monitoring post-opératoire",
            },
            {
                "Insight": "Population chronique",
                "Impact": "+18 % observance",
                "Action recommandée": "Coach IA + rappels automatiques",
            },
            {
                "Insight": "Alertes environnement",
                "Impact": "-6 % passages urgences",
                "Action recommandée": "Notifications pollution/canicule ciblées",
            },
        ]
    )


def analytics_page() -> None:
    """Render the augmented analytics cockpit."""
    ts_df = _timeseries()
    segments_df = _segments()
    corr_df = _correlation_matrix()

    metric_cards(
        [
            {
                "icon": "🏥",
                "label": "Admissions 7j",
                "value": f"{int(ts_df.tail(7)['admissions'].sum()):,}".replace(",", " "),
                "delta": "▲ +6 %",
                "helper": "Flux stabilisé sur les 3 derniers jours",
            },
            {
                "icon": "🛡️",
                "label": "Alertes anomalies",
                "value": f"{ts_df['anomalies'].iloc[-1]:.0f}",
                "helper": "Algorithme auto-encoder",
            },
            {
                "icon": "🥗",
                "label": "Engagement nutrition",
                "value": f"{ts_df['nutrition_engagement'].iloc[-1]:.0f} %",
                "delta": "▲ +4 pts",
                "helper": "Campagne coaching digital",
            },
            {
                "icon": "📉",
                "label": "Risque élevé",
                "value": f"{ts_df['risk_high'].iloc[-1]:.1f} %",
                "helper": "Population surveillée",
            },
        ]
    )

    section_header(
        "Tendances & prévisions",
        "Visualisation combinée des flux d'admissions et des indicateurs de risque.",
        icon="📈",
    )

    col_admissions, col_risks = st.columns((1.6, 1.4), gap="large")

    with col_admissions:
        fig_admissions = px.line(
            ts_df,
            x="date",
            y="admissions",
            title="Admissions quotidiennes",
            color_discrete_sequence=["#38bdf8"],
        )
        fig_admissions.update_traces(mode="lines+markers")
        fig_admissions.update_layout(
            template="plotly_dark",
            margin=dict(l=30, r=20, t=50, b=30),
            xaxis_title="",
            yaxis_title="Admissions",
        )
        st.plotly_chart(fig_admissions, use_container_width=True)

    with col_risks:
        risk_df = ts_df.melt(
            id_vars="date",
            value_vars=["risk_high", "risk_medium", "risk_low"],
            var_name="niveau",
            value_name="ratio",
        )
        fig_risk = px.area(
            risk_df,
            x="date",
            y="ratio",
            color="niveau",
            title="Distribution des niveaux de risque",
            color_discrete_sequence=["#f87171", "#facc15", "#34d399"],
        )
        fig_risk.update_layout(
            template="plotly_dark",
            margin=dict(l=10, r=10, t=50, b=30),
            xaxis_title="",
            yaxis_title="% population",
            legend_title="",
        )
        st.plotly_chart(fig_risk, use_container_width=True)

    stat_pills(
        [
            {"label": "Tendance admissions", "value": "+6 %"},
            {"label": "Oscillation risques", "value": "±3.4 pts"},
            {"label": "Support télémed", "value": "+420 patients"},
        ]
    )

    section_header(
        "Segmentation populationnelle",
        "Vue clustering des patients par niveau de risque et engagement.",
        icon="🧬",
    )

    fig_segments = px.scatter(
        segments_df,
        x="engagement",
        y="score_risque",
        color="cluster",
        size="cout_annuel",
        hover_data={"cout_annuel": ":.0f"},
        labels={
            "engagement": "Engagement digital",
            "score_risque": "Score de risque",
            "cluster": "Segment",
        },
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig_segments.update_layout(
        template="plotly_dark",
        margin=dict(l=30, r=20, t=40, b=30),
        xaxis=dict(range=[0, 1]),
        yaxis=dict(range=[0, 1]),
    )
    st.plotly_chart(fig_segments, use_container_width=True)

    cluster_summary = segments_df.groupby("cluster").agg(
        Patients=("cluster", "count"),
        Risque_moyen=("score_risque", "mean"),
        Engagement_moyen=("engagement", "mean"),
        Coût_médian=("cout_annuel", "median"),
    )
    st.dataframe(
        cluster_summary.round({"Risque_moyen": 2, "Engagement_moyen": 2, "Coût_médian": 0}),
        use_container_width=True,
    )

    section_header(
        "Insights exploratoires",
        "Corrélations multi-domaines et recommandations d'action.",
        icon="🧠",
    )

    fig_corr = go.Figure(
        data=go.Heatmap(
            z=corr_df.values,
            x=corr_df.columns,
            y=corr_df.index,
            colorscale="Magma",
            zmin=-1,
            zmax=1,
        )
    )
    fig_corr.update_layout(
        template="plotly_dark",
        title="Corrélations croisées",
        margin=dict(l=50, r=20, t=60, b=40),
    )
    st.plotly_chart(fig_corr, use_container_width=True)

    recommendations_df = _recommendations()
    st.markdown("**Top recommandations IA**")
    st.dataframe(recommendations_df, use_container_width=True, hide_index=True)


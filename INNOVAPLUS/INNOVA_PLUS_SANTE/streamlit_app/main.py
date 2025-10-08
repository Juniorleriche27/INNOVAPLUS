"""
INNOVA+ Santé - modern Streamlit entrypoint with a refreshed navigation shell.
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from typing import Dict

import streamlit as st

APP_DIR = Path(__file__).resolve().parent
PARENT_DIR = APP_DIR.parent

if str(PARENT_DIR) not in sys.path:
    sys.path.append(str(PARENT_DIR))

from streamlit_app.pages.about import about_page
from streamlit_app.pages.analytics import analytics_page
from streamlit_app.pages.chatbot import chatbot_page
from streamlit_app.pages.dashboard import dashboard_page
from streamlit_app.pages.datasets import datasets_page
from streamlit_app.pages.home import home_page
from streamlit_app.pages.models import models_page
from streamlit_app.pages.lab import lab_page
from streamlit_app.utils.ui import inject_app_css, page_header

APP_META = {
    "title": "INNOVA+ Santé",
    "icon": "🧬",
    "tagline": "Plateforme d'IA et de data science pour la décision médicale augmentée.",
    "version": "2.1.0",
}

PageConfig = Dict[str, object]

PAGES: Dict[str, PageConfig] = {
    "home": {
        "label": "Accueil",
        "emoji": "🏠",
        "description": "Vue d'ensemble instantanée des innovations IA santé et des accès rapides.",
        "tags": ["Synthèse", "Actualités", "Raccourcis"],
        "renderer": home_page,
    },
    "dashboard": {
        "label": "Tableau de bord",
        "emoji": "📊",
        "description": "Monitorer en continu les flux de données, la qualité et l'usage des modèles.",
        "tags": ["Monitoring temps réel", "Qualité des données", "Alertes intelligentes"],
        "renderer": dashboard_page,
    },
    "datasets": {
        "label": "Datasets",
        "emoji": "📚",
        "description": "Explorer, profiler et gouverner les 10 jeux de données santé intégrés.",
        "tags": ["Catalogage", "Profiling automatique", "Observabilité"],
        "renderer": datasets_page,
    },
    "lab": {
        "label": "Laboratoire",
        "emoji": "🧪",
        "description": "Charger vos propres fichiers et lancer des analyses exploratoires rapides.",
        "tags": ["Upload", "Profiling utilisateur", "Préparation"],
        "renderer": lab_page,
    },
    "models": {
        "label": "Modèles",
        "emoji": "🤖",
        "description": "Piloter les pipelines prédictifs et suivre la dérive des performances IA.",
        "tags": ["MLOps", "Explainabilité", "Suivi des dérives"],
        "renderer": models_page,
    },
    "chatbot": {
        "label": "Assistant clinique",
        "emoji": "💬",
        "description": "Interroger le copilote RAG et obtenir des recommandations contextualisées.",
        "tags": ["RAG", "Explicabilité", "Support médical"],
        "renderer": chatbot_page,
    },
    "analytics": {
        "label": "Insights & analytics",
        "emoji": "📈",
        "description": "Découvrir les signaux forts via dashboards et analyses augmentées.",
        "tags": ["Visual analytics", "Exploration", "Décision"],
        "renderer": analytics_page,
    },
    "about": {
        "label": "À propos",
        "emoji": "ℹ️",
        "description": "Mission, conformité, gouvernance et vision produit d'INNOVA+ Santé.",
        "tags": ["Mission", "Équipe", "Conformité"],
        "renderer": about_page,
    },
}


def _init_state() -> None:
    if "active_page" not in st.session_state:
        st.session_state.active_page = "home"


def render_topbar(selected_key: str) -> None:
    """Render the custom top navigation bar with branding."""
    nav_items = []
    for key, config in PAGES.items():
        css_class = "nav-tab active" if key == selected_key else "nav-tab"
        nav_items.append(f"<span class='{css_class}'>{config['emoji']} {config['label']}</span>")

    st.markdown(
        f"""
        <div class="top-nav">
            <div class="brand">
                <div class="brand-logo">{APP_META['icon']}</div>
                <div class="brand-meta">
                    <p class="brand-title">{APP_META['title']}</p>
                    <p class="brand-subtitle">{APP_META['tagline']}</p>
                </div>
            </div>
            <div class="nav-tabs">{''.join(nav_items)}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_sidebar() -> str:
    """Render the light navigation sidebar and return the selected page key."""
    options = list(PAGES.keys())
    default_index = options.index(st.session_state.active_page)

    with st.sidebar:
        selected_key = st.radio(
            "Navigation",
            options=options,
            index=default_index,
            format_func=lambda key: f"{PAGES[key]['emoji']}  {PAGES[key]['label']}",
            key="active_page",
        )

        st.markdown(
            f"""
            <div class="sidebar-section">
                <div class="sidebar-section-title">Version</div>
                <div class="sidebar-section-value">{APP_META['version']}</div>
                <div class="sidebar-section-helper">Synchronisé le {datetime.now():%d/%m/%Y}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown(
            """
            <div class="sidebar-section">
                <div class="sidebar-section-title">Statut plateforme</div>
                <ul class="sidebar-status">
                    <li>✅ Services API opérationnels</li>
                    <li>✅ 10 jeux de données synchronisés</li>
                    <li>✅ Chatbot RAG calibré</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.markdown(
            """
            <div class="sidebar-footer">
                <span>Besoin d'assistance ?</span><br/>
                <a href="mailto:support@innova.health">support@innova.health</a>
            </div>
            """,
            unsafe_allow_html=True,
        )

    if selected_key != st.session_state.active_page:
        st.session_state.active_page = selected_key
        st.experimental_rerun()

    return st.session_state.active_page


def render_footer() -> None:
    """Consistent footer for the application."""
    st.markdown(
        f"""
        <footer class="app-footer">
            <p><strong>{APP_META['title']}</strong> · IA & Data Science pour la santé.</p>
            <p>Version {APP_META['version']} · {datetime.now():%Y}</p>
        </footer>
        """,
        unsafe_allow_html=True,
    )


def main() -> None:
    """Entry point for the Streamlit application."""
    st.set_page_config(
        page_title=APP_META["title"],
        page_icon=APP_META["icon"],
        layout="wide",
        initial_sidebar_state="expanded",
    )

    _init_state()
    inject_app_css()

    selected_key = render_sidebar()
    render_topbar(selected_key)

    page_config = PAGES[selected_key]

    page_header(
        title=f"{page_config['emoji']} {page_config['label']}",
        subtitle=str(page_config["description"]),
        highlights=page_config.get("tags"),
    )

    renderer = page_config["renderer"]
    renderer()

    render_footer()


if __name__ == "__main__":
    main()




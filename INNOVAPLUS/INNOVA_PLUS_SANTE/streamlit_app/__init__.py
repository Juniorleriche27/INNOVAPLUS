"""
INNOVA+ SANTÉ - Interface Streamlit
Interface utilisateur pour la plateforme d'IA santé
"""

from .main import main
from .pages import (
    dashboard_page,
    datasets_page,
    models_page,
    chatbot_page,
    analytics_page
)

__all__ = [
    "main",
    "dashboard_page",
    "datasets_page", 
    "models_page",
    "chatbot_page",
    "analytics_page"
]

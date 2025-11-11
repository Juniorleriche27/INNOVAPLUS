"""
KORYXA SANTÉ - Pages Streamlit
Pages de l'interface utilisateur
"""

from .dashboard import dashboard_page
from .datasets import datasets_page
from .models import models_page
from .chatbot import chatbot_page
from .analytics import analytics_page

__all__ = [
    "dashboard_page",
    "datasets_page",
    "models_page", 
    "chatbot_page",
    "analytics_page"
]

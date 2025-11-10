"""
KORYXA SANTÉ - Configuration
Plateforme d'IA pour l'analyse prédictive de données de santé
"""

import os
from pathlib import Path
from typing import Dict, List, Optional
from pydantic_settings import BaseSettings

class INNOVASettings(BaseSettings):
    """Configuration principale d'KORYXA Santé"""
    
    # Informations de l'application
    APP_NAME: str = "KORYXA SANTÉ & BIEN-ÊTRE"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Plateforme d'IA pour l'analyse prédictive de données de santé"
    
    # Chemins du projet
    PROJECT_ROOT: Path = Path(__file__).parent
    DATA_DIR: Path = PROJECT_ROOT / "data"
    MODELS_DIR: Path = PROJECT_ROOT / "models"
    RAG_DIR: Path = PROJECT_ROOT / "rag_system"
    ANALYTICS_DIR: Path = PROJECT_ROOT / "analytics"
    STREAMLIT_DIR: Path = PROJECT_ROOT / "streamlit_app"
    DOCS_DIR: Path = PROJECT_ROOT / "docs"
    
    # Configuration des datasets
    DATASETS: Dict[str, Dict] = {
        "hospitalier": {
            "name": "Données hospitalières",
            "file": "hospital_data.csv",
            "description": "Admissions, diagnostics, traitements",
            "columns": ["date", "patient_id", "diagnostic", "traitement", "duree_sejour"]
        },
        "nutritionnel": {
            "name": "Données nutritionnelles", 
            "file": "nutrition_data.csv",
            "description": "Calories, nutriments, régimes alimentaires",
            "columns": ["aliment", "calories", "proteines", "glucides", "lipides"]
        },
        "fitness": {
            "name": "Données de fitness",
            "file": "fitness_data.csv", 
            "description": "Activité physique, performance, objectifs",
            "columns": ["date", "exercice", "duree", "calories_brûlées", "performance"]
        },
        "environnemental": {
            "name": "Données environnementales",
            "file": "environment_data.csv",
            "description": "Qualité air, pollution, météo",
            "columns": ["date", "qualite_air", "pollution", "temperature", "humidite"]
        },
        "epidemiologique": {
            "name": "Données épidémiologiques",
            "file": "epidemiology_data.csv",
            "description": "Maladies, vaccins, épidémies",
            "columns": ["date", "maladie", "cas", "vaccins", "region"]
        },
        "sante_mentale": {
            "name": "Données de santé mentale",
            "file": "mental_health_data.csv",
            "description": "Stress, anxiété, bien-être psychologique",
            "columns": ["date", "stress_level", "anxiete", "bien_etre", "facteurs"]
        },
        "genetique": {
            "name": "Données génétiques",
            "file": "genetic_data.csv",
            "description": "Prédispositions, mutations, pharmacogénomique",
            "columns": ["patient_id", "gene", "mutation", "predisposition", "medicament"]
        },
        "telemedecine": {
            "name": "Données de télémédecine",
            "file": "telemedicine_data.csv",
            "description": "Consultations à distance, monitoring",
            "columns": ["date", "consultation_type", "duree", "satisfaction", "resultat"]
        },
        "recherche_clinique": {
            "name": "Données de recherche clinique",
            "file": "clinical_research_data.csv",
            "description": "Essais cliniques, médicaments, effets",
            "columns": ["essai_id", "medicament", "efficacite", "effets_secondaires", "phase"]
        },
        "sante_publique": {
            "name": "Données de santé publique",
            "file": "public_health_data.csv",
            "description": "Politiques, budgets, campagnes",
            "columns": ["annee", "politique", "budget", "impact", "region"]
        }
    }
    
    # Configuration des modèles prédictifs
    MODELS: Dict[str, Dict] = {
        "health_risk": {
            "name": "Prédiction de risques sanitaires",
            "algorithm": "XGBoost",
            "features": ["age", "sexe", "antecedents", "symptomes"],
            "target": "risque_sante"
        },
        "nutrition": {
            "name": "Recommandations nutritionnelles",
            "algorithm": "Random Forest",
            "features": ["profil_nutritionnel", "objectifs", "contraintes"],
            "target": "recommandation"
        },
        "anomalies": {
            "name": "Détection d'anomalies médicales",
            "algorithm": "Isolation Forest",
            "features": ["donnees_vitales", "symptomes", "historique"],
            "target": "anomalie"
        },
        "epidemiologie": {
            "name": "Prédiction épidémiologique",
            "algorithm": "LSTM",
            "features": ["donnees_epidemiologiques", "environnementales"],
            "target": "propagation"
        }
    }
    
    # Configuration RAG
    RAG_CONFIG: Dict = {
        "vector_store": "chromadb",
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "llm_model": "gpt-3.5-turbo",
        "chunk_size": 1000,
        "chunk_overlap": 200,
        "retrieval_k": 5
    }
    
    # Configuration Streamlit
    STREAMLIT_CONFIG: Dict = {
        "page_title": "KORYXA SANTÉ",
        "page_icon": "🏥",
        "layout": "wide",
        "initial_sidebar_state": "expanded"
    }
    
    # Configuration de la base de données
    DATABASE_URL: str = "sqlite:///innova_sante.db"
    
    # Configuration des logs
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/innova_sante.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instance globale de configuration
settings = INNOVASettings()

# Création des répertoires nécessaires
def create_directories():
    """Crée tous les répertoires nécessaires pour le projet"""
    directories = [
        settings.DATA_DIR,
        settings.MODELS_DIR,
        settings.RAG_DIR,
        settings.ANALYTICS_DIR,
        settings.STREAMLIT_DIR,
        settings.DOCS_DIR,
        settings.DATA_DIR / "raw",
        settings.DATA_DIR / "processed",
        settings.DATA_DIR / "embeddings",
        settings.MODELS_DIR / "predictive",
        settings.MODELS_DIR / "embeddings",
        settings.MODELS_DIR / "chatbot",
        settings.RAG_DIR / "vector_store",
        settings.RAG_DIR / "retrieval",
        settings.RAG_DIR / "generation",
        settings.ANALYTICS_DIR / "visualizations",
        settings.ANALYTICS_DIR / "reports",
        settings.ANALYTICS_DIR / "insights",
        settings.STREAMLIT_DIR / "pages",
        settings.STREAMLIT_DIR / "components",
        settings.STREAMLIT_DIR / "utils",
        settings.DOCS_DIR / "api",
        settings.DOCS_DIR / "user_guide",
        settings.DOCS_DIR / "technical",
        Path("logs")
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"✅ Répertoire créé : {directory}")

if __name__ == "__main__":
    create_directories()
    print("🏥 Structure KORYXA SANTÉ créée avec succès !")

"""
INNOVA+ SANTÉ - Version Datasets uniquement
Interface simplifiée comme dans la capture d'écran
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
from datetime import datetime, timedelta

def main():
    """Application INNOVA+ Santé - Version Datasets uniquement"""
    
    # Configuration de la page
    st.set_page_config(
        page_title="INNOVA+ SANTÉ",
        page_icon="🏥",
        layout="wide",
        initial_sidebar_state="expanded",
        menu_items={
            'Get Help': None,
            'Report a bug': None,
            'About': None
        }
    )
    
    # Sidebar avec navigation
    with st.sidebar:
        st.title("🏥 INNOVA+ SANTÉ")
        st.markdown("---")
        
        # Informations sur l'application
        st.markdown("### ℹ️ À propos")
        st.markdown("**Version:** 1.0.0")
        st.markdown("**Description:** Plateforme d'IA pour l'analyse prédictive de données de santé")
        
        st.markdown("---")
        
        # Statut de l'application
        st.markdown("### 🔧 Statut")
        st.success("✅ Application active")
        st.info("📊 10 datasets santé disponibles")
        st.info("🤖 4 modèles prédictifs actifs")
        st.info("💬 Chatbot RAG opérationnel")
    
    # Contenu principal - Page Datasets
    datasets_page()
    
    # Footer
    st.markdown("---")
    st.markdown(
        """
        <div style='text-align: center; color: #666;'>
            <p>🏥 <strong>INNOVA+ SANTÉ</strong> - Plateforme d'IA pour l'analyse prédictive de données de santé</p>
            <p>Développé par <strong>INNOVA+</strong> - Startup spécialisée dans l'IA santé</p>
        </div>
        """,
        unsafe_allow_html=True
    )

def datasets_page():
    """Page de gestion des datasets"""
    
    st.title("📊 Datasets INNOVA+ SANTÉ")
    st.markdown("Gestion et analyse des 10 datasets spécialisés en santé")
    
    # Configuration des datasets
    datasets_config = {
        "hospitalier": {
            "name": "Données hospitalières",
            "description": "Admissions, diagnostics, traitements",
            "icon": "🏥",
            "color": "#FF6B6B"
        },
        "nutritionnel": {
            "name": "Données nutritionnelles",
            "description": "Calories, nutriments, régimes alimentaires",
            "icon": "🥗",
            "color": "#4ECDC4"
        },
        "fitness": {
            "name": "Données de fitness",
            "description": "Activité physique, performance, objectifs",
            "icon": "💪",
            "color": "#45B7D1"
        },
        "environnemental": {
            "name": "Données environnementales",
            "description": "Qualité air, pollution, météo",
            "icon": "🌍",
            "color": "#96CEB4"
        },
        "epidemiologique": {
            "name": "Données épidémiologiques",
            "description": "Maladies, vaccins, épidémies",
            "icon": "🦠",
            "color": "#FFEAA7"
        },
        "sante_mentale": {
            "name": "Données de santé mentale",
            "description": "Stress, anxiété, bien-être psychologique",
            "icon": "🧠",
            "color": "#DDA0DD"
        },
        "genetique": {
            "name": "Données génétiques",
            "description": "Prédispositions, mutations, pharmacogénomique",
            "icon": "🧬",
            "color": "#98D8C8"
        },
        "telemedecine": {
            "name": "Données de télémédecine",
            "description": "Consultations à distance, monitoring",
            "icon": "📱",
            "color": "#F7DC6F"
        },
        "recherche_clinique": {
            "name": "Données de recherche clinique",
            "description": "Essais cliniques, médicaments, effets",
            "icon": "🔬",
            "color": "#BB8FCE"
        },
        "sante_publique": {
            "name": "Données de santé publique",
            "description": "Politiques, budgets, campagnes",
            "icon": "🏛️",
            "color": "#85C1E9"
        }
    }
    
    # Sidebar pour la sélection du dataset
    with st.sidebar:
        st.markdown("---")
        st.subheader("🔍 Sélection du Dataset")
        
        selected_dataset = st.selectbox(
            "Choisir un dataset",
            list(datasets_config.keys()),
            format_func=lambda x: f"{datasets_config[x]['icon']} {datasets_config[x]['name']}"
        )
        
        st.markdown("---")
        
        # Actions sur le dataset
        st.subheader("⚙️ Actions")
        
        if st.button("🔄 Actualiser le dataset"):
            st.success("Dataset actualisé !")
        
        if st.button("📥 Télécharger le dataset"):
            st.info("Téléchargement en cours...")
        
        if st.button("🔍 Analyser la qualité"):
            st.info("Analyse en cours...")
    
    # Contenu principal
    dataset_info = datasets_config[selected_dataset]
    
    # En-tête du dataset
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.markdown(f"## {dataset_info['icon']} {dataset_info['name']}")
        st.markdown(f"**Description:** {dataset_info['description']}")
    
    with col2:
        st.markdown(f"<div style='background-color: {dataset_info['color']}; padding: 10px; border-radius: 5px; text-align: center; color: white;'>Status: ✅ Actif</div>", unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Métriques du dataset
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("📊 Lignes", "5,247", "+12%")
    
    with col2:
        st.metric("📋 Colonnes", "8", "Stable")
    
    with col3:
        st.metric("✅ Qualité", "94%", "+2%")
    
    with col4:
        st.metric("🔄 Dernière MAJ", "2h", "Récente")
    
    st.markdown("---")
    
    # Génération de données d'exemple
    if selected_dataset == "hospitalier":
        df = generate_hospital_data()
    elif selected_dataset == "nutritionnel":
        df = generate_nutrition_data()
    elif selected_dataset == "fitness":
        df = generate_fitness_data()
    elif selected_dataset == "environnemental":
        df = generate_environment_data()
    elif selected_dataset == "epidemiologique":
        df = generate_epidemiology_data()
    elif selected_dataset == "sante_mentale":
        df = generate_mental_health_data()
    elif selected_dataset == "genetique":
        df = generate_genetic_data()
    elif selected_dataset == "telemedecine":
        df = generate_telemedicine_data()
    elif selected_dataset == "recherche_clinique":
        df = generate_clinical_research_data()
    elif selected_dataset == "sante_publique":
        df = generate_public_health_data()
    
    # Affichage des données
    st.subheader("📋 Aperçu des Données")
    st.dataframe(df.head(20), use_container_width=True)
    
    # Statistiques descriptives
    st.subheader("📊 Statistiques Descriptives")
    st.dataframe(df.describe(), use_container_width=True)
    
    # Visualisations
    st.subheader("📊 Visualisations")
    
    # Sélection du type de graphique
    chart_type = st.selectbox(
        "Type de graphique",
        ["Histogramme", "Nuage de points", "Graphique en barres", "Graphique en ligne"]
    )
    
    if chart_type == "Histogramme":
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            col = st.selectbox("Colonne numérique", numeric_cols)
            fig = px.histogram(df, x=col, title=f"Distribution de {col}")
            st.plotly_chart(fig, use_container_width=True)
    
    elif chart_type == "Nuage de points":
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) >= 2:
            col1, col2 = st.columns(2)
            with col1:
                x_col = st.selectbox("Axe X", numeric_cols)
            with col2:
                y_col = st.selectbox("Axe Y", numeric_cols)
            
            fig = px.scatter(df, x=x_col, y=y_col, title=f"{x_col} vs {y_col}")
            st.plotly_chart(fig, use_container_width=True)
    
    elif chart_type == "Graphique en barres":
        categorical_cols = df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            col = st.selectbox("Colonne catégorielle", categorical_cols)
            counts = df[col].value_counts().head(10)
            fig = px.bar(x=counts.index, y=counts.values, title=f"Répartition de {col}")
            st.plotly_chart(fig, use_container_width=True)
    
    elif chart_type == "Graphique en ligne":
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 0:
            col = st.selectbox("Colonne numérique", numeric_cols)
            fig = px.line(df, x=df.index, y=col, title=f"Évolution de {col}")
            st.plotly_chart(fig, use_container_width=True)

# Fonctions de génération de données d'exemple
def generate_hospital_data():
    """Génère des données hospitalières d'exemple"""
    np.random.seed(42)
    data = {
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'patient_id': [f"PAT_{i:06d}" for i in range(100)],
        'diagnostic': np.random.choice(['Grippe', 'COVID-19', 'Pneumonie', 'Bronchite'], 100),
        'traitement': np.random.choice(['Antibiotiques', 'Antiviraux', 'Soins de support'], 100),
        'duree_sejour': np.random.randint(1, 30, 100),
        'age': np.random.randint(18, 80, 100),
        'sexe': np.random.choice(['M', 'F'], 100),
        'gravite': np.random.choice(['Légère', 'Modérée', 'Sévère'], 100)
    }
    return pd.DataFrame(data)

def generate_nutrition_data():
    """Génère des données nutritionnelles d'exemple"""
    np.random.seed(42)
    aliments = ['Pomme', 'Banane', 'Poulet', 'Saumon', 'Brocoli', 'Riz', 'Pâtes', 'Pain']
    data = {
        'aliment': np.random.choice(aliments, 100),
        'calories': np.random.randint(50, 500, 100),
        'proteines': np.random.uniform(5, 50, 100).round(1),
        'glucides': np.random.uniform(10, 80, 100).round(1),
        'lipides': np.random.uniform(2, 30, 100).round(1),
        'fibres': np.random.uniform(1, 15, 100).round(1),
        'vitamines': np.random.uniform(0, 100, 100).round(1)
    }
    return pd.DataFrame(data)

def generate_fitness_data():
    """Génère des données de fitness d'exemple"""
    np.random.seed(42)
    exercices = ['Course', 'Musculation', 'Yoga', 'Natation', 'Vélo', 'Marche']
    data = {
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'exercice': np.random.choice(exercices, 100),
        'duree': np.random.randint(15, 120, 100),
        'calories_brûlées': np.random.randint(100, 800, 100),
        'performance': np.random.uniform(1, 10, 100).round(1),
        'fréquence_cardiaque': np.random.randint(60, 180, 100),
        'intensité': np.random.choice(['Faible', 'Modérée', 'Élevée'], 100)
    }
    return pd.DataFrame(data)

def generate_environment_data():
    """Génère des données environnementales d'exemple"""
    np.random.seed(42)
    data = {
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'qualite_air': np.random.choice(['Bonne', 'Moyenne', 'Mauvaise'], 100),
        'pollution': np.random.uniform(0, 100, 100).round(1),
        'temperature': np.random.uniform(-10, 40, 100).round(1),
        'humidite': np.random.uniform(20, 90, 100).round(1),
        'pression': np.random.uniform(980, 1030, 100).round(1),
        'vent': np.random.uniform(0, 50, 100).round(1)
    }
    return pd.DataFrame(data)

def generate_epidemiology_data():
    """Génère des données épidémiologiques d'exemple"""
    np.random.seed(42)
    maladies = ['Grippe', 'COVID-19', 'Rougeole', 'Varicelle']
    regions = ['Nord', 'Sud', 'Est', 'Ouest', 'Centre']
    data = {
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'maladie': np.random.choice(maladies, 100),
        'cas': np.random.randint(0, 100, 100),
        'vaccins': np.random.randint(0, 50, 100),
        'region': np.random.choice(regions, 100),
        'age_moyen': np.random.randint(5, 80, 100),
        'taux_mortalité': np.random.uniform(0, 5, 100).round(2)
    }
    return pd.DataFrame(data)

def generate_mental_health_data():
    """Génère des données de santé mentale d'exemple"""
    np.random.seed(42)
    data = {
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'stress_level': np.random.randint(1, 10, 100),
        'anxiete': np.random.randint(1, 10, 100),
        'bien_etre': np.random.randint(1, 10, 100),
        'facteurs': np.random.choice(['Travail', 'Famille', 'Santé', 'Finances'], 100),
        'sommeil': np.random.uniform(4, 10, 100).round(1),
        'activite_physique': np.random.randint(0, 7, 100)
    }
    return pd.DataFrame(data)

def generate_genetic_data():
    """Génère des données génétiques d'exemple"""
    np.random.seed(42)
    genes = ['BRCA1', 'BRCA2', 'APOE', 'COMT', 'MTHFR']
    mutations = ['Mutation', 'Polymorphisme', 'Normal']
    data = {
        'patient_id': [f"PAT_{i:06d}" for i in range(100)],
        'gene': np.random.choice(genes, 100),
        'mutation': np.random.choice(mutations, 100),
        'predisposition': np.random.choice(['Élevée', 'Modérée', 'Faible'], 100),
        'medicament': np.random.choice(['Métaboliseur lent', 'Métaboliseur normal', 'Métaboliseur rapide'], 100),
        'age': np.random.randint(18, 80, 100),
        'sexe': np.random.choice(['M', 'F'], 100)
    }
    return pd.DataFrame(data)

def generate_telemedicine_data():
    """Génère des données de télémédecine d'exemple"""
    np.random.seed(42)
    types_consultation = ['Vidéo', 'Téléphone', 'Chat', 'Email']
    data = {
        'date': pd.date_range('2024-01-01', periods=100, freq='D'),
        'consultation_type': np.random.choice(types_consultation, 100),
        'duree': np.random.randint(10, 60, 100),
        'satisfaction': np.random.randint(1, 5, 100),
        'resultat': np.random.choice(['Résolu', 'Suivi nécessaire', 'Référence spécialiste'], 100),
        'patient_age': np.random.randint(18, 80, 100),
        'urgence': np.random.choice(['Faible', 'Modérée', 'Élevée'], 100)
    }
    return pd.DataFrame(data)

def generate_clinical_research_data():
    """Génère des données de recherche clinique d'exemple"""
    np.random.seed(42)
    medicaments = ['Médicament A', 'Médicament B', 'Placebo', 'Médicament C']
    phases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV']
    data = {
        'essai_id': [f"ESS_{i:06d}" for i in range(100)],
        'medicament': np.random.choice(medicaments, 100),
        'efficacite': np.random.uniform(0, 100, 100).round(1),
        'effets_secondaires': np.random.randint(0, 20, 100),
        'phase': np.random.choice(phases, 100),
        'participants': np.random.randint(50, 1000, 100),
        'duree_mois': np.random.randint(6, 36, 100)
    }
    return pd.DataFrame(data)

def generate_public_health_data():
    """Génère des données de santé publique d'exemple"""
    np.random.seed(42)
    politiques = ['Vaccination', 'Prévention', 'Screening', 'Éducation', 'Infrastructure']
    regions = ['Nord', 'Sud', 'Est', 'Ouest', 'Centre']
    data = {
        'annee': np.random.randint(2020, 2024, 100),
        'politique': np.random.choice(politiques, 100),
        'budget': np.random.randint(10000, 1000000, 100),
        'impact': np.random.uniform(0, 100, 100).round(1),
        'region': np.random.choice(regions, 100),
        'population_cible': np.random.randint(1000, 100000, 100),
        'taux_adoption': np.random.uniform(0, 100, 100).round(1)
    }
    return pd.DataFrame(data)

if __name__ == "__main__":
    main()

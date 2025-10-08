"""
INNOVA+ SANTÉ - Version simplifiée qui fonctionne
Interface utilisateur pour la plateforme d'IA santé
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
from datetime import datetime, timedelta

def main():
    """Application principale INNOVA+ Santé - Version simplifiée"""
    
    # Configuration de la page
    st.set_page_config(
        page_title="INNOVA+ SANTÉ",
        page_icon="🏥",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Sidebar avec navigation
    with st.sidebar:
        st.title("🏥 INNOVA+ SANTÉ")
        st.markdown("---")
        
        # Menu de navigation - Simplifié pour ne garder que Datasets
        page = st.selectbox(
            "📋 Navigation",
            [
                "📊 Datasets"
            ]
        )
        
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
    
    # Contenu principal - Seulement la page Datasets
    if page == "📊 Datasets":
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

def dashboard_page():
    """Page dashboard principal"""
    
    st.title("🏥 Dashboard INNOVA+ SANTÉ")
    st.markdown("Vue d'ensemble de votre plateforme d'IA pour l'analyse prédictive de données de santé")
    
    # Métriques principales
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="📊 Datasets Actifs",
            value="10",
            delta="+2 cette semaine"
        )
    
    with col2:
        st.metric(
            label="🤖 Modèles Entraînés",
            value="4",
            delta="+1 ce mois"
        )
    
    with col3:
        st.metric(
            label="💬 Requêtes Chatbot",
            value="1,247",
            delta="+23% vs mois dernier"
        )
    
    with col4:
        st.metric(
            label="📈 Prédictions Aujourd'hui",
            value="89",
            delta="+12% vs hier"
        )
    
    st.markdown("---")
    
    # Graphiques principaux
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📊 Répartition des Datasets")
        
        # Données simulées pour la répartition
        datasets_data = {
            'Dataset': ['Hospitalier', 'Nutritionnel', 'Fitness', 'Environnemental', 'Épidémiologique'],
            'Lignes': [5000, 3200, 2800, 4500, 3800],
            'Qualité': [95, 88, 92, 90, 87]
        }
        
        df_datasets = pd.DataFrame(datasets_data)
        
        fig = px.bar(
            df_datasets, 
            x='Dataset', 
            y='Lignes',
            title="Nombre de lignes par dataset",
            color='Qualité',
            color_continuous_scale='viridis'
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("🤖 Performance des Modèles")
        
        # Données simulées pour la performance
        models_data = {
            'Modèle': ['Risques Santé', 'Nutrition', 'Anomalies', 'Épidémiologie'],
            'Précision': [0.94, 0.89, 0.92, 0.87],
            'Rappel': [0.91, 0.85, 0.88, 0.83]
        }
        
        df_models = pd.DataFrame(models_data)
        
        fig = px.scatter(
            df_models,
            x='Précision',
            y='Rappel',
            size=[100, 100, 100, 100],
            hover_name='Modèle',
            title="Performance des modèles (Précision vs Rappel)",
            color='Modèle'
        )
        st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    # Activité récente
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📈 Activité des Prédictions")
        
        # Données simulées pour l'activité
        dates = pd.date_range(start='2024-01-01', end='2024-01-31', freq='D')
        predictions = np.random.poisson(50, len(dates))
        
        df_activity = pd.DataFrame({
            'Date': dates,
            'Prédictions': predictions
        })
        
        fig = px.line(
            df_activity,
            x='Date',
            y='Prédictions',
            title="Évolution des prédictions par jour"
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        st.subheader("💬 Top Requêtes Chatbot")
        
        # Données simulées pour les requêtes
        queries_data = {
            'Requête': [
                'Quels sont les facteurs de risque cardiovasculaire ?',
                'Comment interpréter mes résultats nutritionnels ?',
                'Quelle est la tendance épidémiologique actuelle ?',
                'Comment optimiser mon entraînement ?',
                'Quels sont les impacts environnementaux sur la santé ?'
            ],
            'Fréquence': [45, 38, 32, 28, 25]
        }
        
        df_queries = pd.DataFrame(queries_data)
        
        fig = px.bar(
            df_queries,
            x='Fréquence',
            y='Requête',
            orientation='h',
            title="Requêtes les plus fréquentes"
        )
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)
    
    st.markdown("---")
    
    # Alertes et recommandations
    st.subheader("🚨 Alertes et Recommandations")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.info("🔍 **Nouvelle anomalie détectée** dans le dataset hospitalier")
    
    with col2:
        st.warning("⚠️ **Modèle de nutrition** nécessite une mise à jour")
    
    with col3:
        st.success("✅ **Chatbot RAG** mis à jour avec de nouvelles connaissances")
    
    # Actions rapides
    st.subheader("⚡ Actions Rapides")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        if st.button("🔄 Actualiser les données", use_container_width=True):
            st.success("Données actualisées !")
    
    with col2:
        if st.button("🤖 Entraîner les modèles", use_container_width=True):
            st.info("Entraînement en cours...")
    
    with col3:
        if st.button("💬 Tester le chatbot", use_container_width=True):
            st.info("Redirection vers le chatbot...")
    
    with col4:
        if st.button("📊 Générer un rapport", use_container_width=True):
            st.info("Génération du rapport...")

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
        }
    }
    
    # Sidebar pour la sélection du dataset
    with st.sidebar:
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

def models_page():
    """Page de gestion des modèles prédictifs"""
    
    st.title("🤖 Modèles Prédictifs INNOVA+ SANTÉ")
    st.markdown("Gestion et monitoring des 4 modèles d'IA spécialisés en santé")
    
    # Configuration des modèles
    models_config = {
        "health_risk": {
            "name": "Prédiction de Risques Sanitaires",
            "description": "Prédit les risques de santé basés sur les données patient",
            "icon": "⚠️",
            "color": "#FF6B6B",
            "algorithm": "XGBoost",
            "accuracy": 0.94,
            "status": "Actif"
        },
        "nutrition": {
            "name": "Recommandations Nutritionnelles",
            "description": "Génère des recommandations alimentaires personnalisées",
            "icon": "🥗",
            "color": "#4ECDC4",
            "algorithm": "Random Forest",
            "accuracy": 0.89,
            "status": "Actif"
        },
        "anomalies": {
            "name": "Détection d'Anomalies Médicales",
            "description": "Détecte les anomalies dans les données médicales",
            "icon": "🔍",
            "color": "#45B7D1",
            "algorithm": "Isolation Forest",
            "accuracy": 0.92,
            "status": "Actif"
        },
        "epidemiologie": {
            "name": "Prédiction Épidémiologique",
            "description": "Prédit la propagation des maladies et épidémies",
            "icon": "🦠",
            "color": "#FFEAA7",
            "algorithm": "LSTM",
            "accuracy": 0.87,
            "status": "Actif"
        }
    }
    
    # Sidebar pour la sélection du modèle
    with st.sidebar:
        st.subheader("🤖 Sélection du Modèle")
        
        selected_model = st.selectbox(
            "Choisir un modèle",
            list(models_config.keys()),
            format_func=lambda x: f"{models_config[x]['icon']} {models_config[x]['name']}"
        )
        
        st.markdown("---")
        
        # Actions sur le modèle
        st.subheader("⚙️ Actions")
        
        if st.button("🔄 Entraîner le modèle"):
            st.success("Entraînement démarré !")
        
        if st.button("📊 Évaluer les performances"):
            st.info("Évaluation en cours...")
        
        if st.button("💾 Sauvegarder le modèle"):
            st.info("Sauvegarde en cours...")
    
    # Contenu principal
    model_info = models_config[selected_model]
    
    # En-tête du modèle
    col1, col2 = st.columns([3, 1])
    
    with col1:
        st.markdown(f"## {model_info['icon']} {model_info['name']}")
        st.markdown(f"**Description:** {model_info['description']}")
        st.markdown(f"**Algorithme:** {model_info['algorithm']}")
    
    with col2:
        status_color = "#4CAF50" if model_info['status'] == "Actif" else "#F44336"
        st.markdown(f"<div style='background-color: {status_color}; padding: 10px; border-radius: 5px; text-align: center; color: white;'>Status: {model_info['status']}</div>", unsafe_allow_html=True)
    
    st.markdown("---")
    
    # Métriques du modèle
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("🎯 Précision", f"{model_info['accuracy']:.1%}", "+2.3%")
    
    with col2:
        st.metric("📊 Prédictions", "1,247", "+89")
    
    with col3:
        st.metric("⏱️ Temps de réponse", "0.3s", "-0.1s")
    
    with col4:
        st.metric("🔄 Dernière MAJ", "2h", "Récente")
    
    st.markdown("---")
    
    # Graphique de performance
    col1, col2 = st.columns(2)
    
    with col1:
        # Métriques de performance
        metrics_data = {
            'Métrique': ['Précision', 'Rappel', 'F1-Score', 'AUC-ROC'],
            'Valeur': [0.94, 0.91, 0.92, 0.96]
        }
        
        df_metrics = pd.DataFrame(metrics_data)
        
        fig = px.bar(
            df_metrics,
            x='Métrique',
            y='Valeur',
            title="Métriques de Performance",
            color='Valeur',
            color_continuous_scale='viridis'
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Évolution de la performance
        dates = pd.date_range(start='2024-01-01', end='2024-01-31', freq='D')
        performance = np.random.uniform(0.85, 0.95, len(dates))
        
        df_performance = pd.DataFrame({
            'Date': dates,
            'Performance': performance
        })
        
        fig = px.line(
            df_performance,
            x='Date',
            y='Performance',
            title="Évolution de la Performance"
        )
        st.plotly_chart(fig, use_container_width=True)

def chatbot_page():
    """Page du chatbot RAG médical"""
    
    st.title("💬 Chatbot INNOVA+ SANTÉ")
    st.markdown("Assistant IA médical avec système RAG pour l'analyse de données de santé")
    
    # Initialisation de la session
    if "messages" not in st.session_state:
        st.session_state.messages = []
    
    # Zone de chat principale
    st.subheader("💬 Conversation avec Dr. INNOVA+")
    
    # Affichage des messages
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])
    
    # Zone de saisie
    if prompt := st.chat_input("Posez votre question sur les données de santé..."):
        # Ajout du message utilisateur
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        # Affichage du message utilisateur
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Génération de la réponse du bot
        with st.chat_message("assistant"):
            with st.spinner("Dr. INNOVA+ réfléchit..."):
                # Simulation de la génération de réponse
                import time
                time.sleep(1)
                
                # Génération de réponse basée sur le prompt
                response = generate_chatbot_response(prompt)
                st.markdown(response)
        
        # Ajout de la réponse à l'historique
        st.session_state.messages.append({"role": "assistant", "content": response})
    
    # Informations sur le chatbot
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("💬 Messages", "1,247", "+23%")
    
    with col2:
        st.metric("🎯 Précision", "94%", "+2%")
    
    with col3:
        st.metric("⏱️ Temps de réponse", "0.8s", "-0.2s")

def analytics_page():
    """Page d'analyses avancées"""
    
    st.title("📈 Analytics INNOVA+ SANTÉ")
    st.markdown("Analyses avancées et visualisations des données de santé")
    
    # Configuration des analyses
    analytics_config = {
        "correlation": {
            "name": "Analyse de Corrélation",
            "description": "Corrélations entre les différents facteurs de santé",
            "icon": "🔗"
        },
        "trends": {
            "name": "Analyse des Tendances",
            "description": "Évolution temporelle des indicateurs de santé",
            "icon": "📈"
        },
        "clustering": {
            "name": "Clustering",
            "description": "Groupement des patients par profils similaires",
            "icon": "🎯"
        },
        "predictions": {
            "name": "Prédictions",
            "description": "Prédictions basées sur les modèles ML",
            "icon": "🔮"
        }
    }
    
    # Sidebar pour la sélection de l'analyse
    with st.sidebar:
        st.subheader("🔍 Sélection de l'Analyse")
        
        selected_analysis = st.selectbox(
            "Choisir une analyse",
            list(analytics_config.keys()),
            format_func=lambda x: f"{analytics_config[x]['icon']} {analytics_config[x]['name']}"
        )
        
        st.markdown("---")
        
        # Actions
        st.subheader("⚡ Actions")
        
        if st.button("🔄 Lancer l'analyse", use_container_width=True):
            st.success("Analyse lancée !")
        
        if st.button("📊 Exporter les résultats", use_container_width=True):
            st.info("Export en cours...")
    
    # Contenu principal
    analysis_info = analytics_config[selected_analysis]
    
    # En-tête de l'analyse
    st.markdown(f"## {analysis_info['icon']} {analysis_info['name']}")
    st.markdown(f"**Description:** {analysis_info['description']}")
    
    st.markdown("---")
    
    # Exécution de l'analyse sélectionnée
    if selected_analysis == "correlation":
        correlation_analysis()
    elif selected_analysis == "trends":
        trends_analysis()
    elif selected_analysis == "clustering":
        clustering_analysis()
    elif selected_analysis == "predictions":
        predictions_analysis()

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

def generate_chatbot_response(prompt: str) -> str:
    """Génère une réponse du chatbot basée sur le prompt"""
    responses = {
        "santé": "Les données de santé montrent des tendances intéressantes. Basé sur l'analyse des 10 datasets, je peux vous fournir des insights sur...",
        "données": "L'analyse des données révèle plusieurs patterns importants. Voici ce que je peux vous dire...",
        "analyse": "Pour une analyse approfondie, je recommande d'examiner les corrélations entre les différents facteurs de santé...",
        "prédiction": "Les modèles prédictifs indiquent que... Basé sur les données historiques, je peux prédire...",
        "risque": "L'évaluation des risques sanitaires montre que... Les facteurs de risque identifiés incluent...",
        "nutrition": "Pour les recommandations nutritionnelles, je suggère d'analyser votre profil alimentaire actuel...",
        "fitness": "L'optimisation de votre programme de fitness peut être améliorée en considérant...",
        "médical": "Du point de vue médical, les données suggèrent que... Il est important de noter que..."
    }
    
    # Recherche de mots-clés dans le prompt
    prompt_lower = prompt.lower()
    for keyword in responses.keys():
        if keyword in prompt_lower:
            return responses[keyword]
    
    return "Je comprends votre question sur les données de santé. Basé sur l'analyse des 10 datasets disponibles, je peux vous aider à explorer les tendances, corrélations et prédictions. Pouvez-vous être plus spécifique sur ce que vous souhaitez analyser ?"

def correlation_analysis():
    """Analyse de corrélation entre les facteurs de santé"""
    st.subheader("🔗 Analyse de Corrélation")
    
    # Génération de données simulées
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'Âge': np.random.randint(18, 80, n_samples),
        'IMC': np.random.uniform(18, 35, n_samples),
        'Activité_physique': np.random.uniform(0, 10, n_samples),
        'Stress': np.random.uniform(0, 10, n_samples),
        'Sommeil': np.random.uniform(4, 10, n_samples),
        'Nutrition_score': np.random.uniform(0, 100, n_samples),
        'Risque_santé': np.random.uniform(0, 10, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # Calcul de la matrice de corrélation
    correlation_matrix = df.corr()
    
    # Visualisation de la matrice de corrélation
    fig = px.imshow(
        correlation_matrix,
        text_auto=True,
        title="Matrice de Corrélation",
        color_continuous_scale='RdBu_r'
    )
    st.plotly_chart(fig, use_container_width=True)

def trends_analysis():
    """Analyse des tendances temporelles"""
    st.subheader("📈 Analyse des Tendances")
    
    # Génération de données temporelles simulées
    np.random.seed(42)
    dates = pd.date_range(start='2023-01-01', end='2024-01-01', freq='D')
    
    base_trend = np.linspace(50, 70, len(dates))
    noise = np.random.normal(0, 5, len(dates))
    seasonal_pattern = 10 * np.sin(2 * np.pi * np.arange(len(dates)) / 365)
    
    data = {
        'Date': dates,
        'Risque_santé': base_trend + noise + seasonal_pattern,
        'Activité_physique': 60 - base_trend/2 + noise,
        'Stress': 40 + base_trend/3 + noise,
        'Nutrition_score': 70 + seasonal_pattern/2 + noise
    }
    
    df_trends = pd.DataFrame(data)
    
    # Visualisation des tendances
    fig = go.Figure()
    
    for col in ['Risque_santé', 'Activité_physique', 'Stress', 'Nutrition_score']:
        fig.add_trace(go.Scatter(
            x=df_trends['Date'],
            y=df_trends[col],
            mode='lines',
            name=col.replace('_', ' ').title()
        ))
    
    fig.update_layout(
        title="Évolution des Indicateurs de Santé",
        xaxis_title="Date",
        yaxis_title="Valeur"
    )
    
    st.plotly_chart(fig, use_container_width=True)

def clustering_analysis():
    """Analyse de clustering des patients"""
    st.subheader("🎯 Analyse de Clustering")
    
    # Génération de données simulées pour le clustering
    np.random.seed(42)
    n_samples = 500
    
    # Génération de clusters artificiels
    cluster1 = np.random.multivariate_normal([25, 22, 7, 3], [[5, 0, 0, 0], [0, 5, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]], n_samples//4)
    cluster2 = np.random.multivariate_normal([45, 28, 4, 6], [[8, 0, 0, 0], [0, 8, 0, 0], [0, 0, 3, 0], [0, 0, 0, 3]], n_samples//4)
    cluster3 = np.random.multivariate_normal([65, 26, 3, 8], [[6, 0, 0, 0], [0, 6, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]], n_samples//4)
    cluster4 = np.random.multivariate_normal([35, 30, 2, 9], [[7, 0, 0, 0], [0, 7, 0, 0], [0, 0, 2, 0], [0, 0, 0, 2]], n_samples//4)
    
    data = np.vstack([cluster1, cluster2, cluster3, cluster4])
    
    df_cluster = pd.DataFrame(data, columns=['Âge', 'IMC', 'Activité', 'Stress'])
    df_cluster['Cluster'] = [0] * (n_samples//4) + [1] * (n_samples//4) + [2] * (n_samples//4) + [3] * (n_samples//4)
    
    # Visualisation des clusters
    fig = px.scatter(
        df_cluster,
        x='Âge',
        y='IMC',
        color='Cluster',
        title="Clusters par Âge et IMC",
        labels={'Âge': 'Âge', 'IMC': 'IMC'}
    )
    st.plotly_chart(fig, use_container_width=True)

def predictions_analysis():
    """Analyse des prédictions"""
    st.subheader("🔮 Analyse des Prédictions")
    
    # Génération de données de prédiction simulées
    np.random.seed(42)
    dates = pd.date_range(start='2024-01-01', end='2024-12-31', freq='D')
    
    # Données historiques
    historical_data = {
        'Date': dates[:180],
        'Risque_santé': np.random.uniform(20, 80, 180),
        'Confiance': np.random.uniform(0.7, 0.95, 180)
    }
    
    # Prédictions
    future_dates = dates[180:]
    predictions = {
        'Date': future_dates,
        'Risque_santé': np.random.uniform(25, 85, len(future_dates)),
        'Confiance': np.random.uniform(0.6, 0.9, len(future_dates)),
        'Type': ['Prédiction'] * len(future_dates)
    }
    
    df_historical = pd.DataFrame(historical_data)
    df_historical['Type'] = 'Historique'
    df_predictions = pd.DataFrame(predictions)
    
    df_combined = pd.concat([df_historical, df_predictions])
    
    # Visualisation des prédictions
    fig = go.Figure()
    
    # Données historiques
    fig.add_trace(go.Scatter(
        x=df_historical['Date'],
        y=df_historical['Risque_santé'],
        mode='lines',
        name='Données historiques',
        line=dict(color='blue')
    ))
    
    # Prédictions
    fig.add_trace(go.Scatter(
        x=df_predictions['Date'],
        y=df_predictions['Risque_santé'],
        mode='lines',
        name='Prédictions',
        line=dict(color='red', dash='dash')
    ))
    
    fig.update_layout(
        title="Prédictions du Risque de Santé",
        xaxis_title="Date",
        yaxis_title="Risque de Santé"
    )
    
    st.plotly_chart(fig, use_container_width=True)

if __name__ == "__main__":
    main()

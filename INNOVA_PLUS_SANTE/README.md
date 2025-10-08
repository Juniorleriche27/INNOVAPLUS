# 🏥 INNOVA+ SANTÉ & BIEN-ÊTRE

## 🎯 Vision
Plateforme d'Intelligence Artificielle pour l'analyse prédictive de données de santé, la prédiction de risques et l'assistance médicale intelligente.

## 🚀 Fonctionnalités principales
- **10 datasets santé spécialisés** avec analyses avancées
- **Modèles prédictifs** pour la santé et le bien-être
- **Système RAG** avec chatbot médical intelligent
- **Interface Streamlit** professionnelle et intuitive

## 📊 Datasets intégrés
1. **Données hospitalières** - Admissions, diagnostics, traitements
2. **Données nutritionnelles** - Calories, nutriments, régimes
3. **Données de fitness** - Activité physique, performance
4. **Données environnementales** - Qualité air, pollution
5. **Données épidémiologiques** - Maladies, vaccins, épidémies
6. **Données de santé mentale** - Stress, bien-être psychologique
7. **Données génétiques** - Prédispositions, pharmacogénomique
8. **Données de télémédecine** - Consultations à distance
9. **Données de recherche clinique** - Essais, médicaments
10. **Données de santé publique** - Politiques, budgets

## 🤖 Modèles prédictifs
- **Prédiction de risques sanitaires**
- **Recommandations nutritionnelles personnalisées**
- **Détection d'anomalies médicales**
- **Prédiction épidémiologique**

## 💬 Chatbot RAG
- **Questions-réponses** sur les analyses médicales
- **Explications** des prédictions et recommandations
- **Conseils personnalisés** basés sur les données
- **Génération de rapports** médicaux automatiques

## 🛠️ Installation
```bash
pip install -r requirements.txt
streamlit run streamlit_app/main.py
```

## 📁 Structure du projet
```
INNOVA_PLUS_SANTE/
├── data/                    # Données et datasets
├── models/                  # Modèles ML et IA
├── rag_system/             # Système RAG et chatbot
├── analytics/              # Analyses et visualisations
├── streamlit_app/          # Interface utilisateur
└── docs/                   # Documentation
```

## 🎯 Développé par INNOVA+
Startup spécialisée dans l'Intelligence Artificielle pour la santé.
\n## Backend API\n\n- Documentation : `docs/backend_api.md`\n- Lancement local : `uvicorn backend.main:app --reload --port 8000`\n
\n## Upload & Laboratoire\n\n- Nouvelle page `Laboratoire` : chargement CSV/XLSX/Parquet (≤20 Mo) avec profil rapide et export.\n- Optionnel : API de prédiction `POST /predict/hospital_risk` (voir docs/backend_api.md).\n

"""
INNOVA+ SANTÉ - Chargeur de données
Gestion du chargement des 10 datasets santé
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Union
import logging
from config import settings

logger = logging.getLogger(__name__)

class DataLoader:
    """Chargeur de données pour INNOVA+ Santé"""
    
    def __init__(self):
        self.data_dir = settings.DATA_DIR
        self.datasets_config = settings.DATASETS
        self.loaded_datasets = {}
    
    def load_dataset(self, dataset_name: str, file_path: Optional[str] = None) -> pd.DataFrame:
        """
        Charge un dataset spécifique
        
        Args:
            dataset_name: Nom du dataset (ex: 'hospitalier', 'nutritionnel')
            file_path: Chemin personnalisé vers le fichier
            
        Returns:
            DataFrame pandas avec les données
        """
        try:
            if dataset_name not in self.datasets_config:
                raise ValueError(f"Dataset '{dataset_name}' non configuré")
            
            config = self.datasets_config[dataset_name]
            
            if file_path is None:
                file_path = self.data_dir / "raw" / config["file"]
            
            # Chargement du fichier
            if file_path.suffix == '.csv':
                df = pd.read_csv(file_path)
            elif file_path.suffix == '.xlsx':
                df = pd.read_excel(file_path)
            elif file_path.suffix == '.json':
                df = pd.read_json(file_path)
            else:
                raise ValueError(f"Format de fichier non supporté: {file_path.suffix}")
            
            # Ajout des métadonnées
            df.attrs['dataset_name'] = dataset_name
            df.attrs['description'] = config['description']
            df.attrs['columns'] = config['columns']
            
            # Stockage en mémoire
            self.loaded_datasets[dataset_name] = df
            
            logger.info(f"✅ Dataset '{dataset_name}' chargé avec succès ({len(df)} lignes)")
            return df
            
        except Exception as e:
            logger.error(f"❌ Erreur lors du chargement du dataset '{dataset_name}': {e}")
            raise
    
    def load_all_datasets(self) -> Dict[str, pd.DataFrame]:
        """
        Charge tous les datasets configurés
        
        Returns:
            Dictionnaire avec tous les datasets chargés
        """
        all_datasets = {}
        
        for dataset_name in self.datasets_config.keys():
            try:
                df = self.load_dataset(dataset_name)
                all_datasets[dataset_name] = df
            except Exception as e:
                logger.warning(f"⚠️ Impossible de charger le dataset '{dataset_name}': {e}")
                continue
        
        logger.info(f"✅ {len(all_datasets)} datasets chargés avec succès")
        return all_datasets
    
    def get_dataset_info(self, dataset_name: str) -> Dict:
        """
        Retourne les informations d'un dataset
        
        Args:
            dataset_name: Nom du dataset
            
        Returns:
            Dictionnaire avec les informations du dataset
        """
        if dataset_name not in self.datasets_config:
            raise ValueError(f"Dataset '{dataset_name}' non configuré")
        
        config = self.datasets_config[dataset_name]
        
        info = {
            'name': config['name'],
            'description': config['description'],
            'columns': config['columns'],
            'file': config['file']
        }
        
        if dataset_name in self.loaded_datasets:
            df = self.loaded_datasets[dataset_name]
            info.update({
                'rows': len(df),
                'columns_count': len(df.columns),
                'missing_values': df.isnull().sum().sum(),
                'data_types': df.dtypes.to_dict()
            })
        
        return info
    
    def get_loaded_datasets(self) -> Dict[str, pd.DataFrame]:
        """
        Retourne tous les datasets actuellement chargés
        
        Returns:
            Dictionnaire avec les datasets chargés
        """
        return self.loaded_datasets.copy()
    
    def clear_cache(self):
        """Vide le cache des datasets chargés"""
        self.loaded_datasets.clear()
        logger.info("🗑️ Cache des datasets vidé")
    
    def generate_sample_data(self, dataset_name: str, n_samples: int = 1000) -> pd.DataFrame:
        """
        Génère des données d'exemple pour un dataset
        
        Args:
            dataset_name: Nom du dataset
            n_samples: Nombre d'échantillons à générer
            
        Returns:
            DataFrame avec des données d'exemple
        """
        if dataset_name not in self.datasets_config:
            raise ValueError(f"Dataset '{dataset_name}' non configuré")
        
        config = self.datasets_config[dataset_name]
        columns = config['columns']
        
        # Génération de données selon le type de dataset
        if dataset_name == 'hospitalier':
            df = self._generate_hospital_data(n_samples)
        elif dataset_name == 'nutritionnel':
            df = self._generate_nutrition_data(n_samples)
        elif dataset_name == 'fitness':
            df = self._generate_fitness_data(n_samples)
        elif dataset_name == 'environnemental':
            df = self._generate_environment_data(n_samples)
        elif dataset_name == 'epidemiologique':
            df = self._generate_epidemiology_data(n_samples)
        elif dataset_name == 'sante_mentale':
            df = self._generate_mental_health_data(n_samples)
        elif dataset_name == 'genetique':
            df = self._generate_genetic_data(n_samples)
        elif dataset_name == 'telemedecine':
            df = self._generate_telemedicine_data(n_samples)
        elif dataset_name == 'recherche_clinique':
            df = self._generate_clinical_research_data(n_samples)
        elif dataset_name == 'sante_publique':
            df = self._generate_public_health_data(n_samples)
        else:
            raise ValueError(f"Générateur non implémenté pour '{dataset_name}'")
        
        # Ajout des métadonnées
        df.attrs['dataset_name'] = dataset_name
        df.attrs['description'] = config['description']
        df.attrs['columns'] = config['columns']
        
        return df
    
    def _generate_hospital_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données hospitalières d'exemple"""
        np.random.seed(42)
        
        data = {
            'date': pd.date_range('2023-01-01', periods=n_samples, freq='D'),
            'patient_id': [f"PAT_{i:06d}" for i in range(n_samples)],
            'diagnostic': np.random.choice(['Grippe', 'COVID-19', 'Pneumonie', 'Bronchite', 'Autre'], n_samples),
            'traitement': np.random.choice(['Antibiotiques', 'Antiviraux', 'Soins de support', 'Chirurgie'], n_samples),
            'duree_sejour': np.random.randint(1, 30, n_samples)
        }
        
        return pd.DataFrame(data)
    
    def _generate_nutrition_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données nutritionnelles d'exemple"""
        np.random.seed(42)
        
        aliments = ['Pomme', 'Banane', 'Poulet', 'Saumon', 'Brocoli', 'Riz', 'Pâtes', 'Pain']
        
        data = {
            'aliment': np.random.choice(aliments, n_samples),
            'calories': np.random.randint(50, 500, n_samples),
            'proteines': np.random.uniform(5, 50, n_samples).round(1),
            'glucides': np.random.uniform(10, 80, n_samples).round(1),
            'lipides': np.random.uniform(2, 30, n_samples).round(1)
        }
        
        return pd.DataFrame(data)
    
    def _generate_fitness_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données de fitness d'exemple"""
        np.random.seed(42)
        
        exercices = ['Course', 'Musculation', 'Yoga', 'Natation', 'Vélo', 'Marche']
        
        data = {
            'date': pd.date_range('2023-01-01', periods=n_samples, freq='D'),
            'exercice': np.random.choice(exercices, n_samples),
            'duree': np.random.randint(15, 120, n_samples),
            'calories_brûlées': np.random.randint(100, 800, n_samples),
            'performance': np.random.uniform(1, 10, n_samples).round(1)
        }
        
        return pd.DataFrame(data)
    
    def _generate_environment_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données environnementales d'exemple"""
        np.random.seed(42)
        
        data = {
            'date': pd.date_range('2023-01-01', periods=n_samples, freq='D'),
            'qualite_air': np.random.choice(['Bonne', 'Moyenne', 'Mauvaise'], n_samples),
            'pollution': np.random.uniform(0, 100, n_samples).round(1),
            'temperature': np.random.uniform(-10, 40, n_samples).round(1),
            'humidite': np.random.uniform(20, 90, n_samples).round(1)
        }
        
        return pd.DataFrame(data)
    
    def _generate_epidemiology_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données épidémiologiques d'exemple"""
        np.random.seed(42)
        
        maladies = ['Grippe', 'COVID-19', 'Rougeole', 'Varicelle', 'Autre']
        regions = ['Nord', 'Sud', 'Est', 'Ouest', 'Centre']
        
        data = {
            'date': pd.date_range('2023-01-01', periods=n_samples, freq='D'),
            'maladie': np.random.choice(maladies, n_samples),
            'cas': np.random.randint(0, 100, n_samples),
            'vaccins': np.random.randint(0, 50, n_samples),
            'region': np.random.choice(regions, n_samples)
        }
        
        return pd.DataFrame(data)
    
    def _generate_mental_health_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données de santé mentale d'exemple"""
        np.random.seed(42)
        
        data = {
            'date': pd.date_range('2023-01-01', periods=n_samples, freq='D'),
            'stress_level': np.random.randint(1, 10, n_samples),
            'anxiete': np.random.randint(1, 10, n_samples),
            'bien_etre': np.random.randint(1, 10, n_samples),
            'facteurs': np.random.choice(['Travail', 'Famille', 'Santé', 'Finances', 'Autre'], n_samples)
        }
        
        return pd.DataFrame(data)
    
    def _generate_genetic_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données génétiques d'exemple"""
        np.random.seed(42)
        
        genes = ['BRCA1', 'BRCA2', 'APOE', 'COMT', 'MTHFR']
        mutations = ['Mutation', 'Polymorphisme', 'Normal']
        
        data = {
            'patient_id': [f"PAT_{i:06d}" for i in range(n_samples)],
            'gene': np.random.choice(genes, n_samples),
            'mutation': np.random.choice(mutations, n_samples),
            'predisposition': np.random.choice(['Élevée', 'Modérée', 'Faible'], n_samples),
            'medicament': np.random.choice(['Métaboliseur lent', 'Métaboliseur normal', 'Métaboliseur rapide'], n_samples)
        }
        
        return pd.DataFrame(data)
    
    def _generate_telemedicine_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données de télémédecine d'exemple"""
        np.random.seed(42)
        
        types_consultation = ['Vidéo', 'Téléphone', 'Chat', 'Email']
        
        data = {
            'date': pd.date_range('2023-01-01', periods=n_samples, freq='D'),
            'consultation_type': np.random.choice(types_consultation, n_samples),
            'duree': np.random.randint(10, 60, n_samples),
            'satisfaction': np.random.randint(1, 5, n_samples),
            'resultat': np.random.choice(['Résolu', 'Suivi nécessaire', 'Référence spécialiste'], n_samples)
        }
        
        return pd.DataFrame(data)
    
    def _generate_clinical_research_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données de recherche clinique d'exemple"""
        np.random.seed(42)
        
        medicaments = ['Médicament A', 'Médicament B', 'Placebo', 'Médicament C']
        phases = ['Phase I', 'Phase II', 'Phase III', 'Phase IV']
        
        data = {
            'essai_id': [f"ESS_{i:06d}" for i in range(n_samples)],
            'medicament': np.random.choice(medicaments, n_samples),
            'efficacite': np.random.uniform(0, 100, n_samples).round(1),
            'effets_secondaires': np.random.randint(0, 20, n_samples),
            'phase': np.random.choice(phases, n_samples)
        }
        
        return pd.DataFrame(data)
    
    def _generate_public_health_data(self, n_samples: int) -> pd.DataFrame:
        """Génère des données de santé publique d'exemple"""
        np.random.seed(42)
        
        politiques = ['Vaccination', 'Prévention', 'Screening', 'Éducation', 'Infrastructure']
        regions = ['Nord', 'Sud', 'Est', 'Ouest', 'Centre']
        
        data = {
            'annee': np.random.randint(2020, 2024, n_samples),
            'politique': np.random.choice(politiques, n_samples),
            'budget': np.random.randint(10000, 1000000, n_samples),
            'impact': np.random.uniform(0, 100, n_samples).round(1),
            'region': np.random.choice(regions, n_samples)
        }
        
        return pd.DataFrame(data)

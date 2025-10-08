#!/usr/bin/env python3
"""
INNOVA+ SANTÉ - Script de lancement
Lance l'application Streamlit principale
"""

import sys
import subprocess
from pathlib import Path

def main():
    """Lance l'application INNOVA+ Santé"""
    
    print("🏥 INNOVA+ SANTÉ & BIEN-ÊTRE")
    print("=" * 50)
    print("🚀 Démarrage de la plateforme d'IA santé...")
    print()
    
    # Vérification de l'environnement
    try:
        import streamlit
        import pandas
        import plotly
        print("✅ Dépendances principales vérifiées")
    except ImportError as e:
        print(f"❌ Dépendance manquante: {e}")
        print("💡 Installez les dépendances avec: pip install -r requirements.txt")
        sys.exit(1)
    
    # Chemin vers l'application
    app_path = Path(__file__).parent / "streamlit_app" / "main.py"
    
    if not app_path.exists():
        print(f"❌ Fichier d'application non trouvé: {app_path}")
        sys.exit(1)
    
    print(f"📁 Application trouvée: {app_path}")
    print()
    
    # Lancement de Streamlit
    try:
        print("🌐 Lancement de l'interface web...")
        print("📱 L'application sera disponible sur: http://localhost:8501")
        print()
        print("🔄 Redémarrage automatique activé")
        print("⏹️  Appuyez sur Ctrl+C pour arrêter")
        print()
        print("=" * 50)
        
        # Commande Streamlit
        cmd = [
            sys.executable, "-m", "streamlit", "run",
            str(app_path),
            "--server.port", "8501",
            "--server.address", "localhost",
            "--browser.gatherUsageStats", "false"
        ]
        
        # Lancement
        subprocess.run(cmd, check=True)
        
    except KeyboardInterrupt:
        print("\n⏹️  Arrêt de l'application...")
        print("👋 Merci d'avoir utilisé INNOVA+ SANTÉ !")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors du lancement: {e}")
        sys.exit(1)
    
    except Exception as e:
        print(f"❌ Erreur inattendue: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

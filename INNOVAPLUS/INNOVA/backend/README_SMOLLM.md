# SmolLM-1.7B-Instruct Integration

Ce document décrit l'intégration du modèle SmolLM-1.7B-Instruct dans le backend INNOVA+.

## Installation

Le modèle a été téléchargé et installé dans le répertoire `smollm-1.7b-instruct/` du backend.

### Fichiers du modèle
- `model.safetensors` (3.42GB) - Poids du modèle
- `config.json` - Configuration du modèle
- `tokenizer.json` - Tokenizer
- `tokenizer_config.json` - Configuration du tokenizer
- `special_tokens_map.json` - Mapping des tokens spéciaux
- `merges.txt` - Fichier de fusion BPE
- `generation_config.json` - Configuration de génération

## Configuration

### Variables d'environnement

```bash
# Activer SmolLM (optionnel, par défaut false)
ENABLE_SMOLLM=true

# Chemin vers le modèle (par défaut: smollm-1.7b-instruct dans le repo)
# Exemples :
#   SMOLLM_MODEL_PATH=smollm-360m-instruct                # dossier présent dans backend/
#   SMOLLM_MODEL_PATH=/opt/innovaplus/models/smollm-360m  # chemin absolu sur le serveur
SMOLLM_MODEL_PATH=smollm-1.7b-instruct
```

### Dépendances ajoutées

Les dépendances suivantes ont été ajoutées à `requirements.txt`:

```
huggingface_hub>=0.35.0
transformers>=4.40.0
torch>=2.0.0
safetensors>=0.4.0
accelerate>=0.25.0
```

## API Endpoints

### Chat Completion
```
POST /smollm/chat
```

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Bonjour, comment ça va ?"}
  ],
  "max_tokens": 512,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "response": "Bonjour ! Je vais bien, merci de demander...",
  "model_info": {
    "model_name": "SmolLM-1.7B-Instruct",
    "device": "cuda",
    "parameters": 1700000000
  }
}
```

### Text Generation
```
POST /smollm/generate
```

**Request:**
```json
{
  "prompt": "Écris un poème sur l'IA",
  "max_length": 256,
  "temperature": 0.8,
  "num_return_sequences": 1
}
```

### Model Info
```
GET /smollm/info
```

### Health Check
```
POST /smollm/health
```

## Utilisation

### Initialisation

Le modèle est initialisé automatiquement au démarrage de l'application si `ENABLE_SMOLLM=true`.

### Utilisation dans le code

```python
from app.core.smollm import get_smollm_model

# Obtenir l'instance du modèle
model = get_smollm_model()

# Génération de texte
responses = model.generate(
    prompt="Votre prompt ici",
    max_length=512,
    temperature=0.7
)

# Chat completion
response = model.chat_completion(
    messages=[
        {"role": "user", "content": "Bonjour"}
    ],
    max_tokens=256
)
```

## Performance

- **Taille du modèle**: 1.7B paramètres (~3.4GB)
- **Support GPU**: Oui (CUDA si disponible)
- **Support CPU**: Oui (fallback automatique)
- **Mémoire requise**: ~4-6GB RAM/VRAM

## Intégration avec CHATLAYA

SmolLM peut être utilisé comme alternative ou complément à Cohere dans CHATLAYA:

1. **Fallback**: Utiliser SmolLM si Cohere n'est pas disponible
2. **Hybrid**: Combiner les deux modèles pour de meilleurs résultats
3. **Local**: Utiliser SmolLM pour des cas d'usage nécessitant la confidentialité

## Monitoring

Le statut de SmolLM est inclus dans les endpoints de santé de l'application:

```bash
curl http://localhost:8000/smollm/health
```

## Déploiement

### Local
```bash
# Installer les dépendances
pip install -r requirements.txt

# Activer SmolLM
export ENABLE_SMOLLM=true

# Démarrer l'application
uvicorn app.main:app --reload
```

### Production (Render/Vercel)

1. Ajouter les variables d'environnement:
   - `ENABLE_SMOLLM=true`
   - `SMOLLM_MODEL_PATH=smollm-1.7b-instruct`

2. S'assurer que le modèle est inclus dans le build

3. Vérifier les ressources disponibles (mémoire/CPU)

## Limitations

- **Taille**: Le modèle nécessite ~4-6GB de mémoire
- **Latence**: Plus lent que les API externes pour les premières requêtes
- **Qualité**: Moins performant que les modèles plus grands (GPT-4, Claude, etc.)

## Support

Pour toute question ou problème avec SmolLM, consulter:
- [Documentation SmolLM](https://huggingface.co/HuggingFaceTB/SmolLM-1.7B-Instruct)
- [Documentation Transformers](https://huggingface.co/docs/transformers/)
- Logs de l'application pour les erreurs spécifiques

Voici le **brief d’implémentation détaillé à donner à Codex**, avec **ordre de travail strict**, **livrables**, **preuves attendues** et **checklist finale**.

Le cadrage technique retenu est celui-ci :

* **Python / FastAPI** = noyau produit, API, orchestration, auth, historique, consolidation ;
* **R / plumber** = moteur analytique/statistique expert ;
* **SQL** = couche centrale de structuration, stockage, agrégations et restitution ;
* **DuckDB** = moteur SQL analytique sur fichiers uploadés ;
* **PostgreSQL** = persistance produit + résultats + historique + vues de reporting.

Ce choix est cohérent avec les capacités documentées de FastAPI pour les uploads et l’organisation modulaire de l’application, de plumber pour exposer des fonctions R comme API HTTP avec sérialisation JSON, de DuckDB pour lire/analyser directement des CSV/JSON avec auto-détection, et de PostgreSQL pour `jsonb`, index GIN et vues matérialisées. ([FastAPI][1])

# Instruction Codex — Analyse avancée automatisée KORYXA

## 0. Règle de travail non négociable

Tu avances **phase par phase**.
Tu ne passes pas à la phase suivante tant que la phase courante n’est pas :

* codée,
* testée,
* exécutable,
* et prouvée par capture/JSON/endpoint/output.

Aucun saut d’étape.
Aucune “implémentation partielle implicite”.

---

## 1. Objectif produit

Transformer la page actuelle `/entreprise/analyse/auto` en un vrai service d’**analyse avancée automatisée**.

### Ce que le produit doit faire

À partir d’un fichier uploadé, le système doit produire :

1. un **diagnostic structurel** ;
2. un **score de qualité des données** ;
3. des **constats analytiques** ;
4. des **détections automatiques** :

   * anomalies,
   * tendances,
   * distributions,
   * segments,
   * temporalité si applicable ;
5. des **recommandations priorisées** ;
6. une **restitution claire** côté frontend ;
7. un **historique persistant** des analyses.

### Ce que le produit ne doit pas être

* un simple résumé LLM ;
* un chatbot qui improvise ;
* une analyse non traçable ;
* une sortie non structurée ;
* un système où R, Python et SQL se chevauchent sans responsabilité claire.

---

## 2. Répartition stricte des rôles

## Python / FastAPI

Responsabilités :

* endpoints publics ;
* upload ;
* validation du fichier ;
* création des jobs ;
* orchestration globale ;
* appel au moteur DuckDB ;
* appel au service R ;
* moteur de décision ;
* moteur de recommandations ;
* persistance PostgreSQL ;
* historique ;
* payload final pour le frontend.

FastAPI supporte nativement les uploads via `UploadFile` et la structuration modulaire d’applications plus larges. ([FastAPI][1])

## R / plumber

Responsabilités :

* statistiques descriptives avancées ;
* diagnostics analytiques experts ;
* tests/statistiques métier ;
* analyse temporelle experte si besoin ;
* scoring/statistiques spécialisées ;
* retour JSON structuré ;
* aucun texte libre orienté frontend.

Plumber route les requêtes HTTP vers des fonctions R, permet de définir les API via annotations et de sérialiser les sorties en JSON. ([RPlumber][2])

## SQL

Responsabilités :

* stockage persistant ;
* métadonnées ;
* résultats structurés ;
* historique ;
* agrégations ;
* vues de reporting ;
* requêtes analytiques tabulaires ;
* préparation des couches de restitution.

PostgreSQL est adapté à ce rôle avec `jsonb`, fonctions/opérateurs JSON, indexation GIN et vues matérialisées. ([PostgreSQL][3])

## DuckDB

Responsabilités :

* lecture rapide des fichiers uploadés ;
* auto-détection CSV ;
* lecture JSON ;
* calculs exploratoires tabulaires ;
* profiling et agrégations rapides.

DuckDB documente l’auto-détection CSV, la lecture JSON avec inférence automatique, et le fait de requêter directement des fichiers. ([DuckDB][4])

---

## 3. Architecture cible à implémenter

### Backend Python

Créer ou structurer les modules suivants :

* `app/api/`
* `app/core/`
* `app/models/`
* `app/schemas/`
* `app/services/upload/`
* `app/services/profiling/`
* `app/services/duckdb/`
* `app/services/r_client/`
* `app/services/recommendation/`
* `app/services/jobs/`
* `app/services/results/`
* `app/repositories/`
* `app/workflows/analysis_auto/`

### Service R

Créer un service séparé :

* `r-analytics/plumber.R`
* `r-analytics/R/descriptive.R`
* `r-analytics/R/timeseries.R`
* `r-analytics/R/anomaly.R`
* `r-analytics/R/utils.R`

### Base PostgreSQL

Créer le schéma persistant du produit.

### Frontend

Conserver la route actuelle mais la faire évoluer en :

* page d’upload,
* page/état d’analyse,
* page/état de résultats,
* historique.

---

## 4. Modèle de données SQL à implémenter d’abord

Implémenter ces tables minimales.

### `analysis_jobs`

Colonnes minimales :

* `id`
* `organization_id`
* `user_id`
* `status` (`queued`, `running`, `failed`, `completed`)
* `source_filename`
* `source_type` (`csv`, `json`, plus tard `xlsx`)
* `storage_path`
* `file_size_bytes`
* `file_hash`
* `analysis_mode_detected`
* `created_at`
* `started_at`
* `finished_at`
* `error_message`

### `analysis_profiles`

* `id`
* `job_id`
* `row_count`
* `column_count`
* `schema_jsonb`
* `column_summary_jsonb`
* `missing_summary_jsonb`
* `duplicate_summary_jsonb`
* `quality_score`
* `quality_flags_jsonb`

### `analysis_insights`

* `id`
* `job_id`
* `category` (`quality`, `structure`, `trend`, `anomaly`, `segment`, `time`)
* `title`
* `description`
* `severity`
* `confidence`
* `evidence_jsonb`
* `sort_order`

### `analysis_recommendations`

* `id`
* `job_id`
* `title`
* `action_type`
* `priority`
* `impact_score`
* `confidence_score`
* `rationale`
* `evidence_jsonb`
* `owner_suggestion`
* `created_at`

### `analysis_artifacts`

* `id`
* `job_id`
* `artifact_type` (`profile_json`, `duckdb_summary`, `r_result`, `final_result`)
* `payload_jsonb`
* `created_at`

### `analysis_runs`

* `id`
* `job_id`
* `step_name`
* `step_status`
* `started_at`
* `finished_at`
* `logs_jsonb`

### vues à prévoir après V1

* `mv_analysis_org_daily`
* `mv_analysis_quality_overview`
* `mv_analysis_usage_overview`

PostgreSQL permet de stocker du JSON valide via `json/jsonb`, `jsonb` étant généralement préférable pour le traitement et l’indexation, et les vues matérialisées peuvent être rafraîchies plus tard pour le reporting. ([PostgreSQL][3])

---

## 5. Contrat de sortie produit unique

Codex doit imposer un **schéma JSON final unique** pour le frontend.
Aucune sortie libre non normalisée.

### Objet final attendu

```json
{
  "job_id": "uuid",
  "status": "completed",
  "dataset": {
    "filename": "sales_q1.csv",
    "source_type": "csv",
    "rows": 12000,
    "columns": 24,
    "detected_analysis_mode": "descriptive_timeseries"
  },
  "quality": {
    "score": 78,
    "level": "bon",
    "issues": []
  },
  "structure": {
    "numeric_columns": [],
    "categorical_columns": [],
    "date_columns": [],
    "id_columns": []
  },
  "insights": [],
  "anomalies": [],
  "recommendations": [],
  "artifacts": {
    "profile_ready": true,
    "r_analysis_ready": true
  }
}
```

Le frontend ne doit jamais parser des formats variables.

---

## 6. Ordre de travail impératif

## Phase 1 — Fondations backend Python

### À faire

* structurer le backend en modules ;
* créer config/env propres ;
* créer endpoint `/health` ;
* créer endpoint `/api/v1/analysis/health` ;
* brancher PostgreSQL ;
* mettre en place migrations ;
* créer modèles ORM ou équivalent ;
* créer schémas Pydantic des réponses.

### Preuve attendue

* capture du tree backend ;
* output de migration réussie ;
* JSON `/health` ;
* JSON `/api/v1/analysis/health`.

### Critère d’acceptation

* backend démarre proprement ;
* docs API disponibles ;
* base connectée ;
* migrations exécutées.

---

## Phase 2 — Schéma SQL persistant

### À faire

* créer tables `analysis_jobs`, `analysis_profiles`, `analysis_insights`, `analysis_recommendations`, `analysis_artifacts`, `analysis_runs` ;
* ajouter index utiles ;
* utiliser `jsonb` pour payloads structurés ;
* préparer 1 ou 2 requêtes SQL de lecture historique.

### Preuve attendue

* SQL de migration ;
* capture schéma DB ;
* test d’insertion et lecture.

### Critère d’acceptation

* insertion d’un job de test réussie ;
* lecture du job par ID réussie ;
* suppression/rollback possibles.

---

## Phase 3 — Upload robuste côté Python

### À faire

* créer endpoint `POST /api/v1/analysis/jobs` ;
* accepter `multipart/form-data` ;
* fichiers autorisés : `csv`, `json` ;
* taille max configurable ;
* validation extension + MIME minimum ;
* calcul hash ;
* sauvegarde fichier ;
* création du job en DB ;
* retour immédiat avec `job_id` et `status=queued`.

FastAPI documente l’usage de `File`, `Form` et `UploadFile` pour ce type de flux. ([FastAPI][5])

### Preuve attendue

* appel Postman/curl ;
* réponse JSON ;
* enregistrement du fichier sur disque/object storage ;
* job visible en DB.

### Critère d’acceptation

* upload CSV valide ;
* upload JSON valide ;
* rejet propre d’un format invalide.

---

## Phase 4 — Moteur DuckDB de profiling structurel

### À faire

* créer service Python `duckdb_profile_service` ;
* lire le fichier uploadé via DuckDB ;
* auto-détecter structure CSV ;
* charger JSON si applicable ;
* calculer :

  * nombre de lignes,
  * nombre de colonnes,
  * noms colonnes,
  * types détectés,
  * colonnes numériques,
  * colonnes catégorielles,
  * colonnes dates probables,
  * taux de nulls,
  * doublons simples,
  * cardinalité par colonne,
  * colonnes constantes,
  * colonnes quasi vides ;
* stocker le résultat dans `analysis_profiles`.

DuckDB documente l’auto-détection du dialecte CSV, des types et de l’en-tête, ainsi que le chargement JSON avec inférence automatique. ([DuckDB][4])

### Preuve attendue

* JSON profil complet pour 1 CSV ;
* JSON profil complet pour 1 JSON ;
* ligne DB dans `analysis_profiles`.

### Critère d’acceptation

* le profiling fonctionne sans intervention manuelle sur un fichier simple ;
* le résultat est structuré et stable.

---

## Phase 5 — Score qualité déterministe

### À faire

Implémenter un score qualité sur 100 basé sur règles, pas sur LLM.

### Variables minimales du score

* taux de nulls ;
* taux de doublons ;
* colonnes entièrement vides ;
* colonnes constantes ;
* incohérences de types ;
* clés potentiellement cassées ;
* taux de valeurs aberrantes simples sur colonnes numériques.

### À produire

* score global ;
* niveau (`faible`, `moyen`, `bon`, `excellent`) ;
* liste de drapeaux qualité ;
* résumé structuré.

### Preuve attendue

* exemple sur dataset propre ;
* exemple sur dataset bruité ;
* comparaison des scores.

### Critère d’acceptation

* score explicable ;
* même entrée = même score ;
* drapeaux lisibles.

---

## Phase 6 — Détection automatique du mode d’analyse

### À faire

Créer un moteur de routage qui choisit le type d’analyse :

* `descriptive`
* `descriptive_timeseries`
* `anomaly_scan`
* `segment_scan`
* `mixed_basic`

### Règles minimales

* si date exploitable + numériques → `descriptive_timeseries`
* si numériques suffisants → `anomaly_scan`
* si catégories + segments → `segment_scan`
* sinon → `descriptive`

### Preuve attendue

* fonction de décision testée sur 4 datasets exemples ;
* logs du mode choisi.

### Critère d’acceptation

* règles compréhensibles ;
* aucun appel R sans motif clair.

---

## Phase 7 — Service R analytique

### À faire

Créer un service plumber séparé avec au minimum :

* `GET /health`
* `POST /analyze/descriptive`
* `POST /analyze/timeseries`
* `POST /analyze/anomalies`

### Règles d’implémentation

* entrée JSON normalisée ;
* sortie JSON normalisée ;
* aucune phrase frontend ;
* uniquement des résultats analytiques structurés.

Exemple de sortie :

```json
{
  "summary_stats": {},
  "signals": [],
  "anomaly_candidates": [],
  "time_findings": [],
  "model_notes": []
}
```

Plumber permet de définir les API par annotations, de router les entrées et de sérialiser les réponses JSON. ([RPlumber][2])

### Preuve attendue

* service R lancé ;
* `/health` OK ;
* appel descriptif OK ;
* appel anomalies OK ;
* payload JSON stable.

### Critère d’acceptation

* Python peut appeler R ;
* R ne casse pas si une colonne manque ;
* réponses prévisibles.

---

## Phase 8 — Client Python vers R

### À faire

Créer `r_analytics_client` dans Python :

* ping `/health` ;
* appel endpoint analytique selon `analysis_mode_detected` ;
* timeout ;
* gestion des erreurs ;
* fallback si R indisponible.

### Règle

Si R tombe :

* le job n’échoue pas totalement ;
* Python retourne au moins :

  * profil structurel,
  * score qualité,
  * insights de base,
  * message “analyse experte indisponible”.

### Preuve attendue

* appel réussi ;
* appel en erreur simulée ;
* fallback vérifié.

### Critère d’acceptation

* résilience minimale garantie.

---

## Phase 9 — Moteur d’insights et recommandations

### À faire

Créer un moteur Python qui fusionne :

* résultats DuckDB ;
* résultats R ;
* règles métier internes.

### Les recommandations doivent avoir

* `title`
* `priority`
* `impact_score`
* `confidence_score`
* `rationale`
* `evidence_jsonb`
* `action_type`

### Règle impérative

Le LLM ne décide pas seul.
Le LLM sert seulement à reformuler proprement des recommandations déjà dérivées des signaux calculés.

### Priorisation minimale

* impact business estimé ;
* gravité ;
* confiance ;
* urgence.

### Preuve attendue

* 1 dataset qualité faible ;
* 1 dataset anomalies ;
* 1 dataset temporel ;
* recommandations cohérentes sur chaque cas.

### Critère d’acceptation

* recommandations non vagues ;
* recommandations liées à une preuve ;
* tri prioritaire correct.

---

## Phase 10 — Endpoints de lecture des résultats

### À faire

Créer :

* `GET /api/v1/analysis/jobs/{job_id}`
* `GET /api/v1/analysis/jobs/{job_id}/result`
* `GET /api/v1/analysis/jobs/{job_id}/insights`
* `GET /api/v1/analysis/jobs/{job_id}/recommendations`
* `GET /api/v1/analysis/history`

### Preuve attendue

* réponses JSON complètes ;
* historique paginé ;
* tri décroissant par date.

### Critère d’acceptation

* le frontend n’a plus besoin de logique métier.

---

## Phase 11 — Frontend KORYXA

### À faire

Faire évoluer `/entreprise/analyse/auto` en 4 états clairs :

### État 1 — Upload

* drag & drop
* choix fichier
* validation format
* message limites

### État 2 — Analyse en cours

* progression par étapes :

  * upload,
  * lecture structurelle,
  * contrôle qualité,
  * analyse experte,
  * génération recommandations

### État 3 — Résultat

Sections obligatoires :

* résumé exécutif
* score qualité
* structure du dataset
* alertes qualité
* insights clés
* anomalies / tendances
* recommandations priorisées

### État 4 — Historique

* liste analyses précédentes
* accès détail
* statut
* date
* score qualité
* type d’analyse

### Preuve attendue

* captures des 4 états ;
* résultat sur vrai dataset ;
* historique persistant.

### Critère d’acceptation

* pas de page vide ;
* pas de JSON brut au frontend ;
* restitution lisible pour un non-technique.

---

## Phase 12 — Historique et reporting SQL

### À faire

* enregistrer tous les résultats finaux ;
* créer vues SQL utiles ;
* créer au moins une vue matérialisée de synthèse organisation.

Exemples :

* nombre d’analyses par période
* score qualité moyen
* types d’analyses les plus fréquents
* volume de datasets analysés

PostgreSQL permet d’utiliser des vues matérialisées persistées et rafraîchissables pour ce type de reporting. ([PostgreSQL][6])

### Preuve attendue

* SQL de la vue ;
* résultat d’un `REFRESH MATERIALIZED VIEW` ;
* requête de lecture.

### Critère d’acceptation

* reporting exploitable sans recalcul complet à chaque fois.

---

## Phase 13 — Tests

### À faire

Tests minimaux :

### backend Python

* upload valide/invalide
* création job
* lecture historique
* fallback R

### DuckDB

* profiling CSV simple
* profiling JSON simple
* gestion colonne date
* gestion fichier imparfait

DuckDB documente explicitement la gestion des CSV difficiles et de plusieurs erreurs structurelles, ce qui justifie de prévoir ces cas de test. ([DuckDB][7])

### service R

* health
* descriptive
* anomalies
* timeseries

### frontend

* upload success
* upload error
* loading state
* result rendering

FastAPI documente aussi les tests applicatifs de base pour les endpoints. ([FastAPI][8])

### Preuve attendue

* résultat tests ;
* nombre tests passés ;
* 0 blocage critique.

---

# 7. Règles d’implémentation produit

## Règle 1

Aucune logique d’analyse cachée dans le frontend.

## Règle 2

Aucune sortie R brute directement au frontend.

## Règle 3

Aucune recommandation purement LLM sans signaux calculés.

## Règle 4

Le JSON final doit rester stable.

## Règle 5

Chaque étape doit écrire son statut dans `analysis_runs`.

## Règle 6

Chaque résultat important doit être traçable par `evidence_jsonb`.

## Règle 7

En V1, ne pas disperser le périmètre :

* CSV
* JSON
* historique
* score qualité
* insights
* recommandations
* résultat lisible

Pas plus.

---

# 8. Ordre de travail ultra-court à respecter

1. fondations backend Python
2. schéma PostgreSQL
3. upload + création job
4. profiling DuckDB
5. score qualité
6. routage du mode d’analyse
7. service R plumber
8. client Python ↔ R
9. moteur insights/recommandations
10. endpoints de restitution
11. frontend états upload/analyse/résultat/historique
12. vues SQL de reporting
13. tests finaux

---

# 9. Checklist finale de validation

## Backend

* [ ] backend modulaire propre
* [ ] endpoint health OK
* [ ] migrations DB OK
* [ ] schéma SQL en place
* [ ] upload CSV OK
* [ ] upload JSON OK
* [ ] job créé en DB
* [ ] historique lisible
* [ ] résultat par job lisible

## DuckDB

* [ ] lecture CSV OK
* [ ] lecture JSON OK
* [ ] profiling structurel OK
* [ ] taux nulls calculé
* [ ] doublons calculés
* [ ] colonnes détectées correctement
* [ ] qualité calculée

## R

* [ ] service plumber démarre
* [ ] health OK
* [ ] descriptive OK
* [ ] anomalies OK
* [ ] timeseries OK
* [ ] sortie JSON stable

## Orchestration

* [ ] Python choisit le mode d’analyse
* [ ] Python appelle R correctement
* [ ] fallback si R down
* [ ] consolidation DuckDB + R OK

## Résultats

* [ ] score qualité affiché
* [ ] insights stockés
* [ ] recommandations priorisées stockées
* [ ] evidence_jsonb présent
* [ ] payload final stable

## Frontend

* [ ] upload state OK
* [ ] loading state OK
* [ ] result state OK
* [ ] history state OK
* [ ] page lisible sans JSON brut
* [ ] erreurs utilisateur propres

## Reporting

* [ ] vues SQL créées
* [ ] au moins une vue matérialisée créée
* [ ] historique organisation exploitable

## Tests

* [ ] tests backend passent
* [ ] tests service R passent
* [ ] tests frontend critiques passent
* [ ] aucun blocage critique restant

---

# 10. Priorité produit V1

Codex doit viser une **V1 robuste et vendable**, pas une V1 “impressionnante mais fragile”.

Donc priorité absolue :

* fiabilité,
* structure,
* traçabilité,
* lisibilité,
* recommandations crédibles.

Pas de dispersion sur :

* AutoML large,
* causalité,
* conversation IA libre,
* dizaines de formats,
* reporting ultra-complexe.


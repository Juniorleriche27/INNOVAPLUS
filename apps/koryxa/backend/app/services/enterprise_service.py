from __future__ import annotations

from typing import Any

from app.services.ai_json import generate_structured_json


def _normalized(value: str | None) -> str:
    return " ".join((value or "").strip().split())


def _company_name(payload: dict[str, Any]) -> str:
    return _normalized(str(payload.get("company_name") or ""))


def _company_subject(payload: dict[str, Any]) -> str:
    company_name = _company_name(payload)
    return company_name or "l'entreprise"


def _recommended_treatment_mode(preference: str) -> str:
    normalized = _normalized(preference).lower()
    if "priv" in normalized:
        return "prive"
    if "publ" in normalized or "opportunit" in normalized:
        return "publie"
    return "accompagne"


def _derive_opportunity_type(need_type: str) -> str:
    normalized = _normalized(need_type).lower()
    if "stage" in normalized:
        return "stage"
    if "collaboration" in normalized:
        return "collaboration"
    if "automatisation" in normalized or "projet" in normalized:
        return "project"
    if "appui" in normalized:
        return "accompagnement"
    return "mission"


def _treatment_need_status(treatment_mode: str) -> str:
    if treatment_mode == "publie":
        return "published"
    return "qualified"


def _treatment_mission_status(treatment_mode: str) -> str:
    if treatment_mode == "accompagne":
        return "in_progress"
    if treatment_mode == "publie":
        return "ready"
    return "structured"


def _derived_title(payload: dict[str, Any]) -> str:
    primary_goal = _normalized(payload["primary_goal"])
    expected_result = _normalized(payload["expected_result"])
    return f"{primary_goal} - {expected_result}"


def _fallback_next_action(recommended_mode: str) -> str:
    if recommended_mode == "publie":
        return "Relire la mission structuree avant publication et ouvrir le cockpit entreprise."
    if recommended_mode == "prive":
        return "Valider le besoin structure puis ouvrir le cockpit pour organiser l'execution."
    return "Passer par un cadrage accompagne puis ouvrir le cockpit d'execution."


def _fallback_structure(payload: dict[str, Any]) -> dict[str, Any]:
    recommended_mode = _recommended_treatment_mode(payload["treatment_preference"])
    opportunity_type = _derive_opportunity_type(payload["need_type"])
    qualification_score = 82 if recommended_mode == "accompagne" else 76 if recommended_mode == "publie" else 70
    clarity_level = "strong" if recommended_mode == "accompagne" else "qualified"
    title = _derived_title(payload)
    company_subject = _company_subject(payload)
    need_summary = (
        f"Pour {company_subject}, l'objectif principal est {_normalized(payload['primary_goal']).lower()}. "
        f"Le besoin ressemble a {_normalized(payload['need_type']).lower()} avec un resultat attendu centre sur "
        f"{_normalized(payload['expected_result']).lower()}. "
        f"Le cadre actuel correspond a {_normalized(payload['team_context']).lower()}."
    )
    return {
        "title": title,
        "need_summary": need_summary,
        "qualification_score": qualification_score,
        "clarity_level": clarity_level,
        "recommended_treatment_mode": recommended_mode,
        "next_recommended_action": _fallback_next_action(recommended_mode),
        "mission": {
            "title": f"Mission : {title}",
            "summary": (
                f"Mission structuree pour {company_subject}, a partir d'un objectif business clarifie "
                "et d'un besoin operationnel qualifie."
            ),
            "deliverable": _normalized(payload["expected_result"]),
            "execution_mode": recommended_mode,
            "steps": [
                "Clarifier le perimetre et les criteres de reussite",
                "Lancer le lot de travail prioritaire",
                "Restituer un livrable exploitable et relire la suite",
            ],
        },
        "opportunity": {
            "type": opportunity_type,
            "title": title,
            "summary": f"Opportunite publiee pour {company_subject} a partir d'un besoin deja structure et lisible.",
            "highlights": [
                _normalized(payload["need_type"]),
                _normalized(payload["expected_result"]),
                _normalized(payload["urgency"]),
            ],
        },
    }


def _coerce_structure(generated: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    mission = generated.get("mission") if isinstance(generated.get("mission"), dict) else {}
    opportunity = generated.get("opportunity") if isinstance(generated.get("opportunity"), dict) else {}
    steps = mission.get("steps") if isinstance(mission.get("steps"), list) else []
    highlights = opportunity.get("highlights") if isinstance(opportunity.get("highlights"), list) else []

    qualification_score = generated.get("qualification_score")
    if not isinstance(qualification_score, int):
        qualification_score = fallback["qualification_score"]

    recommended_mode = _normalized(str(generated.get("recommended_treatment_mode") or ""))
    if recommended_mode not in {"prive", "publie", "accompagne"}:
        recommended_mode = fallback["recommended_treatment_mode"]

    return {
        "title": _normalized(str(generated.get("title") or "")) or fallback["title"],
        "need_summary": _normalized(str(generated.get("need_summary") or "")) or fallback["need_summary"],
        "qualification_score": max(0, min(100, qualification_score)),
        "clarity_level": _normalized(str(generated.get("clarity_level") or "")) or fallback["clarity_level"],
        "recommended_treatment_mode": recommended_mode,
        "next_recommended_action": _normalized(str(generated.get("next_recommended_action") or "")) or fallback["next_recommended_action"],
        "mission": {
            "title": _normalized(str(mission.get("title") or "")) or fallback["mission"]["title"],
            "summary": _normalized(str(mission.get("summary") or "")) or fallback["mission"]["summary"],
            "deliverable": _normalized(str(mission.get("deliverable") or "")) or fallback["mission"]["deliverable"],
            "execution_mode": (
                _normalized(str(mission.get("execution_mode") or ""))
                if _normalized(str(mission.get("execution_mode") or "")) in {"prive", "publie", "accompagne"}
                else fallback["mission"]["execution_mode"]
            ),
            "steps": [_normalized(str(step)) for step in steps if _normalized(str(step))] or fallback["mission"]["steps"],
        },
        "opportunity": {
            "type": (
                _normalized(str(opportunity.get("type") or "")).lower()
                if _normalized(str(opportunity.get("type") or "")).lower() in {"mission", "stage", "collaboration", "project", "accompagnement"}
                else fallback["opportunity"]["type"]
            ),
            "title": _normalized(str(opportunity.get("title") or "")) or fallback["opportunity"]["title"],
            "summary": _normalized(str(opportunity.get("summary") or "")) or fallback["opportunity"]["summary"],
            "highlights": [_normalized(str(item)) for item in highlights if _normalized(str(item))] or fallback["opportunity"]["highlights"],
        },
    }


async def structure_enterprise_need(payload: dict[str, Any]) -> dict[str, Any]:
    fallback = _fallback_structure(payload)
    prompt = f"""
Tu aides KORYXA Entreprise a transformer un objectif business en besoin clair et mission exploitable.
Retourne uniquement un JSON objet.

Profil entreprise:
- nom entreprise: {_company_name(payload) or "non precise"}
- objectif principal: {payload["primary_goal"]}
- type de besoin: {payload["need_type"]}
- resultat attendu: {payload["expected_result"]}
- urgence: {payload["urgency"]}
- preference de traitement: {payload["treatment_preference"]}
- contexte d'equipe: {payload["team_context"]}
- accompagnement souhaite: {payload["support_preference"]}
- brief libre: {payload.get("short_brief") or "non precise"}

JSON attendu:
{{
  "title": "string",
  "need_summary": "string",
  "qualification_score": 0,
  "clarity_level": "initial|qualified|strong",
  "recommended_treatment_mode": "prive|publie|accompagne",
  "next_recommended_action": "string",
  "mission": {{
    "title": "string",
    "summary": "string",
    "deliverable": "string",
    "execution_mode": "prive|publie|accompagne",
    "steps": ["string", "string", "string"]
  }},
  "opportunity": {{
    "type": "mission|stage|collaboration|project|accompagnement",
    "title": "string",
    "summary": "string",
    "highlights": ["string", "string", "string"]
  }}
}}

Exigences:
- ne jamais inventer le nom de l'entreprise ni son type de structure
- partir d'un objectif business ou operationnel, pas d'un besoin RH par defaut
- besoin distinct de la mission
- mission plus claire et exploitable que le brief initial
- publication seulement si pertinente
- pas de texte hors JSON
""".strip()
    generated = await generate_structured_json(prompt)
    if not generated:
        return fallback
    return _coerce_structure(generated, fallback)


def derive_statuses(recommended_treatment_mode: str) -> dict[str, str]:
    return {
        "need_status": _treatment_need_status(recommended_treatment_mode),
        "mission_status": _treatment_mission_status(recommended_treatment_mode),
        "opportunity_status": "published" if recommended_treatment_mode == "publie" else "draft",
    }


# ─── Adaptive onboarding ──────────────────────────────────────────────────────

def _extract_primary_goal(answers: list[dict[str, Any]]) -> str:
    """Extrait le primary_goal depuis les réponses (taxonomy ID ou texte libre)."""
    for a in answers:
        if a.get("question_id") == "primary_goal":
            return (a.get("answer") or "").strip().lower()
    return ""


# ─── Labels lisibles des IDs taxonomie ───────────────────────────────────────

_GOAL_LABELS: dict[str, str] = {
    "ia_data_reporting":    "utiliser l'IA pour la data, les reportings et les tableaux de bord",
    "ia_automatisation":    "automatiser des tâches avec l'IA (workflows, scripts, processus répétitifs)",
    "ia_marketing_content": "utiliser l'IA pour le marketing et la création de contenu",
    "ia_sales_crm":         "utiliser l'IA pour les ventes et la gestion CRM",
    "ia_ops_process":       "utiliser l'IA pour optimiser les opérations et les processus internes",
    "ia_rh_talent":         "utiliser l'IA pour les ressources humaines et la gestion des talents",
    "ia_finance_pilotage":  "utiliser l'IA pour la finance et le pilotage de gestion",
    "ia_produit_tech":      "intégrer l'IA dans un produit ou une solution technologique",
    "ia_service_client":    "utiliser l'IA pour améliorer le service client",
    "ia_strategie":         "utiliser l'IA pour la stratégie et l'aide à la décision",
}


_STATIC_TREES: dict[str, list[dict[str, Any]]] = {

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 1 — Data & Reporting IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_data_reporting": [
        {
            "question_id": "data_ia_use_case",
            "question_text": "Que voulez-vous concrètement que l'IA fasse avec vos données ?",
            "hint": "L'usage final oriente toute la conception de la solution.",
            "type": "options",
            "options": [
                {"value": "Générer des rapports automatiques sans intervention manuelle", "label": "Rapports automatiques IA", "hint": "Éliminer la production manuelle de rapports."},
                {"value": "Créer des tableaux de bord IA mis à jour en temps réel", "label": "Dashboards temps réel IA", "hint": "Visualisation live des KPIs clés."},
                {"value": "Détecter automatiquement anomalies et alertes dans les données", "label": "Détection d'anomalies IA", "hint": "Identifier les écarts avant qu'ils deviennent des problèmes."},
                {"value": "Faire des prédictions et prévisions sur des métriques clés", "label": "Prédictions et prévisions IA", "hint": "Anticiper ventes, churn, demandes, etc."},
                {"value": "Permettre des requêtes en langage naturel sur nos données", "label": "Questions en langage naturel", "hint": "\"Quel est mon CA ce mois vs mois dernier ?\" sans SQL."},
                {"value": "Croiser et enrichir automatiquement plusieurs sources de données", "label": "Consolidation et enrichissement IA", "hint": "Unifier des données dispersées pour une vue complète."},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "data_sources",
            "question_text": "D'où viennent vos données aujourd'hui ?",
            "hint": "Les sources de données déterminent l'architecture de la solution IA.",
            "type": "options",
            "options": [
                {"value": "Fichiers Excel ou Google Sheets dispersés entre plusieurs personnes", "label": "Excel / Google Sheets dispersés", "hint": "Données non centralisées, mises à jour manuellement."},
                {"value": "CRM (HubSpot, Salesforce, Pipedrive...)", "label": "CRM", "hint": "Données commerciales et clients structurées."},
                {"value": "ERP ou logiciel de gestion interne", "label": "ERP / logiciel métier"},
                {"value": "Base de données SQL ou NoSQL", "label": "Base de données SQL / NoSQL", "hint": "Données techniques accessibles via requêtes."},
                {"value": "Outils SaaS multiples (Google Analytics, Meta Ads, Stripe...)", "label": "SaaS multiples non connectés", "hint": "Données dans plusieurs outils sans pont entre eux."},
                {"value": "Aucune donnée structurée pour l'instant", "label": "Pas encore de données structurées"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "data_reporting_frequency",
            "question_text": "À quelle fréquence ces analyses ou rapports sont-ils produits aujourd'hui ?",
            "hint": "La fréquence détermine le ROI et l'urgence de l'automatisation IA.",
            "type": "options",
            "options": [
                {"value": "En temps réel ou quotidien", "label": "Temps réel / quotidien"},
                {"value": "Hebdomadaire", "label": "Hebdomadaire"},
                {"value": "Mensuel", "label": "Mensuel"},
                {"value": "Trimestriel ou ponctuel pour des décisions stratégiques", "label": "Trimestriel / ponctuel"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "data_consumers",
            "question_text": "Qui utilise ces données et ces rapports dans votre organisation ?",
            "hint": "Les utilisateurs finaux déterminent le format et la complexité de la solution.",
            "type": "options",
            "options": [
                {"value": "Moi seul ou une petite équipe opérationnelle", "label": "Moi / petite équipe ops"},
                {"value": "Des managers ou responsables d'équipe", "label": "Managers / responsables"},
                {"value": "La direction générale pour la prise de décision", "label": "Direction générale"},
                {"value": "Des équipes commerciales ou terrain", "label": "Équipes commerciales / terrain"},
                {"value": "Des partenaires ou clients externes", "label": "Partenaires / clients externes"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "data_team_tech_level",
            "question_text": "Quel est le niveau technique de votre équipe sur la data ?",
            "hint": "Calibre la solution entre no-code IA et infrastructure technique.",
            "type": "options",
            "options": [
                {"value": "Aucune compétence technique — tout doit être clé en main", "label": "Non-technique — clé en main", "hint": "La solution doit fonctionner sans développeur."},
                {"value": "À l'aise avec Excel et outils SaaS mais pas de code", "label": "Bonne maîtrise outils, pas de code"},
                {"value": "Une personne capable de requêtes SQL ou scripts simples", "label": "SQL ou scripts simples possible"},
                {"value": "Équipe technique capable de maintenir une infrastructure data", "label": "Équipe technique data en interne"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "data_previous_attempts",
            "question_text": "Avez-vous déjà essayé de structurer votre reporting ou vos données ? Résultat ?",
            "hint": "Éviter de reproduire ce qui n'a pas fonctionné.",
            "type": "options",
            "options": [
                {"value": "Jamais essayé, c'est un premier projet", "label": "Premier projet — point de départ"},
                {"value": "Tableaux Excel ou Google Sheets mais trop manuels et chronophages", "label": "Excel/Sheets — trop manuel"},
                {"value": "Power BI ou Looker installé mais peu utilisé finalement", "label": "Outil BI mis en place mais abandonné"},
                {"value": "Consultant ou freelance engagé mais résultat décevant", "label": "Prestataire engagé — résultat insuffisant"},
                {"value": "Solution en place mais obsolète ou dépassée", "label": "Solution obsolète à refondre"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "data_volume",
            "question_text": "Quel est le volume de données que vous traitez ?",
            "hint": "Le volume influe sur le choix technologique et les coûts.",
            "type": "options",
            "options": [
                {"value": "Quelques centaines de lignes (fichiers simples)", "label": "Quelques centaines de lignes"},
                {"value": "Plusieurs milliers de lignes par mois", "label": "Milliers de lignes / mois"},
                {"value": "Centaines de milliers ou millions d'enregistrements", "label": "Centaines de milliers à millions"},
                {"value": "Je ne sais pas encore estimer le volume", "label": "Volume inconnu pour l'instant"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "data_success_metric",
            "question_text": "À quoi ressemble le succès pour vous dans 3 mois avec cette solution IA ?",
            "hint": "La définition du succès cadre les priorités du talent.",
            "type": "options",
            "options": [
                {"value": "Zéro rapport produit manuellement — tout est automatisé", "label": "0 rapport manuel — 100% automatisé"},
                {"value": "Un dashboard en temps réel utilisé par toute l'équipe", "label": "Dashboard live adopté par l'équipe"},
                {"value": "Des alertes automatiques sur les anomalies critiques", "label": "Alertes anomalies actives"},
                {"value": "Des prévisions fiables pour orienter nos décisions", "label": "Prévisions fiables opérationnelles"},
                {"value": "Moins de 30 minutes par semaine passées sur le reporting", "label": "< 30 min/semaine sur reporting"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce besoin data IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet data IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie", "hint": "Il prend le sujet et rend les livrables."},
                {"value": "collaboration_integree", "label": "Un talent intégré à mon équipe", "hint": "Il travaille avec nous au quotidien."},
                {"value": "mission_courte", "label": "Une mission courte et ciblée (1-4 sem.)", "hint": "Diagnostic ou livrable précis rapidement."},
                {"value": "mission_longue", "label": "Un accompagnement sur la durée (1-6 mois)", "hint": "Construction progressive et solide."},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 2 — Automatisation IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_automatisation": [
        {
            "question_id": "automate_priority_tasks",
            "question_text": "Quelles tâches voulez-vous que l'IA automatise en priorité ?",
            "hint": "Plus la tâche est répétitive et fréquente, plus le gain IA est immédiat.",
            "type": "options",
            "options": [
                {"value": "Saisie, traitement et validation de données", "label": "Saisie et traitement de données"},
                {"value": "Génération automatique de documents, devis ou rapports", "label": "Génération de documents / rapports"},
                {"value": "Relances clients, fournisseurs ou partenaires", "label": "Relances automatiques"},
                {"value": "Tri, catégorisation et réponse aux emails", "label": "Traitement des emails IA"},
                {"value": "Planification, coordination et notifications internes", "label": "Planification et coordination"},
                {"value": "Facturation, suivi des paiements et rapprochements", "label": "Facturation et suivi financier"},
                {"value": "Extraction et structuration d'informations depuis des documents", "label": "Extraction d'informations IA"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "automate_frequency",
            "question_text": "À quelle fréquence ces tâches sont-elles réalisées aujourd'hui ?",
            "hint": "La fréquence détermine le ROI de l'automatisation IA.",
            "type": "options",
            "options": [
                {"value": "Plusieurs fois par jour", "label": "Plusieurs fois par jour"},
                {"value": "Quotidien", "label": "Quotidien"},
                {"value": "Plusieurs fois par semaine", "label": "Plusieurs fois / semaine"},
                {"value": "Hebdomadaire", "label": "Hebdomadaire"},
                {"value": "Mensuel ou ponctuel", "label": "Mensuel / ponctuel"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "automate_current_tools",
            "question_text": "Quels outils ou systèmes sont impliqués dans ces tâches aujourd'hui ?",
            "hint": "L'IA s'intègre dans vos outils existants ou peut les remplacer.",
            "type": "options",
            "options": [
                {"value": "Excel ou Google Sheets", "label": "Excel / Google Sheets"},
                {"value": "Logiciel ERP ou CRM", "label": "ERP / CRM"},
                {"value": "Google Workspace ou Microsoft 365", "label": "Google / Microsoft 365"},
                {"value": "Tout est manuel, sans outil dédié", "label": "Tout manuel — pas d'outil"},
                {"value": "Déjà Make, Zapier ou n8n mais insuffisant", "label": "Déjà Make / Zapier / n8n"},
                {"value": "Logiciel métier spécifique à notre secteur", "label": "Logiciel métier spécifique"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "automate_team_time",
            "question_text": "Combien de personnes réalisent ces tâches et combien de temps y passent-elles ?",
            "hint": "Cela quantifie l'impact potentiel de l'automatisation.",
            "type": "options",
            "options": [
                {"value": "Moi seul — quelques heures par semaine", "label": "1 personne — quelques h/semaine"},
                {"value": "1 à 3 personnes — plus de 30 min par jour chacune", "label": "1-3 personnes — 30 min+ / jour"},
                {"value": "Une équipe entière — c'est leur activité principale", "label": "Équipe — activité principale"},
                {"value": "Plusieurs équipes touchées par ces tâches", "label": "Plusieurs équipes impactées"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "automate_previous_attempts",
            "question_text": "Avez-vous déjà essayé d'automatiser ces tâches ? Pourquoi ça n'a pas suffi ?",
            "hint": "Éviter de reproduire les erreurs passées.",
            "type": "options",
            "options": [
                {"value": "Jamais essayé — c'est un premier projet d'automatisation", "label": "Premier projet — partir de zéro"},
                {"value": "Macros Excel ou scripts simples mais fragiles", "label": "Macros / scripts — trop fragiles"},
                {"value": "Make ou Zapier configuré mais incomplet ou instable", "label": "Make / Zapier — incomplet"},
                {"value": "Prestataire engagé — solution abandonnée ou mal maintenue", "label": "Prestataire — résultat insuffisant"},
                {"value": "Outil interne développé mais dépassé", "label": "Outil interne — à refondre"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "automate_tech_level",
            "question_text": "Quel est le niveau technique de votre équipe pour maintenir des automatisations ?",
            "hint": "Calibre entre solution no-code clé en main et solution technique sur mesure.",
            "type": "options",
            "options": [
                {"value": "Aucune compétence technique — doit fonctionner seul après livraison", "label": "Non-technique — clé en main"},
                {"value": "À l'aise avec des outils no-code mais pas de code", "label": "No-code — pas de code"},
                {"value": "Capable de comprendre et modifier des scripts simples", "label": "Scripts simples — maintenance possible"},
                {"value": "Équipe technique qui peut maintenir une infrastructure complète", "label": "Équipe technique en interne"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "automate_constraints",
            "question_text": "Y a-t-il des contraintes particulières à respecter ?",
            "hint": "Les contraintes évitent des solutions inadaptées au contexte.",
            "type": "options",
            "options": [
                {"value": "Données sensibles — contraintes RGPD ou confidentialité", "label": "RGPD / données sensibles"},
                {"value": "Systèmes anciens ou fermés difficiles à connecter", "label": "Systèmes legacy / fermés"},
                {"value": "Budget limité — priorité aux solutions open-source ou abordables", "label": "Budget contraint"},
                {"value": "Délai très court — besoin d'une solution rapide à déployer", "label": "Délai très court"},
                {"value": "Aucune contrainte particulière", "label": "Pas de contrainte majeure"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "automate_success_metric",
            "question_text": "Quel serait le résultat concret qui prouverait que l'automatisation IA fonctionne ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Ces tâches se font seules sans intervention humaine", "label": "Zéro intervention humaine"},
                {"value": "Temps passé réduit de plus de 70%", "label": "Gain de temps > 70%"},
                {"value": "Zéro erreur de saisie ou de traitement", "label": "Zéro erreur"},
                {"value": "Un employé repositionné sur des tâches à valeur ajoutée", "label": "Équipe repositionnée sur tâches à valeur"},
                {"value": "Processus documenté et reproductible pour toute l'équipe", "label": "Processus documenté et scalable"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet d'automatisation IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet d'automatisation ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie", "hint": "Il prend le sujet et rend les livrables."},
                {"value": "collaboration_integree", "label": "Un talent intégré à mon équipe", "hint": "Il travaille avec nous au quotidien."},
                {"value": "mission_courte", "label": "Une mission courte et ciblée (1-4 sem.)", "hint": "Diagnostic ou livrable précis rapidement."},
                {"value": "mission_longue", "label": "Un accompagnement sur la durée (1-6 mois)", "hint": "Construction progressive et solide."},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 3 — Marketing & Contenu IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_marketing_content": [
        {
            "question_id": "marketing_ia_use_case",
            "question_text": "Que voulez-vous concrètement que l'IA fasse pour votre marketing ?",
            "hint": "L'IA peut agir à plusieurs niveaux — choisissez la priorité.",
            "type": "options",
            "options": [
                {"value": "Générer du contenu en volume (posts, articles, emails, scripts)", "label": "Génération de contenu en volume"},
                {"value": "Personnaliser les messages selon les segments clients", "label": "Personnalisation IA des messages"},
                {"value": "Automatiser les publications et campagnes marketing", "label": "Automatisation des campagnes"},
                {"value": "Analyser les performances et optimiser les contenus", "label": "Analyse et optimisation IA"},
                {"value": "Générer des visuels, bannières et supports IA", "label": "Visuels et supports IA"},
                {"value": "Créer et optimiser des séquences emails ou nurturing", "label": "Séquences email / nurturing IA"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "marketing_channels",
            "question_text": "Sur quels canaux publiez-vous et voulez-vous déployer cette solution IA ?",
            "hint": "Cela oriente vers les outils IA adaptés à chaque canal.",
            "type": "options",
            "options": [
                {"value": "LinkedIn (B2B prioritaire)", "label": "LinkedIn"},
                {"value": "Instagram et/ou Facebook", "label": "Instagram / Facebook"},
                {"value": "Email (newsletters, séquences, campagnes)", "label": "Email"},
                {"value": "Blog ou SEO (articles, pages web)", "label": "Blog / SEO"},
                {"value": "YouTube ou contenu vidéo", "label": "YouTube / vidéo"},
                {"value": "Plusieurs canaux à la fois", "label": "Multi-canaux simultanément"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "marketing_current_volume",
            "question_text": "À quelle fréquence produisez-vous du contenu marketing aujourd'hui ?",
            "hint": "Évalue le potentiel de gain de l'IA sur votre production.",
            "type": "options",
            "options": [
                {"value": "Rarement — moins d'une publication par semaine", "label": "Moins d'1 publication / semaine"},
                {"value": "1 à 3 publications par semaine", "label": "1 à 3 / semaine"},
                {"value": "Quotidien sur un ou plusieurs canaux", "label": "Quotidien"},
                {"value": "Campagnes ponctuelles (lancement produit, événements)", "label": "Campagnes ponctuelles"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "marketing_team",
            "question_text": "Qui produit ce contenu marketing aujourd'hui dans votre structure ?",
            "hint": "L'IA s'adapte selon que le contenu est produit par 1 personne ou une équipe.",
            "type": "options",
            "options": [
                {"value": "Moi seul en plus de mes autres missions", "label": "Moi seul — en plus du reste"},
                {"value": "Un chargé de marketing ou communication dédié", "label": "Un marketeur dédié"},
                {"value": "Une équipe marketing de 2 à 5 personnes", "label": "Équipe marketing 2-5 personnes"},
                {"value": "Une agence ou un freelance externe", "label": "Agence / freelance externe"},
                {"value": "Personne ne s'en occupe aujourd'hui — besoin de démarrer", "label": "Pas encore de production — démarrage"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "marketing_brand_constraints",
            "question_text": "Avez-vous une charte éditoriale, un positionnement ou un ton définis ?",
            "hint": "L'IA doit respecter votre identité de marque pour être utile.",
            "type": "options",
            "options": [
                {"value": "Charte éditoriale et guidelines précises à respecter", "label": "Charte éditoriale définie"},
                {"value": "Positionnement clair mais pas de document formel", "label": "Positionnement clair — pas formalisé"},
                {"value": "Ton et style approximatifs — à affiner avec l'IA", "label": "Ton approximatif — à préciser"},
                {"value": "Rien de défini — l'IA peut aider à créer l'identité", "label": "Rien défini — IA peut aider à créer"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "marketing_previous_ia",
            "question_text": "Avez-vous déjà utilisé des outils IA pour le marketing ? Résultat ?",
            "hint": "Évite de proposer ce qui n'a pas fonctionné.",
            "type": "options",
            "options": [
                {"value": "Jamais utilisé d'IA pour le marketing", "label": "Jamais — point de départ"},
                {"value": "ChatGPT ou Claude pour des textes ponctuels — pas systématisé", "label": "ChatGPT / Claude ponctuellement"},
                {"value": "Outils IA marketing (Jasper, Copy.ai...) — résultat décevant", "label": "Outils IA marketing — décevant"},
                {"value": "Quelques automatisations en place mais insuffisantes", "label": "Automatisations partielles — à compléter"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "marketing_main_blocker",
            "question_text": "Quel est le principal frein dans votre production marketing actuelle ?",
            "hint": "Identifier le vrai problème pour proposer la bonne solution IA.",
            "type": "options",
            "options": [
                {"value": "Manque de temps — je n'arrive pas à produire assez", "label": "Manque de temps"},
                {"value": "Manque d'idées ou de créativité régulière", "label": "Manque d'idées"},
                {"value": "Contenu produit mais peu d'engagement ou de résultats", "label": "Peu d'engagement / résultats"},
                {"value": "Budget insuffisant pour externaliser", "label": "Budget insuffisant"},
                {"value": "Incohérence dans le ton ou le positionnement", "label": "Incohérence de ton / positionnement"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "marketing_success_metric",
            "question_text": "Quel résultat concret attendez-vous dans 3 mois grâce à l'IA ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Publier 3x plus de contenu sans effort supplémentaire", "label": "3x plus de contenu — même effort"},
                {"value": "Augmenter l'engagement (likes, partages, clics) de 50%+", "label": "Engagement +50%"},
                {"value": "Générer des leads qualifiés grâce au contenu IA", "label": "Leads qualifiés via contenu"},
                {"value": "Un système de contenu qui tourne quasi seul", "label": "Système contenu autonome"},
                {"value": "Réduire le temps marketing à moins de 2h par semaine", "label": "< 2h / semaine sur le marketing"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet marketing IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet marketing IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui produit et livre en autonomie", "hint": "Il gère la stratégie et l'exécution."},
                {"value": "collaboration_integree", "label": "Un talent qui travaille avec mon équipe", "hint": "Collaboration et montée en compétence."},
                {"value": "mission_courte", "label": "Une mission courte et ciblée (1-4 sem.)", "hint": "Mise en place d'un système précis."},
                {"value": "mission_longue", "label": "Un accompagnement sur la durée (1-6 mois)", "hint": "Construction et optimisation continue."},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 4 — Sales & CRM IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_sales_crm": [
        {
            "question_id": "sales_ia_use_case",
            "question_text": "Que voulez-vous que l'IA fasse pour vos ventes ?",
            "hint": "L'IA peut intervenir à plusieurs étapes du cycle de vente.",
            "type": "options",
            "options": [
                {"value": "Scorer et qualifier automatiquement les leads entrants", "label": "Scoring et qualification IA des leads"},
                {"value": "Automatiser les relances et séquences de prospection", "label": "Relances et prospection automatisées"},
                {"value": "Enrichir et mettre à jour le CRM automatiquement", "label": "CRM enrichi et mis à jour par IA"},
                {"value": "Analyser le pipeline et prédire les conversions", "label": "Analyse pipeline et prédictions IA"},
                {"value": "Générer des emails, propositions ou devis personnalisés", "label": "Personnalisation des communications IA"},
                {"value": "Identifier les comptes à risque de churn", "label": "Détection churn et comptes à risque"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "sales_current_crm",
            "question_text": "Quel CRM ou outil de gestion commerciale utilisez-vous aujourd'hui ?",
            "hint": "L'IA doit s'intégrer dans votre écosystème existant.",
            "type": "options",
            "options": [
                {"value": "HubSpot", "label": "HubSpot"},
                {"value": "Salesforce", "label": "Salesforce"},
                {"value": "Pipedrive", "label": "Pipedrive"},
                {"value": "Notion ou Airtable comme CRM maison", "label": "Notion / Airtable maison"},
                {"value": "Excel ou Google Sheets comme suivi commercial", "label": "Excel / Sheets — pas de vrai CRM"},
                {"value": "Aucun outil structuré pour l'instant", "label": "Aucun outil — à construire"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "sales_lead_volume",
            "question_text": "Quel est votre volume de leads ou opportunités commerciales par mois ?",
            "hint": "Le volume détermine le ROI et la priorité des automatisations.",
            "type": "options",
            "options": [
                {"value": "Moins de 20 leads par mois", "label": "< 20 leads / mois"},
                {"value": "20 à 100 leads par mois", "label": "20 à 100 / mois"},
                {"value": "100 à 500 leads par mois", "label": "100 à 500 / mois"},
                {"value": "Plus de 500 leads par mois", "label": "500+ / mois"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "sales_team_size",
            "question_text": "Combien de personnes composent votre équipe commerciale ?",
            "hint": "La taille de l'équipe calibre la solution et son déploiement.",
            "type": "options",
            "options": [
                {"value": "Je suis seul à faire la vente", "label": "1 seul — moi-même"},
                {"value": "2 à 5 commerciaux", "label": "2 à 5 commerciaux"},
                {"value": "6 à 20 commerciaux", "label": "6 à 20 commerciaux"},
                {"value": "Plus de 20 commerciaux", "label": "20+ commerciaux"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "sales_biggest_pain",
            "question_text": "Quel est le principal problème dans votre processus commercial actuel ?",
            "hint": "Identifier le point de friction prioritaire.",
            "type": "options",
            "options": [
                {"value": "Trop de temps passé sur des tâches administratives et non la vente", "label": "Trop d'admin — pas assez de vente"},
                {"value": "Leads non qualifiés — trop de temps perdu sur les mauvais prospects", "label": "Leads non qualifiés"},
                {"value": "Relances mal faites ou oubliées — opportunités perdues", "label": "Relances oubliées / mal faites"},
                {"value": "Manque de visibilité sur le pipeline et les prévisions", "label": "Pipeline et prévisions peu visibles"},
                {"value": "CRM non rempli ou mal utilisé par l'équipe", "label": "CRM non rempli / sous-utilisé"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "sales_previous_attempts",
            "question_text": "Avez-vous déjà essayé d'utiliser l'IA dans votre processus commercial ?",
            "hint": "Évite de reproduire ce qui n'a pas fonctionné.",
            "type": "options",
            "options": [
                {"value": "Jamais — c'est un premier projet IA sales", "label": "Premier projet — partir de zéro"},
                {"value": "ChatGPT pour rédiger des emails ponctuellement", "label": "ChatGPT pour emails ponctuels"},
                {"value": "Outil IA CRM intégré (HubSpot AI...) mais peu exploité", "label": "IA CRM native — peu exploitée"},
                {"value": "Séquences automatisées mais résultats décevants", "label": "Séquences auto — résultats décevants"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "sales_tech_integration",
            "question_text": "Quelles autres données ou outils doivent être connectés à votre CRM ?",
            "hint": "Les connexions nécessaires orientent l'architecture technique.",
            "type": "options",
            "options": [
                {"value": "Email (Gmail, Outlook)", "label": "Email (Gmail / Outlook)"},
                {"value": "LinkedIn pour la prospection", "label": "LinkedIn"},
                {"value": "Site web (formulaires, tracking)", "label": "Site web et formulaires"},
                {"value": "Outil de facturation ou ERP", "label": "Facturation / ERP"},
                {"value": "Aucune connexion nécessaire pour l'instant", "label": "Pas d'intégration nécessaire"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "sales_success_metric",
            "question_text": "Quel serait le résultat concret qui prouverait que la solution IA sales fonctionne ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Taux de conversion amélioré de 20%+", "label": "Conversion +20%"},
                {"value": "CRM à jour automatiquement sans effort de l'équipe", "label": "CRM auto-alimenté"},
                {"value": "Temps admin commercial réduit de 50%+", "label": "Admin commercial -50%"},
                {"value": "Pipeline visible et prévisions fiables chaque semaine", "label": "Pipeline et prévisions fiables"},
                {"value": "Séquences de relance qui tournent seules", "label": "Relances autonomes"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet sales IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet sales IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie"},
                {"value": "collaboration_integree", "label": "Un talent intégré à mon équipe commerciale"},
                {"value": "mission_courte", "label": "Mission courte et ciblée (1-4 sem.)"},
                {"value": "mission_longue", "label": "Accompagnement sur la durée (1-6 mois)"},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 5 — Ops & Process IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_ops_process": [
        {
            "question_id": "ops_ia_use_case",
            "question_text": "Que voulez-vous que l'IA améliore dans vos opérations ?",
            "hint": "L'IA peut optimiser différents aspects de vos processus.",
            "type": "options",
            "options": [
                {"value": "Cartographier et optimiser les processus internes", "label": "Cartographie et optimisation des processus"},
                {"value": "Détecter automatiquement les anomalies et inefficacités", "label": "Détection d'anomalies opérationnelles"},
                {"value": "Automatiser la coordination entre équipes", "label": "Coordination inter-équipes automatisée"},
                {"value": "Optimiser la gestion des stocks ou la supply chain", "label": "Stocks et supply chain IA"},
                {"value": "Améliorer le suivi qualité et les contrôles", "label": "Qualité et contrôles IA"},
                {"value": "Planifier et prioriser automatiquement les ressources", "label": "Planification et priorisation IA"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "ops_current_process_state",
            "question_text": "Comment vos processus sont-ils documentés et suivis aujourd'hui ?",
            "hint": "L'IA peut documenter des processus inexistants ou optimiser des processus existants.",
            "type": "options",
            "options": [
                {"value": "Processus dans les têtes — rien de documenté", "label": "Dans les têtes — rien documenté"},
                {"value": "Procédures écrites mais rarement suivies", "label": "Procédures écrites — peu appliquées"},
                {"value": "Outils de gestion en place (Notion, Asana, Monday...)", "label": "Outils de gestion en place"},
                {"value": "ERP ou outil métier avec processus structurés", "label": "ERP / outil métier structuré"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "ops_team_size",
            "question_text": "Combien de personnes sont impliquées dans ces processus opérationnels ?",
            "hint": "Le nombre de personnes impactées mesure l'enjeu.",
            "type": "options",
            "options": [
                {"value": "Moi seul ou une petite équipe (< 5 personnes)", "label": "< 5 personnes"},
                {"value": "Une équipe de 5 à 20 personnes", "label": "5 à 20 personnes"},
                {"value": "Plusieurs équipes — 20 à 100 personnes impactées", "label": "20 à 100 personnes"},
                {"value": "Toute l'organisation — plus de 100 personnes", "label": "100+ personnes"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "ops_biggest_bottleneck",
            "question_text": "Quel est le goulet d'étranglement le plus coûteux dans vos opérations ?",
            "hint": "Identifie où l'IA apportera le plus de valeur.",
            "type": "options",
            "options": [
                {"value": "Trop de réunions de coordination improductives", "label": "Trop de réunions improductives"},
                {"value": "Information dispersée — personne ne sait qui fait quoi", "label": "Information dispersée"},
                {"value": "Délais trop longs entre demande et livraison", "label": "Délais trop longs"},
                {"value": "Erreurs répétitives coûteuses dans les processus", "label": "Erreurs répétitives coûteuses"},
                {"value": "Ressources mal allouées — surcharge sur certains, sous-charge sur d'autres", "label": "Ressources mal allouées"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "ops_tech_stack",
            "question_text": "Quels outils utilisez-vous pour gérer vos opérations aujourd'hui ?",
            "hint": "L'IA doit s'intégrer dans votre stack existante.",
            "type": "options",
            "options": [
                {"value": "Email et Excel uniquement", "label": "Email + Excel uniquement"},
                {"value": "Notion, Asana, Monday ou Trello", "label": "Notion / Asana / Monday / Trello"},
                {"value": "ERP ou logiciel métier (SAP, Odoo, NetSuite...)", "label": "ERP / logiciel métier"},
                {"value": "Outils no-code (Airtable, Make, n8n...)", "label": "No-code (Airtable, Make...)"},
                {"value": "Stack technique custom développée en interne", "label": "Stack technique interne"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "ops_previous_attempts",
            "question_text": "Avez-vous déjà tenté d'améliorer ces processus ? Pourquoi ça n'a pas suffi ?",
            "hint": "Évite de reproduire les erreurs passées.",
            "type": "options",
            "options": [
                {"value": "Jamais essayé — premier projet d'optimisation ops", "label": "Premier projet — partir de zéro"},
                {"value": "Formation ou workshop lean / process — peu d'effets durables", "label": "Formation lean / process — effets limités"},
                {"value": "Outil installé mais peu adopté par les équipes", "label": "Outil installé — peu adopté"},
                {"value": "Consultant externe — recommandations non implémentées", "label": "Consultant — recommandations non suivies"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "ops_industry_constraints",
            "question_text": "Y a-t-il des contraintes sectorielles ou réglementaires à respecter ?",
            "hint": "Les contraintes sectorielles limitent certaines solutions IA.",
            "type": "options",
            "options": [
                {"value": "RGPD et protection des données stricte", "label": "RGPD strict"},
                {"value": "Certifications qualité (ISO, etc.) à maintenir", "label": "Certifications qualité ISO"},
                {"value": "Secteur régulé (santé, finance, industrie...)", "label": "Secteur régulé"},
                {"value": "Aucune contrainte sectorielle particulière", "label": "Pas de contrainte sectorielle"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "ops_success_metric",
            "question_text": "Quel serait le résultat concret qui prouverait que l'optimisation ops IA a fonctionné ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Délais de livraison réduits de 30%+", "label": "Délais réduits de 30%+"},
                {"value": "Réunions de coordination divisées par 2", "label": "Réunions / 2"},
                {"value": "Zéro erreur sur les processus critiques", "label": "Zéro erreur processus critiques"},
                {"value": "Tableau de bord ops en temps réel pour toute l'équipe", "label": "Tableau de bord ops live"},
                {"value": "Processus documentés, standardisés et scalables", "label": "Processus documentés et scalables"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet ops IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet ops IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie"},
                {"value": "collaboration_integree", "label": "Un talent intégré aux équipes ops"},
                {"value": "mission_courte", "label": "Mission courte et ciblée (1-4 sem.)"},
                {"value": "mission_longue", "label": "Accompagnement sur la durée (1-6 mois)"},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 6 — RH & Talent IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_rh_talent": [
        {
            "question_id": "rh_ia_use_case",
            "question_text": "Que voulez-vous que l'IA fasse pour vos RH ?",
            "hint": "L'IA peut transformer plusieurs aspects de la gestion des talents.",
            "type": "options",
            "options": [
                {"value": "Automatiser le tri des CV et la présélection des candidats", "label": "Tri CV et présélection automatisés"},
                {"value": "Générer des fiches de poste et offres d'emploi optimisées", "label": "Fiches de poste et offres IA"},
                {"value": "Analyser les compétences et détecter les gaps dans les équipes", "label": "Analyse des compétences et gaps"},
                {"value": "Automatiser l'onboarding des nouveaux collaborateurs", "label": "Onboarding automatisé IA"},
                {"value": "Analyser l'engagement et prédire les risques de turnover", "label": "Engagement et prédiction turnover"},
                {"value": "Personnaliser les parcours de formation et montée en compétence", "label": "Parcours de formation personnalisés IA"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "rh_team_size",
            "question_text": "Quelle est la taille de votre effectif total ?",
            "hint": "La taille de l'organisation calibre la solution RH IA adaptée.",
            "type": "options",
            "options": [
                {"value": "Moins de 10 personnes", "label": "< 10 personnes"},
                {"value": "10 à 50 personnes", "label": "10 à 50 personnes"},
                {"value": "50 à 200 personnes", "label": "50 à 200 personnes"},
                {"value": "Plus de 200 personnes", "label": "200+ personnes"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "rh_recruitment_volume",
            "question_text": "Combien de recrutements effectuez-vous par an ?",
            "hint": "Le volume de recrutement détermine le ROI de l'IA RH.",
            "type": "options",
            "options": [
                {"value": "Moins de 5 recrutements par an", "label": "< 5 / an"},
                {"value": "5 à 20 recrutements par an", "label": "5 à 20 / an"},
                {"value": "20 à 100 recrutements par an", "label": "20 à 100 / an"},
                {"value": "Plus de 100 recrutements par an", "label": "100+ / an"},
                {"value": "Nous ne recrutons pas — autres besoins RH", "label": "Pas de recrutement — autre besoin RH"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "rh_current_tools",
            "question_text": "Quels outils RH utilisez-vous aujourd'hui ?",
            "hint": "L'IA doit s'intégrer dans votre écosystème RH existant.",
            "type": "options",
            "options": [
                {"value": "Aucun outil RH — processus manuels", "label": "Tout manuel — pas d'outil RH"},
                {"value": "ATS ou logiciel de recrutement (Workable, Lever, Greenhouse...)", "label": "ATS de recrutement"},
                {"value": "HRIS ou logiciel RH global (BambooHR, Factorial, Lucca...)", "label": "HRIS / logiciel RH global"},
                {"value": "LinkedIn Recruiter et email", "label": "LinkedIn Recruiter + email"},
                {"value": "Google Sheets ou Notion comme suivi RH", "label": "Sheets / Notion comme suivi RH"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "rh_biggest_pain",
            "question_text": "Quel est le principal problème RH que vous cherchez à résoudre ?",
            "hint": "Identifier le problème prioritaire pour cibler la solution IA.",
            "type": "options",
            "options": [
                {"value": "Trop de temps passé sur le tri et la gestion administrative du recrutement", "label": "Admin recrutement trop chronophage"},
                {"value": "Difficulté à trouver les bons profils — qualité des candidats insuffisante", "label": "Mauvaise qualité des candidats"},
                {"value": "Turnover élevé — on perd les talents trop vite", "label": "Turnover trop élevé"},
                {"value": "Manque de visibilité sur les compétences internes", "label": "Compétences internes peu visibles"},
                {"value": "Onboarding mal structuré — les nouvelles recrues ne s'intègrent pas bien", "label": "Onboarding mal structuré"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "rh_ia_maturity",
            "question_text": "Quel est le niveau de maturité IA de votre équipe RH ?",
            "hint": "Calibre le niveau d'accompagnement nécessaire.",
            "type": "options",
            "options": [
                {"value": "Aucune expérience IA — tout est à construire", "label": "Aucune expérience IA"},
                {"value": "Quelques outils IA testés (ChatGPT pour des offres...) sans systématisation", "label": "Quelques tests IA — pas systématisé"},
                {"value": "Des pratiques IA en cours mais besoin de structuration", "label": "Pratiques IA à structurer"},
                {"value": "Bonne maturité IA — besoin d'optimiser et scaler", "label": "Bonne maturité IA — à optimiser"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "rh_constraints",
            "question_text": "Y a-t-il des contraintes légales ou éthiques à respecter sur l'usage de l'IA en RH ?",
            "hint": "L'IA en RH est encadrée — certaines pratiques sont limitées réglementairement.",
            "type": "options",
            "options": [
                {"value": "RGPD strict sur les données candidats et collaborateurs", "label": "RGPD données RH"},
                {"value": "Biais algorithmiques — importance de la non-discrimination", "label": "Non-discrimination — biais IA à éviter"},
                {"value": "Comité social ou accord à respecter sur les outils RH", "label": "CSE / accord sur outils RH"},
                {"value": "Pas de contrainte particulière identifiée", "label": "Pas de contrainte identifiée"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "rh_success_metric",
            "question_text": "Quel résultat concret attendez-vous dans 3 mois grâce à l'IA RH ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Temps de recrutement divisé par 2", "label": "Temps de recrutement / 2"},
                {"value": "Qualité des profils sélectionnés nettement améliorée", "label": "Qualité des profils améliorée"},
                {"value": "Turnover réduit de manière mesurable", "label": "Turnover réduit"},
                {"value": "Onboarding structuré et automatisé pour tous", "label": "Onboarding standardisé"},
                {"value": "Carte des compétences internes à jour", "label": "Cartographie compétences à jour"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet RH IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet RH IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie"},
                {"value": "collaboration_integree", "label": "Un talent intégré à l'équipe RH"},
                {"value": "mission_courte", "label": "Mission courte et ciblée (1-4 sem.)"},
                {"value": "mission_longue", "label": "Accompagnement sur la durée (1-6 mois)"},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 7 — Finance & Pilotage IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_finance_pilotage": [
        {
            "question_id": "finance_ia_use_case",
            "question_text": "Que voulez-vous que l'IA fasse pour votre finance et pilotage ?",
            "hint": "L'IA peut transformer votre gestion financière à plusieurs niveaux.",
            "type": "options",
            "options": [
                {"value": "Automatiser les prévisions budgétaires et financières", "label": "Prévisions budgétaires automatisées"},
                {"value": "Détecter automatiquement les fraudes et anomalies financières", "label": "Détection fraudes et anomalies IA"},
                {"value": "Générer automatiquement les rapports financiers", "label": "Rapports financiers automatiques"},
                {"value": "Optimiser la trésorerie et prédire les flux de caisse", "label": "Optimisation trésorerie IA"},
                {"value": "Analyser la rentabilité par produit, client ou projet", "label": "Analyse rentabilité IA"},
                {"value": "Automatiser les rapprochements comptables et contrôles", "label": "Rapprochements et contrôles automatisés"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "finance_current_tools",
            "question_text": "Quels outils financiers et comptables utilisez-vous aujourd'hui ?",
            "hint": "L'IA doit s'intégrer dans votre écosystème financier existant.",
            "type": "options",
            "options": [
                {"value": "Excel ou Google Sheets pour tout le pilotage financier", "label": "Excel / Google Sheets"},
                {"value": "Logiciel comptable (Sage, Cegid, QuickBooks, FreshBooks...)", "label": "Logiciel comptable"},
                {"value": "ERP avec module financier (SAP, Odoo, NetSuite...)", "label": "ERP avec module finance"},
                {"value": "Power BI ou Tableau pour les tableaux de bord", "label": "Power BI / Tableau"},
                {"value": "Aucun outil structuré — tout est manuel", "label": "Tout manuel"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "finance_reporting_frequency",
            "question_text": "À quelle fréquence produisez-vous des rapports ou analyses financières ?",
            "hint": "La fréquence détermine le gain potentiel de l'automatisation.",
            "type": "options",
            "options": [
                {"value": "En temps réel ou quotidien (monitoring trésorerie)", "label": "Temps réel / quotidien"},
                {"value": "Hebdomadaire", "label": "Hebdomadaire"},
                {"value": "Mensuel (clôture mensuelle)", "label": "Mensuel"},
                {"value": "Trimestriel ou annuel", "label": "Trimestriel / annuel"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "finance_team",
            "question_text": "Qui gère la finance et le pilotage dans votre structure ?",
            "hint": "Calibre le niveau de solution nécessaire.",
            "type": "options",
            "options": [
                {"value": "Le fondateur ou dirigeant en direct", "label": "Fondateur / dirigeant"},
                {"value": "Un DAF ou responsable financier interne", "label": "DAF / responsable financier interne"},
                {"value": "Un expert-comptable ou cabinet externe", "label": "Expert-comptable / cabinet externe"},
                {"value": "Une équipe finance dédiée", "label": "Équipe finance dédiée"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "finance_biggest_pain",
            "question_text": "Quel est le principal problème dans votre pilotage financier actuel ?",
            "hint": "Identifier le problème prioritaire pour cibler la solution IA.",
            "type": "options",
            "options": [
                {"value": "Je manque de visibilité en temps réel sur ma trésorerie", "label": "Manque de visibilité trésorerie"},
                {"value": "Les rapports sont produits trop tard pour décider à temps", "label": "Rapports trop tardifs"},
                {"value": "Trop de temps passé sur des tâches comptables manuelles", "label": "Trop de temps sur tâches manuelles"},
                {"value": "Difficulté à faire des prévisions fiables", "label": "Prévisions peu fiables"},
                {"value": "Risque de fraude ou d'erreurs non détectées", "label": "Fraude / erreurs non détectées"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "finance_data_quality",
            "question_text": "Quelle est la qualité et la disponibilité de vos données financières ?",
            "hint": "La qualité des données conditionne directement la qualité de la solution IA.",
            "type": "options",
            "options": [
                {"value": "Données dispersées dans plusieurs fichiers non standardisés", "label": "Données dispersées — non standardisées"},
                {"value": "Données dans un outil mais difficiles à extraire ou exploiter", "label": "Données en outil — difficiles à exploiter"},
                {"value": "Données structurées et disponibles — besoin d'analyse IA", "label": "Données structurées disponibles"},
                {"value": "Données fiables et centralisées — besoin d'automatisation", "label": "Données centralisées et fiables"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "finance_compliance",
            "question_text": "Y a-t-il des exigences réglementaires ou d'audit spécifiques à respecter ?",
            "hint": "Les contraintes réglementaires limitent certaines approches IA.",
            "type": "options",
            "options": [
                {"value": "Normes comptables strictes (IFRS, PCG...)", "label": "Normes comptables IFRS / PCG"},
                {"value": "Audit externe régulier (CAC, commissaires aux comptes)", "label": "Audit externe régulier"},
                {"value": "Réglementation sectorielle (banque, assurance, santé...)", "label": "Réglementation sectorielle"},
                {"value": "Aucune contrainte particulière", "label": "Pas de contrainte réglementaire spécifique"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "finance_success_metric",
            "question_text": "Quel résultat concret attendez-vous dans 3 mois grâce à l'IA finance ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Rapports financiers automatiques sans intervention manuelle", "label": "Rapports financiers automatisés"},
                {"value": "Prévisions de trésorerie fiables à 3 mois", "label": "Prévisions trésorerie 3 mois"},
                {"value": "Alertes automatiques sur anomalies et dérapages", "label": "Alertes anomalies automatiques"},
                {"value": "Temps de clôture mensuelle divisé par 2", "label": "Clôture mensuelle / 2"},
                {"value": "Tableau de bord financier utilisé par la direction chaque semaine", "label": "Dashboard financier utilisé en CODIR"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet finance IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet finance IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie"},
                {"value": "collaboration_integree", "label": "Un talent intégré à l'équipe finance"},
                {"value": "mission_courte", "label": "Mission courte et ciblée (1-4 sem.)"},
                {"value": "mission_longue", "label": "Accompagnement sur la durée (1-6 mois)"},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 8 — Produit & Tech IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_produit_tech": [
        {
            "question_id": "produit_ia_use_case",
            "question_text": "Comment voulez-vous intégrer l'IA dans votre produit ou solution ?",
            "hint": "L'IA peut enrichir un produit à plusieurs niveaux.",
            "type": "options",
            "options": [
                {"value": "Intégrer un LLM ou agent IA dans mon application", "label": "LLM / agent IA dans l'application"},
                {"value": "Ajouter des fonctionnalités de recommandation personnalisée", "label": "Recommandations personnalisées IA"},
                {"value": "Construire un chatbot ou assistant IA dans mon produit", "label": "Chatbot / assistant IA dans le produit"},
                {"value": "Intégrer des modèles ML pour la prédiction ou classification", "label": "ML prédiction / classification"},
                {"value": "Construire un pipeline de traitement de données IA", "label": "Pipeline data / traitement IA"},
                {"value": "Construire une API IA utilisable par d'autres systèmes", "label": "API IA exposée"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "produit_current_state",
            "question_text": "Où en est votre produit ou solution aujourd'hui ?",
            "hint": "Le stade du produit détermine le type d'intervention nécessaire.",
            "type": "options",
            "options": [
                {"value": "Idée ou concept — pas encore de produit développé", "label": "Idée / concept — rien développé"},
                {"value": "MVP en cours de développement", "label": "MVP en développement"},
                {"value": "Produit en production — ajout de l'IA dans une V2", "label": "Produit live — ajout IA en V2"},
                {"value": "Produit IA existant à améliorer, optimiser ou scaler", "label": "Produit IA existant — à améliorer"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "produit_tech_stack",
            "question_text": "Quelle est votre stack technique actuelle ?",
            "hint": "L'IA doit être intégrée dans votre architecture existante.",
            "type": "options",
            "options": [
                {"value": "Python / FastAPI / Django", "label": "Python (FastAPI / Django)"},
                {"value": "Node.js / TypeScript", "label": "Node.js / TypeScript"},
                {"value": "Java ou .NET", "label": "Java / .NET"},
                {"value": "No-code ou low-code (Bubble, Webflow...)", "label": "No-code / Low-code"},
                {"value": "Pas encore de stack définie", "label": "Pas de stack définie encore"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "produit_team_tech",
            "question_text": "Quelle est la composition technique de votre équipe ?",
            "hint": "Calibre le niveau d'expertise IA nécessaire chez le talent.",
            "type": "options",
            "options": [
                {"value": "Non-technique — pas de développeur interne", "label": "Pas de développeur en interne"},
                {"value": "1 développeur full-stack mais pas expert IA", "label": "1 dev full-stack, pas expert IA"},
                {"value": "Équipe tech de 2-5 développeurs", "label": "Équipe tech 2-5 développeurs"},
                {"value": "Équipe tech senior avec des profils data / ML", "label": "Équipe tech senior avec profils ML"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "produit_ia_models",
            "question_text": "Avez-vous déjà identifié des modèles ou APIs IA à utiliser ?",
            "hint": "Cela précise le périmètre technique de la mission.",
            "type": "options",
            "options": [
                {"value": "OpenAI (GPT-4, GPT-4o...)", "label": "OpenAI (GPT-4o...)"},
                {"value": "Anthropic (Claude)", "label": "Anthropic (Claude)"},
                {"value": "Hugging Face ou modèles open-source", "label": "Hugging Face / open-source"},
                {"value": "Modèles IA spécialisés métier (vision, NLP, etc.)", "label": "Modèles spécialisés métier"},
                {"value": "Pas encore identifié — besoin de conseil", "label": "Pas encore identifié — besoin conseil"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "produit_scale_target",
            "question_text": "Quelle est la cible d'usage de votre produit IA ?",
            "hint": "Le volume d'utilisateurs influe sur l'architecture et les coûts.",
            "type": "options",
            "options": [
                {"value": "Usage interne uniquement (moins de 50 utilisateurs)", "label": "Usage interne < 50 utilisateurs"},
                {"value": "PME ou startups (100 à 1000 utilisateurs)", "label": "100 à 1 000 utilisateurs"},
                {"value": "Scale-up (1000 à 100 000 utilisateurs)", "label": "1 000 à 100 000 utilisateurs"},
                {"value": "Très grand volume — plus de 100 000 utilisateurs", "label": "100 000+ utilisateurs"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "produit_constraints",
            "question_text": "Y a-t-il des contraintes techniques ou réglementaires sur ce projet ?",
            "hint": "Les contraintes orientent vers les bonnes architectures et outils.",
            "type": "options",
            "options": [
                {"value": "RGPD — données ne doivent pas sortir de l'UE", "label": "RGPD — données en Europe uniquement"},
                {"value": "Coûts d'API IA à maîtriser (modèles on-premise ou open-source)", "label": "Maîtrise des coûts — open-source préféré"},
                {"value": "Latence très faible requise (temps réel)", "label": "Latence faible — temps réel requis"},
                {"value": "Interprétabilité des modèles IA requise (réglementation)", "label": "Interprétabilité IA requise"},
                {"value": "Aucune contrainte particulière", "label": "Pas de contrainte particulière"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "produit_success_metric",
            "question_text": "Quel résultat concret prouvera que l'intégration IA dans votre produit a réussi ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Fonctionnalité IA en production et utilisée par les clients", "label": "Feature IA live et adoptée"},
                {"value": "Temps de développement IA réduit grâce au profil recruté", "label": "Développement IA accéléré"},
                {"value": "Architecture IA scalable et maintenable en place", "label": "Architecture IA scalable"},
                {"value": "Métriques produit améliorées grâce à l'IA (rétention, engagement)", "label": "Métriques produit améliorées"},
                {"value": "POC ou prototype IA validé pour décision d'investissement", "label": "POC IA validé"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet produit IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet produit IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie"},
                {"value": "collaboration_integree", "label": "Un talent intégré à l'équipe produit / tech"},
                {"value": "mission_courte", "label": "Mission courte et ciblée (1-4 sem.)"},
                {"value": "mission_longue", "label": "Accompagnement sur la durée (1-6 mois)"},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 9 — Service Client IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_service_client": [
        {
            "question_id": "service_ia_use_case",
            "question_text": "Que voulez-vous que l'IA fasse pour votre service client ?",
            "hint": "L'IA peut transformer plusieurs aspects de la relation client.",
            "type": "options",
            "options": [
                {"value": "Chatbot IA pour répondre automatiquement aux demandes fréquentes", "label": "Chatbot IA 24/7"},
                {"value": "Analyser le sentiment et la satisfaction client en temps réel", "label": "Analyse sentiment IA"},
                {"value": "Trier et router automatiquement les tickets et demandes", "label": "Triage et routing intelligent IA"},
                {"value": "Suggérer des réponses aux agents humains pour accélérer le traitement", "label": "Suggestions de réponses aux agents"},
                {"value": "Résumer et catégoriser automatiquement les retours clients", "label": "Résumé et catégorisation IA"},
                {"value": "Détecter automatiquement les clients insatisfaits avant escalade", "label": "Détection insatisfaction avant escalade"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "service_volume",
            "question_text": "Quel est votre volume de demandes ou tickets clients par mois ?",
            "hint": "Le volume détermine le ROI et la priorité de la solution IA.",
            "type": "options",
            "options": [
                {"value": "Moins de 100 demandes par mois", "label": "< 100 / mois"},
                {"value": "100 à 1 000 demandes par mois", "label": "100 à 1 000 / mois"},
                {"value": "1 000 à 10 000 demandes par mois", "label": "1 000 à 10 000 / mois"},
                {"value": "Plus de 10 000 demandes par mois", "label": "10 000+ / mois"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "service_channels",
            "question_text": "Sur quels canaux recevez-vous les demandes clients ?",
            "hint": "La solution IA doit couvrir vos canaux prioritaires.",
            "type": "options",
            "options": [
                {"value": "Email", "label": "Email"},
                {"value": "Chat en direct sur le site web", "label": "Chat site web"},
                {"value": "WhatsApp ou messaging (SMS, Telegram...)", "label": "WhatsApp / messaging"},
                {"value": "Réseaux sociaux (Instagram DM, Twitter, LinkedIn)", "label": "Réseaux sociaux"},
                {"value": "Plateforme de tickets (Zendesk, Freshdesk, Intercom...)", "label": "Plateforme tickets (Zendesk...)"},
                {"value": "Téléphone / centre d'appels", "label": "Téléphone / call center"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "service_team_size",
            "question_text": "Combien d'agents ou de personnes gèrent le service client aujourd'hui ?",
            "hint": "La taille de l'équipe calibre la solution IA et son impact.",
            "type": "options",
            "options": [
                {"value": "1 seule personne (moi ou un collaborateur)", "label": "1 personne"},
                {"value": "2 à 5 agents", "label": "2 à 5 agents"},
                {"value": "6 à 20 agents", "label": "6 à 20 agents"},
                {"value": "Plus de 20 agents", "label": "20+ agents"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "service_current_tools",
            "question_text": "Quels outils utilisez-vous pour gérer le service client aujourd'hui ?",
            "hint": "L'IA doit s'intégrer dans votre écosystème existant.",
            "type": "options",
            "options": [
                {"value": "Email uniquement (Gmail, Outlook)", "label": "Email uniquement"},
                {"value": "Zendesk ou Freshdesk", "label": "Zendesk / Freshdesk"},
                {"value": "Intercom ou HubSpot Service", "label": "Intercom / HubSpot Service"},
                {"value": "Notion, Airtable ou outil interne", "label": "Outil interne maison"},
                {"value": "Pas d'outil structuré — tout est manuel", "label": "Tout manuel"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "service_biggest_pain",
            "question_text": "Quel est le principal problème dans votre service client actuel ?",
            "hint": "Identifier le problème prioritaire pour cibler la solution IA.",
            "type": "options",
            "options": [
                {"value": "Temps de réponse trop long — clients insatisfaits", "label": "Temps de réponse trop long"},
                {"value": "Volume trop élevé pour l'équipe — surcharge constante", "label": "Surcharge — volume trop élevé"},
                {"value": "Réponses incohérentes selon l'agent", "label": "Réponses incohérentes selon l'agent"},
                {"value": "Pas de visibilité sur les tendances et problèmes récurrents", "label": "Pas de visibilité sur tendances"},
                {"value": "Coût du service client trop élevé", "label": "Coût trop élevé"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "service_language_constraints",
            "question_text": "Dans quelles langues votre service client doit-il opérer ?",
            "hint": "Le multilinguisme oriente vers les solutions IA adaptées.",
            "type": "options",
            "options": [
                {"value": "Français uniquement", "label": "Français uniquement"},
                {"value": "Français et anglais", "label": "Français + anglais"},
                {"value": "Plusieurs langues européennes", "label": "Multi-langues européennes"},
                {"value": "Langues asiatiques ou autres", "label": "Asiatiques / autres langues"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "service_success_metric",
            "question_text": "Quel résultat concret attendez-vous dans 3 mois grâce à l'IA service client ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Temps de réponse moyen réduit de 50%+", "label": "Temps de réponse -50%"},
                {"value": "80%+ des demandes résolues automatiquement sans agent", "label": "80%+ résolution automatique"},
                {"value": "CSAT (satisfaction client) amélioré de manière mesurable", "label": "CSAT amélioré"},
                {"value": "Coût par ticket réduit de 40%+", "label": "Coût / ticket -40%"},
                {"value": "Aucune demande perdue ou sans réponse", "label": "Zéro demande sans réponse"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet service client IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet service client IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un talent qui livre en autonomie"},
                {"value": "collaboration_integree", "label": "Un talent intégré à l'équipe service client"},
                {"value": "mission_courte", "label": "Mission courte et ciblée (1-4 sem.)"},
                {"value": "mission_longue", "label": "Accompagnement sur la durée (1-6 mois)"},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],

    # ──────────────────────────────────────────────────────────────────────────
    # DOMAINE 10 — Stratégie & Décision IA
    # ──────────────────────────────────────────────────────────────────────────
    "ia_strategie": [
        {
            "question_id": "strategie_ia_use_case",
            "question_text": "Qu'attendez-vous concrètement de l'IA sur le plan stratégique ?",
            "hint": "L'IA peut enrichir la décision et la stratégie à plusieurs niveaux.",
            "type": "options",
            "options": [
                {"value": "Auditer notre maturité IA et définir une roadmap stratégique", "label": "Audit maturité IA + roadmap"},
                {"value": "Analyser la concurrence et les tendances du marché avec l'IA", "label": "Veille concurrentielle et marché IA"},
                {"value": "Construire un système d'aide à la décision IA pour la direction", "label": "Aide à la décision IA pour la direction"},
                {"value": "Former et acculturer les dirigeants et managers à l'IA", "label": "Formation et acculturation IA"},
                {"value": "Identifier les cas d'usage IA prioritaires dans notre organisation", "label": "Identification des cas d'usage IA prioritaires"},
                {"value": "Évaluer et sélectionner les bons outils IA pour notre contexte", "label": "Sélection et évaluation d'outils IA"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "strategie_ia_maturity",
            "question_text": "Où en est votre organisation avec l'IA aujourd'hui ?",
            "hint": "Le niveau de maturité calibre toute la recommandation stratégique.",
            "type": "options",
            "options": [
                {"value": "Aucune initiative IA à ce jour — point de départ", "label": "Aucune initiative IA"},
                {"value": "Quelques outils IA testés de façon isolée sans coordination", "label": "Tests isolés — non coordonnés"},
                {"value": "Des projets IA en cours dans différents services mais non alignés", "label": "Projets IA non alignés entre services"},
                {"value": "Une stratégie IA partielle en place — à consolider et étendre", "label": "Stratégie IA partielle — à consolider"},
                {"value": "Stratégie IA définie — besoin d'exécution et de suivi", "label": "Stratégie définie — besoin d'exécution"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "strategie_company_size",
            "question_text": "Quelle est la taille de votre organisation ?",
            "hint": "La taille oriente vers la bonne approche stratégique IA.",
            "type": "options",
            "options": [
                {"value": "TPE ou startup — moins de 20 personnes", "label": "TPE / startup < 20 personnes"},
                {"value": "PME — 20 à 200 personnes", "label": "PME 20-200 personnes"},
                {"value": "ETI — 200 à 2 000 personnes", "label": "ETI 200-2 000 personnes"},
                {"value": "Grande entreprise ou groupe — plus de 2 000 personnes", "label": "Grande entreprise / groupe 2 000+"},
            ],
            "phase": "besoin",
            "is_last": False,
        },
        {
            "question_id": "strategie_decision_maker",
            "question_text": "Qui pilote cette initiative IA dans votre organisation ?",
            "hint": "Identifie le niveau de sponsorship et les décisionnaires.",
            "type": "options",
            "options": [
                {"value": "Le CEO / fondateur directement", "label": "CEO / fondateur"},
                {"value": "Un CDO, CTO ou directeur de la transformation", "label": "CDO / CTO / Directeur transformation"},
                {"value": "Un responsable innovation ou IA dédié", "label": "Responsable innovation / IA"},
                {"value": "Un chef de projet ou manager opérationnel", "label": "Chef de projet / manager opérationnel"},
                {"value": "Pas encore de sponsor identifié — à définir", "label": "Pas de sponsor identifié"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "strategie_blocking_point",
            "question_text": "Quel est le principal frein à votre transformation IA aujourd'hui ?",
            "hint": "Identifier les obstacles permet de proposer la bonne approche.",
            "type": "options",
            "options": [
                {"value": "Manque de vision claire sur où commencer", "label": "Manque de vision — où commencer ?"},
                {"value": "Résistance interne au changement", "label": "Résistance interne au changement"},
                {"value": "Manque de compétences IA dans l'organisation", "label": "Manque de compétences IA internes"},
                {"value": "Budget et ressources insuffisants", "label": "Budget et ressources insuffisants"},
                {"value": "Données insuffisantes ou de mauvaise qualité", "label": "Données insuffisantes / mauvaise qualité"},
                {"value": "Risques réglementaires ou éthiques perçus", "label": "Risques réglementaires / éthiques"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "strategie_budget",
            "question_text": "Quel est l'ordre de grandeur du budget alloué à cette initiative stratégique IA ?",
            "hint": "Le budget calibre l'ambition et le profil du talent stratégique.",
            "type": "options",
            "options": [
                {"value": "Moins de 5 000€", "label": "< 5 000€"},
                {"value": "5 000€ à 20 000€", "label": "5 000€ à 20 000€"},
                {"value": "20 000€ à 100 000€", "label": "20 000€ à 100 000€"},
                {"value": "Plus de 100 000€", "label": "100 000€+"},
                {"value": "Budget à définir selon les recommandations", "label": "Budget à définir"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "strategie_expected_decision",
            "question_text": "Quelle décision concrète cette mission IA doit-elle vous aider à prendre ?",
            "hint": "La décision attendue oriente la forme et le contenu de la mission.",
            "type": "options",
            "options": [
                {"value": "Valider ou non un investissement IA significatif", "label": "Go / No-go investissement IA"},
                {"value": "Choisir entre plusieurs options ou prestataires IA", "label": "Choisir entre options IA"},
                {"value": "Convaincre la direction ou le board d'investir dans l'IA", "label": "Convaincre direction / board"},
                {"value": "Prioriser les cas d'usage IA sur les 12 prochains mois", "label": "Prioriser les cas d'usage IA 12 mois"},
                {"value": "Structurer une équipe ou un centre d'excellence IA interne", "label": "Structurer équipe / CoE IA"},
            ],
            "phase": "contexte",
            "is_last": False,
        },
        {
            "question_id": "strategie_success_metric",
            "question_text": "Quel résultat concret attendez-vous à l'issue de cette mission stratégique IA ?",
            "hint": "Définit le critère de succès pour orienter le talent.",
            "type": "options",
            "options": [
                {"value": "Une roadmap IA actionnable validée par la direction", "label": "Roadmap IA validée"},
                {"value": "Un diagnostic clair de la maturité IA avec les priorités", "label": "Diagnostic maturité + priorités"},
                {"value": "La direction convaincue et les budgets alloués", "label": "Direction convaincue + budgets"},
                {"value": "Les équipes formées et les premiers cas d'usage lancés", "label": "Équipes formées + cas d'usage lancés"},
                {"value": "Un POC IA validé pour guider la stratégie", "label": "POC IA validé"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce projet stratégique IA ?",
            "hint": "L'urgence calibre le profil et la disponibilité du talent.",
            "type": "options",
            "options": [
                {"value": "Exploration — pas de deadline précise", "label": "Exploration, pas d'urgence"},
                {"value": "sous_6_mois", "label": "À traiter dans les 6 prochains mois"},
                {"value": "sous_3_mois", "label": "Priorité forte ce trimestre"},
                {"value": "immédiat", "label": "Très urgent, besoin immédiat"},
            ],
            "phase": "validation",
            "is_last": False,
        },
        {
            "question_id": "treatment_preference",
            "question_text": "Comment préférez-vous être accompagné sur ce projet stratégique IA ?",
            "hint": "Votre préférence oriente la recommandation du profil talent.",
            "type": "options",
            "options": [
                {"value": "execution_autonome", "label": "Un consultant qui livre un rapport autonome"},
                {"value": "collaboration_integree", "label": "Un talent intégré qui travaille avec la direction"},
                {"value": "mission_courte", "label": "Mission courte et ciblée (1-4 sem.)"},
                {"value": "mission_longue", "label": "Accompagnement sur la durée (1-6 mois)"},
            ],
            "phase": "validation",
            "is_last": False,
        },
    ],
}

async def generate_next_enterprise_question(answers: list[dict[str, Any]]) -> dict[str, Any]:
    """Génère la prochaine question du parcours entreprise.

    Logique :
      Q1 : company_name (static)
      Q2 : primary_goal (static)
      Q3-Q12 : arbre statique du domaine (10 questions par domaine)
      Q13+   : IA continue SANS LIMITE jusqu'à avoir compris le besoin à 100 %.
               Elle pose des questions seulement si elle a encore besoin d'informations.
               Elle signale is_last=True uniquement quand elle est totalement confiante.
    """
    question_count = len(answers)
    primary_goal = _extract_primary_goal(answers)

    # Questions 3 à 12 — arbre statique par domaine (indices 0 à 9)
    if question_count >= 2:
        tree = _STATIC_TREES.get(primary_goal, [])
        tree_idx = question_count - 2  # Q3 → idx 0, Q4 → idx 1, … Q12 → idx 9
        if tree_idx < len(tree):
            q = dict(tree[tree_idx])
            # Dernière question du statique → pas encore is_last, l'IA prend le relais
            q["is_last"] = False
            return q

    # Question 13+ — IA sans limite, elle décide quand elle a compris
    goal_label = _GOAL_LABELS.get(primary_goal, primary_goal)
    context_lines = [
        f"- {a.get('question_text', a.get('question_id', ''))}: {a.get('answer', '')}"
        for a in answers
    ]
    context = "\n".join(context_lines)

    prompt = f"""Tu es expert senior en qualification de besoins IA d'entreprise pour KORYXA, une plateforme qui connecte les entreprises avec des talents IA spécialisés.

L'entreprise veut : {goal_label}

Toutes les réponses données jusqu'ici :
{context}

TON RÔLE :
Analyser si tu as une compréhension COMPLÈTE et SUFFISANTE pour recommander le bon profil IA.
Tu dois avoir une réponse claire sur :
1. Le cas d'usage IA exact et précis
2. Le contexte technique et organisationnel (stack, équipe, maturité)
3. Les contraintes spécifiques (RGPD, budget, délai, intégrations)
4. La définition concrète du succès attendu
5. L'urgence et le mode d'accompagnement préféré

RÈGLE ABSOLUE :
- Si tu as encore des zones d'ombre importantes → génère UNE question de creusement précise et ciblée sur le point manquant le plus critique.
- Si et seulement si tu as une compréhension COMPLÈTE sur les 5 axes → retourne is_last=true avec une question vide ou un simple mot de confirmation.
- Chaque question doit creuser ce que tu ne sais pas encore, pas répéter ce qui a déjà été couvert.
- Ne pose jamais deux fois la même question ou une question similaire.
- Priorise toujours la question qui manque le plus pour qualifier correctement le besoin.
- 4 à 6 options maximum, très spécifiques au contexte de cette entreprise.

Réponds UNIQUEMENT en JSON valide :
{{
  "question_id": "identifiant_snake_case_unique",
  "question_text": "Question précise en français ?",
  "hint": "Pourquoi cette question est critique pour qualifier le besoin (1 phrase)",
  "type": "options",
  "options": [
    {{"value": "valeur_courte", "label": "Label affiché", "hint": "Description optionnelle"}}
  ],
  "phase": "contexte",
  "is_last": false
}}

Si tu as une compréhension complète :
{{
  "question_id": "qualification_complete",
  "question_text": "",
  "hint": "",
  "type": "options",
  "options": [],
  "phase": "validation",
  "is_last": true
}}""".strip()

    result = await generate_structured_json(prompt)

    if result and result.get("is_last") is True:
        return {
            "question_id": "done",
            "question_text": "",
            "type": "options",
            "options": [],
            "phase": "validation",
            "is_last": True,
        }

    if result and result.get("question_text"):
        result["is_last"] = False
        result.setdefault("phase", "contexte")
        return result

    # Fallback minimal si l'IA échoue : on termine proprement
    return {
        "question_id": "done",
        "question_text": "",
        "type": "options",
        "options": [],
        "phase": "validation",
        "is_last": True,
    }

def _fallback_next_enterprise_question(question_count: int, answers: list[dict[str, Any]]) -> dict[str, Any]:
    primary_goal = ""
    for a in answers:
        if a.get("question_id") == "primary_goal":
            primary_goal = a.get("answer", "").lower()
            break

    phase = "besoin" if question_count < 3 else "contexte" if question_count < 6 else "validation"

    fallbacks: list[dict[str, Any]] = [
        {
            "question_id": "specific_tasks",
            "question_text": "Quelles tâches ou processus souhaitez-vous améliorer en premier ?",
            "hint": "Précisez les actions concrètes à fort impact.",
            "type": "options",
            "options": [
                {"value": "Reporting et tableaux de bord", "label": "Reporting et tableaux de bord"},
                {"value": "Gestion et traitement des données", "label": "Gestion des données"},
                {"value": "Communication et marketing", "label": "Communication et marketing"},
                {"value": "Suivi commercial et CRM", "label": "Suivi commercial"},
                {"value": "Coordination d'équipe", "label": "Coordination d'équipe"},
                {"value": "Autre processus clé", "label": "Autre"},
            ],
            "phase": phase,
            "is_last": False,
        },
        {
            "question_id": "current_tools",
            "question_text": "Quels outils utilisez-vous actuellement pour ces tâches ?",
            "hint": "Cela permet de recommander des solutions compatibles.",
            "type": "options",
            "options": [
                {"value": "Excel ou Google Sheets", "label": "Excel / Google Sheets"},
                {"value": "Notion ou Airtable", "label": "Notion / Airtable"},
                {"value": "CRM (HubSpot, Salesforce...)", "label": "CRM (HubSpot, Salesforce…)"},
                {"value": "Outils internes développés", "label": "Outils internes"},
                {"value": "Aucun outil structuré", "label": "Aucun outil structuré"},
            ],
            "phase": phase,
            "is_last": False,
        },
        {
            "question_id": "team_context",
            "question_text": "Dans quel cadre travaillez-vous ?",
            "hint": "Le contexte d'équipe change la recommandation.",
            "type": "options",
            "options": [
                {"value": "Je travaille seul", "label": "Je travaille seul"},
                {"value": "Petite équipe (2-10 personnes)", "label": "Petite équipe (2-10 personnes)"},
                {"value": "PME ou organisation structurée", "label": "PME / Organisation structurée"},
                {"value": "ONG ou association", "label": "ONG / Association"},
                {"value": "Grande structure ou institution", "label": "Grande structure"},
            ],
            "phase": phase,
            "is_last": False,
        },
        {
            "question_id": "urgency",
            "question_text": "Quel est le niveau d'urgence de ce besoin ?",
            "hint": "L'urgence calibre la cadence d'exécution recommandée.",
            "type": "options",
            "options": [
                {"value": "Exploration, pas d'urgence", "label": "Exploration, pas d'urgence"},
                {"value": "À traiter dans les prochains mois", "label": "Dans les prochains mois"},
                {"value": "Priorité forte ce trimestre", "label": "Priorité forte ce trimestre"},
                {"value": "Très urgent, besoin immédiat", "label": "Très urgent"},
            ],
            "phase": phase,
            "is_last": False,
        },
        {
            "question_id": "budget_range",
            "question_text": "Quel est votre budget disponible pour ce projet ?",
            "hint": "Une estimation permet de calibrer la recommandation.",
            "type": "options",
            "options": [
                {"value": "Moins de 500€", "label": "Moins de 500€"},
                {"value": "500€ à 2 000€", "label": "500€ à 2 000€"},
                {"value": "2 000€ à 10 000€", "label": "2 000€ à 10 000€"},
                {"value": "Plus de 10 000€", "label": "Plus de 10 000€"},
                {"value": "Budget non défini", "label": "Pas encore défini"},
            ],
            "phase": "validation",
            "is_last": question_count >= 6,
        },
    ]

    idx = min(max(question_count - 2, 0), len(fallbacks) - 1)
    q = dict(fallbacks[idx])
    q["phase"] = phase
    return q


def adaptive_answers_to_need_payload(adaptive_answers: list[dict[str, Any]]) -> dict[str, Any]:
    """Convert adaptive Q&A list into the standard EnterpriseNeedCreatePayload dict."""
    company_name = ""
    primary_goal = ""
    extra_context: list[str] = []

    field_map: dict[str, str] = {
        "need_type": "", "specific_tasks": "",
        "expected_result": "", "resultat_attendu": "",
        "urgency": "", "urgence": "", "delai": "",
        "team_context": "", "team_size": "", "equipe": "",
        "treatment_preference": "", "traitement": "", "accompagnement": "",
        "support_preference": "", "suivi": "",
        "budget_range": "",
    }

    key_to_field: dict[str, str] = {
        "need_type": "need_type", "specific_tasks": "need_type",
        "expected_result": "expected_result", "resultat_attendu": "expected_result",
        "urgency": "urgency", "urgence": "urgency", "delai": "urgency",
        "team_context": "team_context", "team_size": "team_context", "equipe": "team_context",
        "treatment_preference": "treatment_preference", "traitement": "treatment_preference",
        "accompagnement": "treatment_preference",
        "support_preference": "support_preference", "suivi": "support_preference",
    }

    for a in adaptive_answers:
        qid = a.get("question_id", "")
        qtext = a.get("question_text", "")
        answer = _normalized(a.get("answer", ""))
        if not answer:
            continue

        if qid == "company_name":
            company_name = answer
        elif qid == "primary_goal":
            primary_goal = answer
        elif qid in key_to_field:
            target = key_to_field[qid]
            if not field_map.get(target):
                field_map[target] = answer
            extra_context.append(f"{qtext}: {answer}")
        else:
            extra_context.append(f"{qtext}: {answer}")

    return {
        "company_name": company_name or "Non précisé",
        "primary_goal": primary_goal or "Non précisé",
        "need_type": field_map.get("need_type") or primary_goal or "Non précisé",
        "expected_result": field_map.get("expected_result") or "Résultat à clarifier",
        "urgency": field_map.get("urgency") or "À traiter bientôt",
        "treatment_preference": field_map.get("treatment_preference") or "Je veux d'abord une recommandation",
        "team_context": field_map.get("team_context") or "Non précisé",
        "support_preference": field_map.get("support_preference") or "Un cadrage rapide",
        "short_brief": " | ".join(extra_context) if extra_context else None,
    }
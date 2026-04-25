# ─── KORYXA Shared Taxonomy — 100% IA ────────────────────────────────────────
# KORYXA règle uniquement les besoins IA des entreprises.
# Tous les domaines, types de mission et modes de collab sont ancrés dans l'IA.

from typing import TypedDict


class TaxonomyItem(TypedDict):
    id: str
    label: str


# ─── Référentiel 1 : Domaines d'application IA ───────────────────────────────

DOMAINS: list[TaxonomyItem] = [
    {"id": "ia_data_reporting",    "label": "Data & Reporting IA"},
    {"id": "ia_automatisation",    "label": "Automatisation IA"},
    {"id": "ia_marketing_content", "label": "Marketing & Contenu IA"},
    {"id": "ia_sales_crm",         "label": "Sales & CRM IA"},
    {"id": "ia_ops_process",       "label": "Ops & Process IA"},
    {"id": "ia_rh_talent",         "label": "RH & Talent IA"},
    {"id": "ia_finance_pilotage",  "label": "Finance & Pilotage IA"},
    {"id": "ia_produit_tech",      "label": "Produit & Tech IA"},
    {"id": "ia_service_client",    "label": "Service Client IA"},
    {"id": "ia_strategie",         "label": "Stratégie & Décision IA"},
]

# ─── Référentiel 2 : Types d'intervention IA ─────────────────────────────────

MISSION_TYPES: list[TaxonomyItem] = [
    {"id": "automatisation",         "label": "Automatisation IA"},
    {"id": "analyse_reporting",      "label": "Analyse & Reporting IA"},
    {"id": "llm_prompting",          "label": "LLM & Prompting"},
    {"id": "ml_prediction",          "label": "ML & Prédiction"},
    {"id": "ia_marketing",           "label": "IA Marketing & Contenu"},
    {"id": "ia_produit",             "label": "IA dans un produit"},
    {"id": "formation_ia",           "label": "Formation & Montée en IA"},
    {"id": "audit_strategie_ia",     "label": "Audit & Stratégie IA"},
    {"id": "ia_ops",                 "label": "IA Ops & Infrastructure"},
]

# ─── Référentiel 3 : Modes de collaboration ──────────────────────────────────

COLLAB_MODES: list[TaxonomyItem] = [
    {"id": "mission_courte",         "label": "Mission courte (1-4 semaines)"},
    {"id": "mission_longue",         "label": "Mission longue (1-6 mois)"},
    {"id": "retainer",               "label": "Récurrent / Retainer"},
    {"id": "remote",                 "label": "100% Remote"},
    {"id": "presentiel",             "label": "Présentiel possible"},
    {"id": "execution_autonome",     "label": "Exécution autonome"},
    {"id": "collaboration_integree", "label": "Collaboration avec l'équipe"},
]

# ─── Index ────────────────────────────────────────────────────────────────────

DOMAIN_IDS: set[str] = {d["id"] for d in DOMAINS}
MISSION_TYPE_IDS: set[str] = {m["id"] for m in MISSION_TYPES}
COLLAB_MODE_IDS: set[str] = {c["id"] for c in COLLAB_MODES}

DOMAIN_BY_ID: dict[str, TaxonomyItem] = {d["id"]: d for d in DOMAINS}
MISSION_TYPE_BY_ID: dict[str, TaxonomyItem] = {m["id"]: m for m in MISSION_TYPES}
COLLAB_MODE_BY_ID: dict[str, TaxonomyItem] = {c["id"]: c for c in COLLAB_MODES}

# ─── Compatibilités pour le matching ─────────────────────────────────────────
# Domaine entreprise ↔ type d'intervention talent

DOMAIN_TO_MISSION_COMPAT: dict[str, list[str]] = {
    "ia_data_reporting":    ["analyse_reporting", "ml_prediction", "automatisation"],
    "ia_automatisation":    ["automatisation", "llm_prompting", "ia_ops"],
    "ia_marketing_content": ["ia_marketing", "llm_prompting", "automatisation"],
    "ia_sales_crm":         ["automatisation", "llm_prompting", "ia_marketing"],
    "ia_ops_process":       ["automatisation", "ia_ops", "analyse_reporting"],
    "ia_rh_talent":         ["llm_prompting", "automatisation", "audit_strategie_ia"],
    "ia_finance_pilotage":  ["analyse_reporting", "ml_prediction", "automatisation"],
    "ia_produit_tech":      ["ia_produit", "llm_prompting", "ia_ops"],
    "ia_service_client":    ["llm_prompting", "automatisation", "ia_produit"],
    "ia_strategie":         ["audit_strategie_ia", "analyse_reporting", "formation_ia"],
}

# Domaine talent ↔ domaines compatibles entreprise
DOMAIN_COMPAT: dict[str, list[str]] = {
    "ia_data_reporting":    ["ia_finance_pilotage", "ia_ops_process", "ia_strategie"],
    "ia_automatisation":    ["ia_ops_process", "ia_produit_tech", "ia_sales_crm"],
    "ia_marketing_content": ["ia_sales_crm", "ia_service_client"],
    "ia_sales_crm":         ["ia_marketing_content", "ia_service_client"],
    "ia_ops_process":       ["ia_automatisation", "ia_finance_pilotage"],
    "ia_rh_talent":         ["ia_strategie", "ia_ops_process"],
    "ia_finance_pilotage":  ["ia_data_reporting", "ia_strategie"],
    "ia_produit_tech":      ["ia_automatisation", "ia_service_client"],
    "ia_service_client":    ["ia_sales_crm", "ia_marketing_content"],
    "ia_strategie":         ["ia_data_reporting", "ia_rh_talent", "ia_finance_pilotage"],
}

MISSION_TYPE_COMPAT: dict[str, list[str]] = {
    "automatisation":     ["ia_ops", "llm_prompting", "analyse_reporting"],
    "analyse_reporting":  ["ml_prediction", "automatisation", "audit_strategie_ia"],
    "llm_prompting":      ["ia_produit", "automatisation", "ia_marketing"],
    "ml_prediction":      ["analyse_reporting", "ia_ops", "audit_strategie_ia"],
    "ia_marketing":       ["llm_prompting", "automatisation"],
    "ia_produit":         ["llm_prompting", "ia_ops", "automatisation"],
    "formation_ia":       ["audit_strategie_ia", "llm_prompting"],
    "audit_strategie_ia": ["analyse_reporting", "formation_ia"],
    "ia_ops":             ["automatisation", "ia_produit", "ml_prediction"],
}

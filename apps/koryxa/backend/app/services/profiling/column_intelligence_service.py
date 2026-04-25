"""
column_intelligence_service.py

Construit le dictionnaire intelligent de colonnes pour l'analyse de donnees :
- rôle supposé de chaque colonne (mesure, dimension, identifiant, date, ratio, flag, texte_libre, label)
- utilité analytique estimée (haute / moyenne / faible)
- exemples de valeurs plus exploitables
- lien avec les groupes de redondance détectés
"""
from __future__ import annotations

from typing import Any


# ---------------------------------------------------------------------------
# Rôles possibles
# ---------------------------------------------------------------------------
ROLE_MESURE = "mesure"
ROLE_DIMENSION = "dimension"
ROLE_IDENTIFIANT = "identifiant"
ROLE_DATE = "date"
ROLE_RATIO = "ratio"
ROLE_FLAG = "indicateur_binaire"
ROLE_TEXTE_LIBRE = "texte_libre"
ROLE_LABEL = "label"
ROLE_CONSTANTE = "constante"
ROLE_INCONNU = "inconnu"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _redundant_with(column_name: str, redundancy_summary: dict[str, Any]) -> list[str]:
    partners: list[str] = []
    for pair in (redundancy_summary.get("numeric_pairs") or []):
        if pair.get("col_a") == column_name:
            partners.append(str(pair["col_b"]))
        elif pair.get("col_b") == column_name:
            partners.append(str(pair["col_a"]))
    for pair in (redundancy_summary.get("categorical_pairs") or []):
        if pair.get("col_a") == column_name:
            partners.append(str(pair["col_b"]))
        elif pair.get("col_b") == column_name:
            partners.append(str(pair["col_a"]))
    return partners


def _assign_role(
    *,
    column_name: str,
    duckdb_type: str,
    null_rate: float,
    distinct_non_null: int,
    row_count: int,
    is_id: bool,
    is_date: bool,
    is_numeric: bool,
    is_categorical: bool,
    is_constant: bool,
    is_candidate_key: bool,
    is_partial_key: bool,
    numeric_stats: dict[str, Any] | None,
) -> tuple[str, str]:
    """Retourne (role, raison)."""
    if is_constant:
        return ROLE_CONSTANTE, "Valeur unique dans toute la colonne — aucun apport analytique."

    if is_id or is_candidate_key or is_partial_key:
        reason = "Identifiant détecté"
        if is_candidate_key:
            reason += " par unicité complète"
        elif is_partial_key:
            reason += " par unicité partielle"
        else:
            reason += " par nom"
        return ROLE_IDENTIFIANT, reason + "."

    if is_date:
        return ROLE_DATE, "Dimension temporelle exploitable pour des analyses de tendance."

    if is_numeric:
        if numeric_stats:
            min_v = numeric_stats.get("min")
            max_v = numeric_stats.get("max")
            if min_v is not None and max_v is not None:
                if 0.0 <= float(min_v) <= 1.0 and 0.0 <= float(max_v) <= 1.0:
                    return ROLE_RATIO, "Valeurs entre 0 et 1 — probable taux ou proportion."
        if distinct_non_null == 2:
            return ROLE_FLAG, "Deux valeurs distinctes — probable indicateur binaire ou booléen."
        return ROLE_MESURE, "Colonne numérique continue — mesure quantitative principale."

    if is_categorical:
        non_null_count = max(1, row_count - int(null_rate * row_count))
        if distinct_non_null <= 2:
            return ROLE_FLAG, "Deux modalités distinctes — indicateur catégoriel binaire."
        if distinct_non_null <= 25:
            return ROLE_DIMENSION, "Faible cardinalité — axe de segmentation exploitable."
        if distinct_non_null > max(100, non_null_count * 0.5):
            return ROLE_TEXTE_LIBRE, "Haute cardinalité — probable champ texte libre ou identifiant non structuré."
        return ROLE_LABEL, "Cardinalité modérée — libellé descriptif ou catégorie étendue."

    return ROLE_INCONNU, "Type ou structure non reconnu."


def _estimate_utility(
    *,
    role: str,
    null_rate: float,
    is_constant: bool,
    is_quasi_empty: bool,
    is_redundant: bool,
) -> tuple[str, str]:
    """Retourne (utilite, raison)."""
    if is_constant or is_quasi_empty:
        return "faible", "Colonne constante ou quasi vide — peu d'apport analytique."
    if role == ROLE_CONSTANTE:
        return "faible", "Aucune variance — inutile pour l'analyse."
    if is_redundant:
        if role in (ROLE_MESURE, ROLE_DIMENSION, ROLE_DATE):
            return "moyenne", "Redondante avec une autre colonne — à conserver ou dédoublonner."
        return "faible", "Redondante et rôle secondaire — candidate à l'exclusion."
    if role == ROLE_MESURE:
        if null_rate < 0.1:
            return "haute", "Mesure principale bien remplie (>90% données présentes)."
        if null_rate < 0.3:
            return "moyenne", "Mesure présente mais partiellement incomplète."
        return "faible", "Mesure trop incomplète pour des comparaisons fiables."
    if role == ROLE_DATE:
        return "haute", "Dimension temporelle essentielle pour les analyses de tendance."
    if role == ROLE_DIMENSION:
        if null_rate < 0.2:
            return "haute", "Axe de segmentation bien rempli — utile pour les vues filtrées."
        return "moyenne", "Axe de segmentation avec données manquantes."
    if role == ROLE_IDENTIFIANT:
        return "moyenne", "Clé utile pour les jointures et la déduplication."
    if role == ROLE_RATIO:
        return "haute", "Indicateur de taux directement exploitable."
    if role == ROLE_FLAG:
        return "moyenne", "Indicateur binaire utilisable pour la segmentation."
    if role == ROLE_TEXTE_LIBRE:
        return "faible", "Texte libre — faible exploitabilité sans traitement préalable."
    if role == ROLE_LABEL:
        return "moyenne", "Libellé descriptif — utile pour l'annotation et l'enrichissement."
    return "faible", "Rôle non déterminé — vérification manuelle recommandée."


def _build_examples(column_summary: dict[str, Any], role: str) -> list[str]:
    """Construit des exemples de valeurs lisibles et exploitables."""
    numeric_stats = column_summary.get("numeric_stats")
    if numeric_stats and role in (ROLE_MESURE, ROLE_RATIO, ROLE_FLAG):
        min_v = numeric_stats.get("min")
        max_v = numeric_stats.get("max")
        avg_v = numeric_stats.get("avg")
        examples = []
        if min_v is not None:
            examples.append(f"min={_fmt(min_v)}")
        if avg_v is not None:
            examples.append(f"moy={_fmt(avg_v)}")
        if max_v is not None:
            examples.append(f"max={_fmt(max_v)}")
        return examples

    top_values = column_summary.get("top_values") or []
    if top_values:
        return [
            f"{item['value']} ({item['count']} occ.)"
            for item in top_values[:5]
            if item.get("value") is not None
        ]
    return []


def _fmt(value: Any) -> str:
    if value is None:
        return "N/A"
    try:
        f = float(value)
        if f == int(f):
            return str(int(f))
        return f"{f:.4g}"
    except (TypeError, ValueError):
        return str(value)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def build_column_dictionary(profile: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Construit le dictionnaire intelligent de colonnes à partir du profil.
    Retourne une liste ordonnée, une entrée par colonne.
    """
    schema_json = profile.get("schema_json") or {}
    column_summary_json = profile.get("column_summary_json") or {}
    missing_summary = profile.get("missing_summary_json") or {}
    redundancy_summary = profile.get("redundancy_summary") or {}
    key_candidates = profile.get("key_candidates_summary") or {}
    row_count = int(profile.get("row_count") or 1)

    numeric_columns = {str(c) for c in (schema_json.get("numeric_columns") or [])}
    categorical_columns = {str(c) for c in (schema_json.get("categorical_columns") or [])}
    date_columns = {str(c) for c in (schema_json.get("date_columns") or [])}
    id_columns = {str(c) for c in (schema_json.get("id_columns") or [])}
    candidate_unique_keys = {str(c) for c in (schema_json.get("candidate_unique_keys") or key_candidates.get("candidate_unique_keys") or [])}
    partial_keys = {str(c) for c in (schema_json.get("partial_keys") or key_candidates.get("partial_keys") or [])}
    constant_columns = {str(c) for c in (column_summary_json.get("constant_columns") or [])}
    quasi_empty_columns = {str(c) for c in (column_summary_json.get("quasi_empty_columns") or [])}
    per_column_missing = missing_summary.get("per_column") or {}
    cardinality = column_summary_json.get("cardinality_by_column") or {}

    # Index detailed column summaries by name
    detailed_index: dict[str, dict[str, Any]] = {
        str(c.get("name") or ""): c
        for c in (column_summary_json.get("columns") or [])
    }

    dictionary: list[dict[str, Any]] = []

    for col_def in schema_json.get("columns") or []:
        col_name = str(col_def.get("name") or "")
        duckdb_type = str(col_def.get("duckdb_type") or "")
        detail = detailed_index.get(col_name) or {}

        null_info = per_column_missing.get(col_name) or {}
        null_rate = float(null_info.get("null_rate") or detail.get("null_rate") or 0.0)
        null_count = int(null_info.get("null_count") or detail.get("null_count") or 0)
        distinct_non_null = int(cardinality.get(col_name) or detail.get("distinct_non_null") or 0)
        non_null_count = int(detail.get("non_null_count") or max(0, row_count - null_count))
        numeric_stats = detail.get("numeric_stats")

        is_id = col_name in id_columns
        is_date = col_name in date_columns
        is_numeric = col_name in numeric_columns
        is_categorical = col_name in categorical_columns
        is_constant = col_name in constant_columns
        is_quasi_empty = col_name in quasi_empty_columns
        is_candidate_key = col_name in candidate_unique_keys
        is_partial_key = col_name in partial_keys
        redundant_with = _redundant_with(col_name, redundancy_summary)
        is_redundant = len(redundant_with) > 0

        role, role_reason = _assign_role(
            column_name=col_name,
            duckdb_type=duckdb_type,
            null_rate=null_rate,
            distinct_non_null=distinct_non_null,
            row_count=row_count,
            is_id=is_id,
            is_date=is_date,
            is_numeric=is_numeric,
            is_categorical=is_categorical,
            is_constant=is_constant,
            is_candidate_key=is_candidate_key,
            is_partial_key=is_partial_key,
            numeric_stats=numeric_stats,
        )

        utility, utility_reason = _estimate_utility(
            role=role,
            null_rate=null_rate,
            is_constant=is_constant,
            is_quasi_empty=is_quasi_empty,
            is_redundant=is_redundant,
        )

        examples = _build_examples(detail, role)

        dictionary.append({
            "name": col_name,
            "duckdb_type": duckdb_type,
            "role": role,
            "role_reason": role_reason,
            "analytical_utility": utility,
            "utility_reason": utility_reason,
            "null_rate": null_rate,
            "null_count": null_count,
            "non_null_count": non_null_count,
            "distinct_count": distinct_non_null,
            "is_candidate_key": is_candidate_key,
            "is_partial_key": is_partial_key,
            "is_named_id": is_id,
            "is_constant": is_constant,
            "is_quasi_empty": is_quasi_empty,
            "is_redundant_with": redundant_with,
            "examples": examples,
        })

    return dictionary

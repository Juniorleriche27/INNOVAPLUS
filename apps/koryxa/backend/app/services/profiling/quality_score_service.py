from __future__ import annotations

from typing import Any


def _auxiliary_columns(schema_json: dict[str, Any]) -> set[str]:
    columns = [str(item.get("name") or "") for item in (schema_json.get("columns") or [])]
    auxiliary_prefixes = ("note_",)
    auxiliary_exact = {"obs_status.label"}
    return {
        column
        for column in columns
        if column in auxiliary_exact or any(column.startswith(prefix) for prefix in auxiliary_prefixes)
    }


def _informational_constant_columns(columns: list[str]) -> list[str]:
    informational_prefixes = ("ref_area.", "source.", "indicator.")
    return [
        column
        for column in columns
        if any(column.startswith(prefix) for prefix in informational_prefixes)
    ]


def _analytic_numeric_columns(schema_json: dict[str, Any]) -> list[str]:
    numeric_columns = list(schema_json.get("numeric_columns") or [])
    id_columns = {str(value) for value in (schema_json.get("id_columns") or [])}
    date_columns = {str(value) for value in (schema_json.get("date_columns") or [])}
    return [column for column in numeric_columns if column not in id_columns and column not in date_columns]


def _business_categorical_columns(schema_json: dict[str, Any]) -> list[str]:
    auxiliary = _auxiliary_columns(schema_json)
    return [
        column
        for column in list(schema_json.get("categorical_columns") or [])
        if column not in auxiliary
    ]


def _critical_measure_missing_columns(
    schema_json: dict[str, Any],
    missing_summary_json: dict[str, Any],
    null_threshold: float = 0.2,
) -> list[dict[str, Any]]:
    per_column = missing_summary_json.get("per_column") or {}
    missing_columns: list[dict[str, Any]] = []
    for column in _analytic_numeric_columns(schema_json):
        column_stats = per_column.get(column) or {}
        null_rate = float(column_stats.get("null_rate") or 0.0)
        null_count = int(column_stats.get("null_count") or 0)
        if null_count <= 0 or null_rate < null_threshold:
            continue
        missing_columns.append(
            {
                "column": column,
                "null_rate": null_rate,
                "null_count": null_count,
            }
        )
    return sorted(missing_columns, key=lambda item: item["null_rate"], reverse=True)


def _clamp_score(value: int) -> int:
    return max(0, min(100, value))


def _level_for_score(score: int) -> str:
    if score >= 90:
        return "excellent"
    if score >= 75:
        return "bon"
    if score >= 55:
        return "moyen"
    return "faible"


def _alert(
    *,
    code: str,
    category: str,
    severity: str,
    title: str,
    detail: str,
    metric_name: str | None = None,
    metric_value: float | int | str | None = None,
    recommendation: str | None = None,
    decision_impact: str | None = None,
) -> dict[str, Any]:
    return {
        "code": code,
        "category": category,
        "severity": severity,
        "title": title,
        "detail": detail,
        "metric_name": metric_name,
        "metric_value": metric_value,
        "recommendation": recommendation,
        "decision_impact": decision_impact,
    }


def _cleaning_suggestion(
    *,
    code: str,
    title: str,
    action_type: str,
    priority: str,
    rationale: str,
    target_columns: list[str] | None = None,
    suggested_rule: str | None = None,
) -> dict[str, Any]:
    return {
        "code": code,
        "title": title,
        "action_type": action_type,
        "priority": priority,
        "rationale": rationale,
        "target_columns": target_columns or [],
        "suggested_rule": suggested_rule,
    }


_DEFAULT_RULES: dict[str, Any] = {
    "null_threshold": 0.2,
    "missing_rate_weight": 35,
    "critical_missing_weight": 18,
    "duplicate_weight": 20,
    "constant_column_penalty": 4,
    "constant_column_max": 12,
    "quasi_empty_penalty": 4,
    "quasi_empty_max": 16,
    "id_integrity_penalty": 6,
    "id_integrity_max": 12,
    "outlier_weight": 12,
    "mixed_type_penalty": 5,
    "mixed_type_max": 10,
}


def score_profile_quality(profile: dict[str, Any], rules: dict[str, Any] | None = None) -> dict[str, Any]:
    r = {**_DEFAULT_RULES, **(rules or {})}
    row_count = int(profile.get("row_count") or 0)
    column_count = int(profile.get("column_count") or 0)
    schema_json = profile.get("schema_json") or {}
    column_summary_json = profile.get("column_summary_json") or {}
    missing_summary_json = profile.get("missing_summary_json") or {}
    duplicate_summary_json = profile.get("duplicate_summary_json") or {}
    redundancy_summary = profile.get("redundancy_summary") or {}
    key_candidates_summary = profile.get("key_candidates_summary") or {}

    total_missing_cells = int(missing_summary_json.get("total_missing_cells") or 0)
    duplicate_row_count = int(duplicate_summary_json.get("duplicate_row_count") or 0)
    duplicate_row_rate = duplicate_row_count / max(1, row_count)
    auxiliary_columns = _auxiliary_columns(schema_json)
    raw_constant_columns = list(column_summary_json.get("constant_columns") or [])
    informational_constant_columns = _informational_constant_columns(raw_constant_columns)
    constant_columns = [
        column
        for column in raw_constant_columns
        if column not in auxiliary_columns and column not in informational_constant_columns
    ]
    quasi_empty_columns = [
        column for column in list(column_summary_json.get("quasi_empty_columns") or [])
        if column not in auxiliary_columns
    ]
    id_columns = list(schema_json.get("id_columns") or [])
    analytic_numeric_columns = _analytic_numeric_columns(schema_json)
    business_categorical_columns = _business_categorical_columns(schema_json)
    date_columns = list(schema_json.get("date_columns") or [])
    effective_column_count = max(1, column_count - len(auxiliary_columns))
    effective_total_missing_cells = total_missing_cells - sum(
        int((missing_summary_json.get("per_column") or {}).get(column, {}).get("null_count") or 0)
        for column in auxiliary_columns
    )
    effective_total_missing_cells = max(0, effective_total_missing_cells)
    missing_rate = effective_total_missing_cells / max(1, row_count * effective_column_count)
    null_threshold = float(r["null_threshold"])
    critical_measure_missing_columns = _critical_measure_missing_columns(
        schema_json,
        missing_summary_json,
        null_threshold=null_threshold,
    )
    max_critical_null_rate = max((float(item["null_rate"]) for item in critical_measure_missing_columns), default=0.0)

    id_integrity_issues = 0
    per_column = missing_summary_json.get("per_column") or {}
    cardinality = column_summary_json.get("cardinality_by_column") or {}
    integrity_checks = list(key_candidates_summary.get("integrity_checks") or [])
    named_integrity_checks = [item for item in integrity_checks if item.get("is_named_identifier")]
    if named_integrity_checks:
        id_integrity_issues = sum(
            1
            for item in named_integrity_checks
            if str(item.get("status") or "") in {"nullable_candidate", "duplicated_identifier"}
        )
    else:
        for column in id_columns:
            null_rate = float((per_column.get(column) or {}).get("null_rate") or 0.0)
            distinct_non_null = int(cardinality.get(column) or 0)
            if null_rate > 0:
                id_integrity_issues += 1
            if row_count and distinct_non_null not in {0, row_count}:
                id_integrity_issues += 1

    exact_duplicate_pairs = list(redundancy_summary.get("exact_duplicate_pairs") or [])

    outlier_column_count = 0
    outlier_rate_total = 0.0
    mixed_type_signals = 0
    for column in column_summary_json.get("columns") or []:
        stats = column.get("numeric_stats")
        if stats:
            outlier_rate = float(stats.get("outlier_rate") or 0.0)
            outlier_rate_total += outlier_rate
            if outlier_rate > 0.05:
                outlier_column_count += 1
        if column.get("duckdb_type") == "VARCHAR":
            lowered = str(column.get("name") or "").lower()
            if any(token in lowered for token in ("amount", "price", "value", "count", "qty", "quantity")):
                mixed_type_signals += 1

    w_missing = int(r["missing_rate_weight"])
    w_crit = int(r["critical_missing_weight"])
    w_dup = int(r["duplicate_weight"])
    p_const = int(r["constant_column_penalty"])
    max_const = int(r["constant_column_max"])
    p_quasi = int(r["quasi_empty_penalty"])
    max_quasi = int(r["quasi_empty_max"])
    p_id = int(r["id_integrity_penalty"])
    max_id = int(r["id_integrity_max"])
    w_out = int(r["outlier_weight"])
    p_mixed = int(r["mixed_type_penalty"])
    max_mixed = int(r["mixed_type_max"])

    penalties = {
        "missing_rate": min(w_missing, round(missing_rate * w_missing)),
        "critical_measure_missing": min(
            w_crit,
            round(max_critical_null_rate * w_missing),
        ),
        "duplicate_rows": min(w_dup, round(duplicate_row_rate * w_dup)),
        "constant_columns": min(max_const, len(constant_columns) * p_const),
        "quasi_empty_columns": min(max_quasi, len(quasi_empty_columns) * p_quasi),
        "id_integrity": min(max_id, id_integrity_issues * p_id),
        "outliers": min(w_out, round(outlier_rate_total * 20)),
        "mixed_types": min(max_mixed, mixed_type_signals * p_mixed),
    }
    score = _clamp_score(100 - sum(penalties.values()))

    subscores = {
        "completude": _clamp_score(
            100
            - round(missing_rate * 70)
            - round(max_critical_null_rate * 25)
            - min(10, len(quasi_empty_columns) * 2)
        ),
        "coherence": _clamp_score(
            100
            - min(30, mixed_type_signals * 10)
            - min(24, id_integrity_issues * 8)
            - min(18, outlier_column_count * 3)
        ),
        "unicite": _clamp_score(
            100
            - round(duplicate_row_rate * 70)
            - min(30, id_integrity_issues * 6)
        ),
        "stabilite": _clamp_score(
            100
            - min(20, len(constant_columns) * 4)
            - min(40, round(outlier_rate_total * 25))
            - min(15, outlier_column_count * 3)
        ),
        "exploitabilite_analytique": _clamp_score(
            100
            - min(20, len(constant_columns) * 3)
            - min(20, len(quasi_empty_columns) * 3)
            - min(20, mixed_type_signals * 5)
            - round(max_critical_null_rate * 20)
            - (20 if not analytic_numeric_columns and not business_categorical_columns else 0)
            - (10 if not analytic_numeric_columns else 0)
        ),
    }

    alerts: list[dict[str, Any]] = []
    if penalties["missing_rate"] > 0:
        alerts.append(
            _alert(
                code="missing_data",
                category="completude",
                severity="medium",
                title="Donnees manquantes",
                detail=f"Taux de cellules manquantes: {missing_rate:.2%}",
                metric_name="missing_rate",
                metric_value=round(missing_rate, 4),
                recommendation="Verifier les colonnes les moins remplies avant comparaison.",
                decision_impact="warning",
            )
        )
    if critical_measure_missing_columns:
        focus = critical_measure_missing_columns[0]
        alerts.append(
            _alert(
                code="core_metric_missing",
                category="completude",
                severity="high" if float(focus["null_rate"]) >= 0.3 else "medium",
                title="Mesure principale incomplete",
                detail=(
                    f"La mesure {focus['column']} contient "
                    f"{float(focus['null_rate']):.2%} de valeurs manquantes."
                ),
                metric_name="null_rate",
                metric_value=round(float(focus["null_rate"]), 4),
                recommendation=f"Fiabiliser {focus['column']} avant toute lecture executive.",
                decision_impact="fragile",
            )
        )
    if penalties["duplicate_rows"] > 0:
        alerts.append(
            _alert(
                code="duplicate_rows",
                category="unicite",
                severity="medium",
                title="Lignes dupliquees detectees",
                detail=f"Lignes dupliquees: {duplicate_row_count}",
                metric_name="duplicate_row_rate",
                metric_value=round(duplicate_row_rate, 4),
                recommendation="Dedoublonner le dataset avant agregation.",
                decision_impact="fragile",
            )
        )
    if constant_columns:
        alerts.append(
            _alert(
                code="constant_columns",
                category="exploitabilite_analytique",
                severity="low",
                title="Colonnes constantes",
                detail=f"Colonnes constantes: {', '.join(constant_columns[:5])}",
                metric_name="constant_column_count",
                metric_value=len(constant_columns),
                recommendation="Exclure les colonnes sans variance des livrables analytiques.",
                decision_impact="minor",
            )
        )
    if quasi_empty_columns:
        alerts.append(
            _alert(
                code="quasi_empty_columns",
                category="completude",
                severity="medium",
                title="Colonnes quasi vides",
                detail=f"Colonnes quasi vides: {', '.join(quasi_empty_columns[:5])}",
                metric_name="quasi_empty_column_count",
                metric_value=len(quasi_empty_columns),
                recommendation="Masquer ou completer les colonnes dont le taux de remplissage reste trop faible.",
                decision_impact="warning",
            )
        )
    if id_integrity_issues:
        alerts.append(
            _alert(
                code="id_integrity",
                category="coherence",
                severity="high",
                title="Cles potentiellement cassees",
                detail="Une ou plusieurs cles semblent incompletes ou dupliquees.",
                metric_name="id_integrity_issues",
                metric_value=id_integrity_issues,
                recommendation="Verifier les identifiants avant jointure, fusion ou dedoublonnage.",
                decision_impact="fragile",
            )
        )
    if outlier_column_count:
        alerts.append(
            _alert(
                code="outliers",
                category="stabilite",
                severity="medium",
                title="Valeurs atypiques detectees",
                detail=f"Colonnes numeriques avec valeurs aberrantes: {outlier_column_count}",
                metric_name="outlier_column_count",
                metric_value=outlier_column_count,
                recommendation="Confirmer si les points extremes sont des erreurs ou des cas reels.",
                decision_impact="review",
            )
        )
    if mixed_type_signals:
        alerts.append(
            _alert(
                code="mixed_types",
                category="coherence",
                severity="medium",
                title="Types potentiellement incoherents",
                detail="Certaines colonnes numeriques probables ont ete lues comme texte.",
                metric_name="mixed_type_signals",
                metric_value=mixed_type_signals,
                recommendation="Normaliser les formats et reparser les colonnes numeriques attendues.",
                decision_impact="warning",
            )
        )
    if exact_duplicate_pairs:
        pair_labels = [
            f"{item.get('col_a')} = {item.get('col_b')}"
            for item in exact_duplicate_pairs[:3]
        ]
        alerts.append(
            _alert(
                code="redundant_columns",
                category="exploitabilite_analytique",
                severity="low",
                title="Colonnes redondantes detectees",
                detail=f"Colonnes a fusionner ou masquer: {', '.join(pair_labels)}",
                metric_name="redundant_pair_count",
                metric_value=len(exact_duplicate_pairs),
                recommendation="Conserver une seule colonne par information strictement dupliquee.",
                decision_impact="minor",
            )
        )

    cleaning_suggestions: list[dict[str, Any]] = []
    if critical_measure_missing_columns:
        cleaning_suggestions.append(
            _cleaning_suggestion(
                code="fill_or_filter_core_metric",
                title="Traiter la mesure principale incomplete",
                action_type="fill_missing_values",
                priority="high",
                rationale="La mesure principale reste trop incomplete pour des comparaisons directes fiables.",
                target_columns=[str(item["column"]) for item in critical_measure_missing_columns[:3]],
                suggested_rule="Imputer, recollecter ou filtrer aux segments dont la completude depasse 95%.",
            )
        )
    if duplicate_row_count > 0:
        cleaning_suggestions.append(
            _cleaning_suggestion(
                code="deduplicate_rows",
                title="Supprimer les doublons avant agregation",
                action_type="deduplicate_rows",
                priority="high",
                rationale="Les doublons biaisent les tendances, les volumes et les moyennes.",
                suggested_rule="Construire une cle metier stable puis supprimer les enregistrements strictement dupliques.",
            )
        )
    if mixed_type_signals:
        cleaning_suggestions.append(
            _cleaning_suggestion(
                code="normalize_numeric_formats",
                title="Normaliser les formats de colonnes numeriques",
                action_type="normalize_formats",
                priority="medium",
                rationale="Certaines colonnes attendues comme numeriques sont lues comme texte.",
                suggested_rule="Uniformiser separateurs decimaux, symboles monetaire et espaces parasites avant reparsing.",
            )
        )
    if quasi_empty_columns:
        cleaning_suggestions.append(
            _cleaning_suggestion(
                code="exclude_weak_columns",
                title="Ecarter les colonnes trop faibles",
                action_type="exclude_columns",
                priority="medium",
                rationale="Les colonnes quasi vides apportent peu de valeur analytique en l'etat.",
                target_columns=quasi_empty_columns[:5],
                suggested_rule="Masquer des analyses par defaut les colonnes dont le taux de remplissage reste inferieur a 10%.",
            )
        )
    if business_categorical_columns and len(business_categorical_columns) >= 2:
        cleaning_suggestions.append(
            _cleaning_suggestion(
                code="standardize_categories",
                title="Stabiliser les dimensions categorielles",
                action_type="standardize_categories",
                priority="low",
                rationale="Les comparaisons segmentaires gagnent en lisibilite lorsque les libelles sont harmonises.",
                target_columns=business_categorical_columns[:4],
                suggested_rule="Fusionner variantes orthographiques et definir un referentiel de categories autorisees.",
            )
        )
    if exact_duplicate_pairs:
        target_columns = sorted(
            {
                str(item.get("col_a") or "")
                for item in exact_duplicate_pairs
            }
            | {
                str(item.get("col_b") or "")
                for item in exact_duplicate_pairs
            }
        )
        cleaning_suggestions.append(
            _cleaning_suggestion(
                code="merge_redundant_columns",
                title="Fusionner les colonnes redondantes",
                action_type="merge_columns",
                priority="low",
                rationale="Plusieurs colonnes portent strictement la meme information et alourdissent la lecture.",
                target_columns=[column for column in target_columns if column][:6],
                suggested_rule="Choisir une colonne canonique, documenter la correspondance puis masquer les doublons exacts.",
            )
        )

    fragile_decisions: list[str] = []
    reliable_decisions: list[str] = ["Profil structurel du dataset"]
    if duplicate_row_count > 0:
        fragile_decisions.append("Agregations globales sans dedoublonnage")
    if critical_measure_missing_columns:
        fragile_decisions.append("Comparaisons basees sur la mesure principale")
    if id_integrity_issues:
        fragile_decisions.append("Jointures et rapprochements sur les cles detectees")
    if outlier_column_count == 0 and duplicate_row_count == 0:
        reliable_decisions.append("Lecture descriptive initiale")
    if analytic_numeric_columns and max_critical_null_rate < 0.2:
        reliable_decisions.append("Comparaisons de tendance de premier niveau")

    return {
        "quality_score": score,
        "quality_level": _level_for_score(score),
        "quality_flags": alerts,
        "quality_alerts": alerts,
        "quality_subscores": subscores,
        "cleaning_suggestions": cleaning_suggestions,
        "reliable_decisions": reliable_decisions,
        "fragile_decisions": fragile_decisions,
        "penalties": penalties,
    }

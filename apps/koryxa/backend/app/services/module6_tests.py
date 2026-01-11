from __future__ import annotations

import random
import secrets
from typing import Dict, List

from app.core.ai import generate_answer
from app.core.config import settings
from app.schemas.module6 import TestTemplate


VARIANT_PREFIXES = [
    "Dans un notebook",
    "Dans une mission client",
    "Dans un rapport d'analyse",
    "Dans un projet scolaire",
]


BASE_TEMPLATES: List[Dict] = [
    # Python (10)
    {
        "id": "py-variables",
        "topic": "python",
        "concept": "variables",
        "question": "Quel type represente un nombre decimal en Python ?",
        "correct": "float",
        "distractors": ["int", "str", "bool"],
        "difficulty": "easy",
        "tags": ["types", "basics"],
    },
    {
        "id": "py-list",
        "topic": "python",
        "concept": "list",
        "question": "Quelle structure est ordonnee et mutable ?",
        "correct": "liste",
        "distractors": ["tuple", "set", "dict"],
        "difficulty": "easy",
        "tags": ["structures"],
    },
    {
        "id": "py-dict",
        "topic": "python",
        "concept": "dict",
        "question": "Quelle structure associe des cles a des valeurs ?",
        "correct": "dictionnaire",
        "distractors": ["liste", "tuple", "set"],
        "difficulty": "easy",
        "tags": ["structures"],
    },
    {
        "id": "py-loop",
        "topic": "python",
        "concept": "loop",
        "question": "Quelle boucle parcourt une collection element par element ?",
        "correct": "for",
        "distractors": ["if", "def", "class"],
        "difficulty": "easy",
        "tags": ["control-flow"],
    },
    {
        "id": "py-while",
        "topic": "python",
        "concept": "while",
        "question": "Quel risque principal existe avec une boucle while mal ecrite ?",
        "correct": "Boucle infinie",
        "distractors": ["Erreur de syntaxe", "Fichier corrompu", "Variable effacee"],
        "difficulty": "easy",
        "tags": ["control-flow"],
    },
    {
        "id": "py-func",
        "topic": "python",
        "concept": "function",
        "question": "Quel mot-cle sert a definir une fonction ?",
        "correct": "def",
        "distractors": ["func", "lambda", "class"],
        "difficulty": "easy",
        "tags": ["functions"],
    },
    {
        "id": "py-bool",
        "topic": "python",
        "concept": "boolean",
        "question": "Quelles sont les deux valeurs booleennes en Python ?",
        "correct": "True et False",
        "distractors": ["Yes et No", "0 et 1", "On et Off"],
        "difficulty": "easy",
        "tags": ["types"],
    },
    {
        "id": "py-index",
        "topic": "python",
        "concept": "indexing",
        "question": "Quel index renvoie le premier element d'une liste ?",
        "correct": "0",
        "distractors": ["1", "-1", "10"],
        "difficulty": "easy",
        "tags": ["indexing"],
    },
    {
        "id": "py-slice",
        "topic": "python",
        "concept": "slice",
        "question": "Que fait lst[:3] ?",
        "correct": "Les trois premiers elements",
        "distractors": ["Les trois derniers elements", "Element index 3", "Tout sauf les trois premiers"],
        "difficulty": "easy",
        "tags": ["indexing"],
    },
    {
        "id": "py-error",
        "topic": "python",
        "concept": "errors",
        "question": "Que signifie une erreur NameError ?",
        "correct": "Une variable n'est pas definie",
        "distractors": ["Division par zero", "Index hors limite", "Fichier introuvable"],
        "difficulty": "medium",
        "tags": ["errors"],
    },
    # Pandas (15)
    {
        "id": "pd-read",
        "topic": "pandas",
        "concept": "read",
        "question": "Quelle fonction charge un fichier CSV ?",
        "correct": "read_csv",
        "distractors": ["load_csv", "open_csv", "import_csv"],
        "difficulty": "easy",
        "tags": ["io"],
    },
    {
        "id": "pd-head",
        "topic": "pandas",
        "concept": "inspect",
        "question": "Quelle methode affiche les premieres lignes d'un DataFrame ?",
        "correct": "head",
        "distractors": ["info", "describe", "tail"],
        "difficulty": "easy",
        "tags": ["inspect"],
    },
    {
        "id": "pd-info",
        "topic": "pandas",
        "concept": "inspect",
        "question": "info() sert surtout a :",
        "correct": "Voir les types et valeurs manquantes",
        "distractors": ["Tracer un graphique", "Supprimer des colonnes", "Dupliquer le DataFrame"],
        "difficulty": "easy",
        "tags": ["inspect"],
    },
    {
        "id": "pd-missing",
        "topic": "pandas",
        "concept": "missing",
        "question": "Quelle fonction remplace les valeurs manquantes ?",
        "correct": "fillna",
        "distractors": ["dropna", "merge", "groupby"],
        "difficulty": "easy",
        "tags": ["cleaning"],
    },
    {
        "id": "pd-dropna",
        "topic": "pandas",
        "concept": "missing",
        "question": "Que fait dropna() ?",
        "correct": "Supprime les lignes avec NA",
        "distractors": ["Remplace les NA", "Trie le DataFrame", "Renomme les colonnes"],
        "difficulty": "easy",
        "tags": ["cleaning"],
    },
    {
        "id": "pd-dup",
        "topic": "pandas",
        "concept": "duplicates",
        "question": "Quelle methode supprime les doublons ?",
        "correct": "drop_duplicates",
        "distractors": ["dropna", "unique", "distinct"],
        "difficulty": "easy",
        "tags": ["cleaning"],
    },
    {
        "id": "pd-filter",
        "topic": "pandas",
        "concept": "filter",
        "question": "Pour filtrer des lignes, on utilise :",
        "correct": "Un masque conditionnel",
        "distractors": ["describe()", "sum()", "astype()"],
        "difficulty": "easy",
        "tags": ["filtering"],
    },
    {
        "id": "pd-sort",
        "topic": "pandas",
        "concept": "sort",
        "question": "Quelle methode trie un DataFrame ?",
        "correct": "sort_values",
        "distractors": ["order_by", "sort()", "arrange"],
        "difficulty": "easy",
        "tags": ["sorting"],
    },
    {
        "id": "pd-group",
        "topic": "pandas",
        "concept": "groupby",
        "question": "groupby sert a :",
        "correct": "Agreger par categorie",
        "distractors": ["Supprimer des NA", "Lire un CSV", "Dessiner un graphique"],
        "difficulty": "easy",
        "tags": ["aggregation"],
    },
    {
        "id": "pd-merge",
        "topic": "pandas",
        "concept": "merge",
        "question": "Quelle fonction fusionne deux DataFrames sur une cle ?",
        "correct": "merge",
        "distractors": ["concat", "append", "join_table"],
        "difficulty": "easy",
        "tags": ["merge"],
    },
    {
        "id": "pd-join",
        "topic": "pandas",
        "concept": "join",
        "question": "concat sert a :",
        "correct": "Empiler des DataFrames similaires",
        "distractors": ["Trier", "Nettoyer", "Calculer une moyenne"],
        "difficulty": "easy",
        "tags": ["merge"],
    },
    {
        "id": "pd-astype",
        "topic": "pandas",
        "concept": "types",
        "question": "Quelle methode change le type d'une colonne ?",
        "correct": "astype",
        "distractors": ["dtype", "rename", "apply"],
        "difficulty": "easy",
        "tags": ["types"],
    },
    {
        "id": "pd-iloc",
        "topic": "pandas",
        "concept": "indexing",
        "question": "iloc selectionne :",
        "correct": "Par positions numeriques",
        "distractors": ["Par noms de colonnes", "Par dates uniquement", "Par types"],
        "difficulty": "medium",
        "tags": ["indexing"],
    },
    {
        "id": "pd-loc",
        "topic": "pandas",
        "concept": "indexing",
        "question": "loc selectionne :",
        "correct": "Par labels (noms)",
        "distractors": ["Par positions uniquement", "Par tri alphabetique", "Par taille"],
        "difficulty": "medium",
        "tags": ["indexing"],
    },
    {
        "id": "pd-readsql",
        "topic": "pandas",
        "concept": "sql",
        "question": "Quelle fonction lit une requete SQL dans un DataFrame ?",
        "correct": "read_sql",
        "distractors": ["read_csv", "to_sql", "read_json"],
        "difficulty": "medium",
        "tags": ["sql"],
    },
    # SQL (15)
    {
        "id": "sql-select",
        "topic": "sql",
        "concept": "select",
        "question": "Quelle clause selectionne les colonnes ?",
        "correct": "SELECT",
        "distractors": ["FROM", "WHERE", "GROUP BY"],
        "difficulty": "easy",
        "tags": ["select"],
    },
    {
        "id": "sql-from",
        "topic": "sql",
        "concept": "from",
        "question": "Quelle clause precise la table ?",
        "correct": "FROM",
        "distractors": ["SELECT", "WHERE", "ORDER BY"],
        "difficulty": "easy",
        "tags": ["from"],
    },
    {
        "id": "sql-where",
        "topic": "sql",
        "concept": "where",
        "question": "Quelle clause filtre les lignes ?",
        "correct": "WHERE",
        "distractors": ["GROUP BY", "HAVING", "ORDER BY"],
        "difficulty": "easy",
        "tags": ["where"],
    },
    {
        "id": "sql-order",
        "topic": "sql",
        "concept": "order",
        "question": "Quelle clause trie les resultats ?",
        "correct": "ORDER BY",
        "distractors": ["SORT", "GROUP BY", "LIMIT"],
        "difficulty": "easy",
        "tags": ["order"],
    },
    {
        "id": "sql-limit",
        "topic": "sql",
        "concept": "limit",
        "question": "Quelle clause limite le nombre de lignes ?",
        "correct": "LIMIT",
        "distractors": ["TOP", "COUNT", "DISTINCT"],
        "difficulty": "easy",
        "tags": ["limit"],
    },
    {
        "id": "sql-join",
        "topic": "sql",
        "concept": "join",
        "question": "INNER JOIN sert a :",
        "correct": "Garder les lignes presentes dans les deux tables",
        "distractors": ["Garder toutes les lignes de gauche", "Supprimer les doublons", "Trier les resultats"],
        "difficulty": "medium",
        "tags": ["join"],
    },
    {
        "id": "sql-left",
        "topic": "sql",
        "concept": "join",
        "question": "LEFT JOIN garde :",
        "correct": "Toutes les lignes de la table gauche",
        "distractors": ["Seulement les lignes communes", "Aucune ligne", "Uniquement la table droite"],
        "difficulty": "medium",
        "tags": ["join"],
    },
    {
        "id": "sql-groupby",
        "topic": "sql",
        "concept": "groupby",
        "question": "GROUP BY sert a :",
        "correct": "Agreger par categorie",
        "distractors": ["Filtrer des lignes", "Trier", "Mettre a jour"],
        "difficulty": "easy",
        "tags": ["groupby"],
    },
    {
        "id": "sql-having",
        "topic": "sql",
        "concept": "having",
        "question": "HAVING filtre :",
        "correct": "Apres aggregation",
        "distractors": ["Avant aggregation", "Seulement les colonnes", "Les jointures"],
        "difficulty": "medium",
        "tags": ["having"],
    },
    {
        "id": "sql-count",
        "topic": "sql",
        "concept": "aggregate",
        "question": "Quelle fonction compte les lignes ?",
        "correct": "COUNT",
        "distractors": ["SUM", "AVG", "MIN"],
        "difficulty": "easy",
        "tags": ["aggregate"],
    },
    {
        "id": "sql-sum",
        "topic": "sql",
        "concept": "aggregate",
        "question": "Quelle fonction additionne les valeurs ?",
        "correct": "SUM",
        "distractors": ["COUNT", "AVG", "MAX"],
        "difficulty": "easy",
        "tags": ["aggregate"],
    },
    {
        "id": "sql-distinct",
        "topic": "sql",
        "concept": "distinct",
        "question": "DISTINCT sert a :",
        "correct": "Supprimer les doublons",
        "distractors": ["Trier", "Compter", "Renommer"],
        "difficulty": "easy",
        "tags": ["distinct"],
    },
    {
        "id": "sql-keys",
        "topic": "sql",
        "concept": "keys",
        "question": "Une cle primaire :",
        "correct": "Identifie chaque ligne",
        "distractors": ["Duplique les lignes", "Trie la table", "Relie deux bases"],
        "difficulty": "easy",
        "tags": ["keys"],
    },
    {
        "id": "sql-foreign",
        "topic": "sql",
        "concept": "keys",
        "question": "Une cle etrangere sert a :",
        "correct": "Relier deux tables",
        "distractors": ["Trier les lignes", "Supprimer des colonnes", "Calculer une somme"],
        "difficulty": "easy",
        "tags": ["keys"],
    },
    {
        "id": "sql-null",
        "topic": "sql",
        "concept": "null",
        "question": "IS NULL sert a :",
        "correct": "Tester les valeurs manquantes",
        "distractors": ["Trier", "Compter", "Joindre"],
        "difficulty": "easy",
        "tags": ["null"],
    },
    # Viz (10)
    {
        "id": "viz-line",
        "topic": "viz",
        "concept": "line",
        "question": "Quel graphique suit une evolution temporelle ?",
        "correct": "Courbe",
        "distractors": ["Camembert", "Table brute", "Carte"],
        "difficulty": "easy",
        "tags": ["charts"],
    },
    {
        "id": "viz-bar",
        "topic": "viz",
        "concept": "bar",
        "question": "Quel graphique compare des categories ?",
        "correct": "Bar chart",
        "distractors": ["Scatter plot", "Heatmap", "Boxplot"],
        "difficulty": "easy",
        "tags": ["charts"],
    },
    {
        "id": "viz-scatter",
        "topic": "viz",
        "concept": "scatter",
        "question": "Quel graphique montre une relation entre deux variables ?",
        "correct": "Scatter plot",
        "distractors": ["Bar chart", "Table", "Pie chart"],
        "difficulty": "easy",
        "tags": ["charts"],
    },
    {
        "id": "viz-heatmap",
        "topic": "viz",
        "concept": "heatmap",
        "question": "Une heatmap sert a :",
        "correct": "Afficher une intensite par cellule",
        "distractors": ["Tracer une courbe", "Lister des lignes", "Compter des doublons"],
        "difficulty": "easy",
        "tags": ["charts"],
    },
    {
        "id": "viz-axis",
        "topic": "viz",
        "concept": "axes",
        "question": "Un graphique clair doit afficher :",
        "correct": "Titres et axes lisibles",
        "distractors": ["Couleurs aleatoires", "Aucun titre", "Axes caches"],
        "difficulty": "easy",
        "tags": ["clarity"],
    },
    {
        "id": "viz-story",
        "topic": "viz",
        "concept": "story",
        "question": "Un bon reporting doit etre :",
        "correct": "Clair et actionnable",
        "distractors": ["Complexe", "Sans commentaire", "Ambigu"],
        "difficulty": "medium",
        "tags": ["storytelling"],
    },
    {
        "id": "viz-scale",
        "topic": "viz",
        "concept": "scale",
        "question": "Une echelle trompeuse peut :",
        "correct": "Induire en erreur",
        "distractors": ["Ameliorer la precision", "Supprimer les erreurs", "Changer les types"],
        "difficulty": "medium",
        "tags": ["ethics"],
    },
    {
        "id": "viz-legend",
        "topic": "viz",
        "concept": "legend",
        "question": "Une legende sert a :",
        "correct": "Expliquer les categories ou couleurs",
        "distractors": ["Trier les lignes", "Calculer une moyenne", "Sauver un fichier"],
        "difficulty": "easy",
        "tags": ["clarity"],
    },
    {
        "id": "viz-matplotlib",
        "topic": "viz",
        "concept": "matplotlib",
        "question": "Matplotlib est utilise pour :",
        "correct": "Tracer des graphiques en Python",
        "distractors": ["Faire des requetes SQL", "Stocker des donnees", "Nettoyer des NA"],
        "difficulty": "easy",
        "tags": ["tools"],
    },
    {
        "id": "viz-seaborn",
        "topic": "viz",
        "concept": "seaborn",
        "question": "Seaborn est utile car :",
        "correct": "Il ameliore la lisibilite des graphiques",
        "distractors": ["Il remplace Python", "Il est un SGBD", "Il sert a compiler"],
        "difficulty": "medium",
        "tags": ["tools"],
    },
]


def build_templates() -> List[TestTemplate]:
    templates: List[TestTemplate] = []
    for base in BASE_TEMPLATES:
        for idx, prefix in enumerate(VARIANT_PREFIXES, start=1):
            prompt = f"{prefix}, {base['question']}"
            template = TestTemplate(
                id=f"{base['id']}-{idx}",
                topic=base["topic"],
                concept=base["concept"],
                question=prompt,
                correct=base["correct"],
                distractors=list(base["distractors"]),
                difficulty=base["difficulty"],
                tags=list(base["tags"]),
            )
            templates.append(template)
    return templates[:200]


def _paraphrase(question: str) -> str:
    if not settings.COHERE_API_KEY:
        return question
    prompt = (
        \"Paraphrase la question suivante en gardant exactement le meme sens et la meme langue. \"\n
        \"Ne change pas la reponse correcte. Donne uniquement la question reformulee.\\n\"\n
        f\"Question: {question}\"\n
    )
    try:
        result = generate_answer(prompt, provider=\"cohere\").strip()
        if result and len(result) > 10:
            return result
    except Exception:
        return question
    return question


def generate_test_questions(counts: Dict[str, int]) -> List[Dict]:
    templates = build_templates()
    by_topic: Dict[str, List[TestTemplate]] = {}
    for template in templates:
        by_topic.setdefault(template.topic, []).append(template)

    rng = secrets.SystemRandom()
    questions: List[Dict] = []

    for topic, count in counts.items():
        pool = list(by_topic.get(topic, []))
        rng.shuffle(pool)
        for template in pool[:count]:
            options = [template.correct] + list(template.distractors)
            rng.shuffle(options)
            correct_index = options.index(template.correct)
            prompt = _paraphrase(template.question)
            questions.append(
                {
                    "id": template.id,
                    "topic": template.topic,
                    "prompt": prompt,
                    "options": options,
                    "answer_index": correct_index,
                    "difficulty": template.difficulty,
                }
            )

    rng.shuffle(questions)
    return questions

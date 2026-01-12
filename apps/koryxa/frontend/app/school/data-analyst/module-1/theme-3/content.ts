import type { ThemeArticle, ThemeVideo } from "../content";

export type ThemePageSection = {
  heading: string;
  body: string[];
};

export type ThemePage = {
  title: string;
  sections: ThemePageSection[];
};

export const theme3Meta = {
  title: "Thème 3 — KPIs : définition, choix, pièges & dictionnaire KPI",
  module: "Module 1 — Cadrage & KPIs",
  readingTime: "60–90 min",
};

export const theme3Videos: ThemeVideo[] = [
  { title: "Définition KPI - Qu'est-ce qu'un KPI", youtubeId: "Da_nZwIDWLk", lang: "fr" },
  { title: "What is a KPI? Key Performance Indicators", youtubeId: "soiChkomKmo", lang: "en" },
];

export const theme3Articles: ThemeArticle[] = [
  { label: "Investopedia — KPIs: What Are Key Performance Indicators?", url: "https://www.investopedia.com/terms/k/kpi.asp" },
  { label: "Qlik — What is a KPI?", url: "https://www.qlik.com/us/kpi" },
  { label: "CNA — Goodhart’s Law (PDF)", url: "https://www.cna.org/reports/2022/09/Goodharts-Law-Recognizing-Mitigating-Manipulation-Measures-in-Analysis.pdf" },
];

export const theme3Pages: ThemePage[] = [
  {
    title: "Pourquoi ce thème est non négociable",
    sections: [
      {
        heading: "Un KPI mal défini peut ruiner un projet",
        body: [
          "Un Data Analyst peut produire des graphiques parfaits… et livrer une catastrophe si les KPI sont mal définis, ambigus, pas actionnables, ou “optimisables” sans améliorer la réalité.",
          "Le KPI n’est pas un “joli chiffre”. C’est une boussole. Et une boussole mal calibrée te conduit au mauvais endroit, même si tu marches très vite.",
        ],
      },
      {
        heading: "À quoi servent les KPI (concrètement)",
        body: [
          "Dans une organisation (startup, ONG, plateforme e-learning, business livraison, etc.), les KPI servent à trois choses :",
          "1) Décider : où on met l’effort, qu’est-ce qu’on corrige en premier, est-ce qu’on continue/stoppe une action ?",
          "2) Piloter dans le temps : est-ce que ça s’améliore, est-ce que c’est stable, est-ce que ça se dégrade ?",
          "3) Aligner l’équipe : même mesure, même calcul, même définition de “bon”.",
          "Sans ça : le CEO a un chiffre, le produit un autre, le support un troisième… et la réunion devient un débat de chiffres au lieu d’une réunion de décision.",
        ],
      },
      {
        heading: "Objectif du thème",
        body: [
          "1) Comprendre ce qu’est un KPI (et ce que ce n’est pas).",
          "2) Choisir des KPI utiles.",
          "3) Écrire un dictionnaire KPI qui évite les disputes.",
          "4) Ajouter des garde-fous contre les effets pervers.",
        ],
      },
    ],
  },
  {
    title: "Définition : KPI vs métrique vs objectif",
    sections: [
      {
        heading: "Objectif (but)",
        body: [
          "Un objectif décrit le résultat recherché, en langage simple. Exemples : augmenter la complétion du Module 1, réduire les retards, augmenter la rétention, réduire le coût d’acquisition.",
          "Un objectif répond à : qu’est-ce qu’on veut améliorer ? et pourquoi ?",
        ],
      },
      {
        heading: "KPI (indicateur clé)",
        body: [
          "Un KPI est une mesure quantifiable utilisée pour suivre la performance vers un objectif dans le temps, afin de piloter des décisions.",
          "Exemples KORYXA School : completion_rate_m1 (outcome), support_ticket_rate (guardrail), notebook_opened_48h_rate (leading).",
        ],
      },
      {
        heading: "Métrique (mesure)",
        body: [
          "Une métrique est une mesure. Toutes les métriques ne sont pas des KPI.",
          "Elles deviennent KPI si elles sont reliées à un objectif clair, actionnables, et acceptées comme guide de décision.",
          "Règle : Objectif = où tu veux aller · KPI = comment tu sais si tu y vas · Métrique = infos utiles (pas forcément “clé”).",
        ],
      },
    ],
  },
  {
    title: "Les critères d’un bon KPI (checklist pro)",
    sections: [
      {
        heading: "1) Aligné à une décision",
        body: [
          "Question obligatoire : “Si ce KPI bouge, quelle action change ?”",
          "Si aucune action ne change → ce n’est pas un KPI pilotable (souvent un chiffre décoratif).",
        ],
      },
      {
        heading: "2) Mesurable sans ambiguïté",
        body: [
          "Formule unique, unité claire, population incluse/exclue, période de calcul définie.",
          "Exemple de piège : “Utilisateur actif” = login ? session > 2 min ? achat ? progression ? Sans définition, tu gagnes une réunion et tu perds le business.",
        ],
      },
      {
        heading: "3) Actionnable",
        body: [
          "Tu dois pouvoir citer 1–3 leviers d’action.",
          "Exemple KORYXA School si completion_rate_m1 baisse : renforcer exemples, notebook guidé, revoir mini-projet (template, exemple de rendu).",
        ],
      },
      {
        heading: "4) Compréhensible par le métier",
        body: [
          "Un KPI incompris est un KPI non utilisé. Explique en 30 secondes : ce que ça mesure, pourquoi ça compte, comment c’est calculé (haut niveau), et quelle action on prend.",
        ],
      },
      {
        heading: "5) Fiable et suivable",
        body: [
          "Un KPI doit être possible à produire à une fréquence utile, avec une qualité minimale, sans bricolage permanent.",
          "Un KPI qui dépend d’un export manuel fragile n’est pas pilotable.",
        ],
      },
    ],
  },
  {
    title: "Types de KPI (pour choisir)",
    sections: [
      {
        heading: "Leading vs Lagging",
        body: [
          "Lagging (retard) : résultat final (completion_rate_m1, % retards).",
          "Leading (avance) : comportement qui précède le résultat (notebook_opened_48h_rate, theme2_completion_rate).",
          "Règle terrain : souvent 1 outcome (lagging), 1–2 leading, 1 guardrail (qualité).",
        ],
      },
      {
        heading: "Entrée / sortie",
        body: [
          "Entrée (activité) : démarrage (ex : % qui commencent le thème 2).",
          "Sortie (outcome) : résultat final (ex : % qui soumettent le mini-projet).",
          "Tu peux améliorer une entrée sans améliorer la sortie : regarde la chaîne complète.",
        ],
      },
      {
        heading: "North Star (si applicable)",
        body: [
          "Une mesure phare qui résume la valeur. Utile si définie proprement, sinon elle cache la réalité.",
        ],
      },
      {
        heading: "Guardrails (garde-fous)",
        body: [
          "Mesure limite : tu améliores le KPI principal sans dégrader un aspect critique (tickets support, coût carburant, satisfaction, marge…).",
        ],
      },
    ],
  },
  {
    title: "Pièges et effets pervers (obligatoire)",
    sections: [
      {
        heading: "Goodhart : quand la mesure devient la cible",
        body: [
          "Si tu récompenses “compléter vite”, certains cliquent sans apprendre. Si tu récompenses “moins de tickets”, certains tickets sont fermés sans résolution.",
          "Solution : KPI principal + garde-fou + cohérence/qualité (quiz/mini-projet).",
        ],
      },
      {
        heading: "Corrélation ≠ causalité",
        body: [
          "Si les apprenants qui regardent une vidéo complètent plus, ça ne prouve pas que la vidéo cause la complétion. Peut-être que les plus motivés font tout.",
          "Utilise la corrélation pour explorer, mais évite les conclusions causales sans test.",
        ],
      },
      {
        heading: "Définition floue = guerre de chiffres",
        body: [
          "Mots dangereux : actif, engagé, validé, abandonné, retard, satisfait, réussi…",
          "Traduire en événements, règles, seuils, unités, exclusions.",
        ],
      },
      {
        heading: "Problèmes de dénominateur",
        body: [
          "Beaucoup de KPI sont des ratios. Danger : numérateur/dénominateur ne couvrent pas la même population (ex : “inscrit” = compte créé vs paiement).",
          "Le dictionnaire KPI doit verrouiller enrolled, validated, doublons, comptes test.",
        ],
      },
      {
        heading: "Simpson (agrégation trompeuse)",
        body: [
          "Un KPI global peut s’améliorer alors que des segments se dégradent. Suivre global + segmentation (pays, device, canal, cohorte).",
        ],
      },
    ],
  },
  {
    title: "Dictionnaire KPI : la partie “pro”",
    sections: [
      {
        heading: "Champs obligatoires (minimum KORYXA)",
        body: [
          "kpi_name, definition, objective, numerator, denominator, formula, unit, granularity, segment, source, owner, refresh, guardrail, gaming_risk, controls.",
          "Convention : minuscules + underscore + explicite (completion_rate_m1, support_ticket_rate…).",
        ],
      },
      {
        heading: "Exemple (KORYXA School) — 6 KPI minimum",
        body: [
          "1) completion_rate_m1 (outcome) = validated_users / enrolled_users · granularité cohorte hebdo · guardrail support_ticket_rate",
          "2) notebook_opened_48h_rate (leading) = % qui ouvrent sous 48h",
          "3) theme2_completion_rate (leading) = % qui terminent le thème 2",
          "4) median_time_to_theme2_hours (diagnostic) = médiane heures inscription → première vue thème 2",
          "5) support_ticket_rate (guardrail) = tickets support / inscrit",
          "6) quiz_avg_score_m1 ou project_submission_rate_m1 (qualité) — si non instrumenté : noter “à instrumenter” dans controls/source.",
        ],
      },
    ],
  },
  {
    title: "KPI Tree (bonus utile)",
    sections: [
      {
        heading: "Relier objectif → outcome → leviers → garde-fous",
        body: [
          "Objectif : augmenter la complétion du Module 1",
          "|— Outcome : completion_rate_m1",
          "|— Leading : notebook_opened_48h_rate, theme2_completion_rate, median_time_to_theme2_hours",
          "— Guardrails : support_ticket_rate, project_submission_rate_m1 (si dispo)",
          "Pourquoi c’est utile : tu évites 15 chiffres sans logique et tu sais où agir.",
        ],
      },
    ],
  },
  {
    title: "Exercices (avant le quiz)",
    sections: [
      {
        heading: "Exercice A (manuel)",
        body: [
          "Pour l’objectif “augmenter la complétion du Module 1” : propose 1 KPI outcome, 2 KPI leading, 1 guardrail, et explique en 1 ligne l’utilité de chacun.",
          "Format : outcome : … · leading 1 : … · leading 2 : … · guardrail : …",
        ],
      },
      {
        heading: "Exercice B (notebook obligatoire)",
        body: [
          "1) Remplir un template de dictionnaire KPI (6 lignes minimum).",
          "2) Valider cohérence (colonnes + doublons).",
          "3) Calculer au moins 2 KPI sur le dataset (principal + guardrail).",
          "4) Exporter : theme3_kpi_dictionary.csv, theme3_kpi_values.json, theme3_guardrail_analysis.md",
        ],
      },
    ],
  },
  {
    title: "Checklist validation Thème 3 + références",
    sections: [
      {
        heading: "Checklist",
        body: [
          "• 6 KPIs (3 clés + 3 secondaires)",
          "• dictionnaire KPI complet (tous champs obligatoires)",
          "• 1 guardrail pour le KPI principal",
          "• exports notebook générés",
          "• mini-projet soumis",
        ],
      },
      {
        heading: "Références",
        body: [
          "Investopedia — KPIs: What Are Key Performance Indicators?",
          "Qlik — What is a KPI?",
          "CNA — Goodhart’s Law (PDF).",
        ],
      },
    ],
  },
];


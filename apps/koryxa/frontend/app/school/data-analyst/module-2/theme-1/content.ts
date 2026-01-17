import type { ThemeArticle, ThemeVideo } from "../content";

export type ThemePageSection = {
  heading: string;
  body: string[];
};

export type ThemePage = {
  title: string;
  sections: ThemePageSection[];
};

export const theme1Meta = {
  title: "Theme 1 — Panorama des sources & plan de collecte",
  module: "Module 2 — Collecte des donnees",
  readingTime: "70–100 min",
};

export const theme1Videos: ThemeVideo[] = [
  { lang: "fr", youtubeId: "BgLkdl0pZVk", title: "Les outils de Daniel N°17 — Le plan de collecte des donnees" },
  { lang: "en", youtubeId: "cd_jj0IRmaA", title: "What is Data Collection? | Data Fundamentals for Beginners" },
];

export const theme1Articles: ThemeArticle[] = [
  { label: "Plan de collecte de donnees — definition & structure", url: "https://www.questionpro.com/blog/fr/plan-de-collecte-de-donnees/" },
  {
    label: "Deep Dive into Data Extraction (CSV/Excel/SQL/API) — exemples",
    url: "https://blog.dataengineerthings.org/deep-dive-into-data-extraction-the-first-step-in-data-lifecycle-885dfd9ab7ff",
  },
  { label: "Data mapping — exemple & composants d’un data map", url: "https://www.bridging-the-gap.com/data-mapping/" },
  { label: "Data mapping — process & objectifs", url: "https://usercentrics.com/knowledge-hub/data-map/" },
];

export const theme1Pages: ThemePage[] = [
  {
    title: "Pourquoi la collecte est un vrai travail",
    sections: [
      {
        heading: "1) Le probleme (Page 1)",
        body: [
          "Quand une analyse sort de mauvais resultats, on accuse souvent les donnees, l'outil ou le dashboard. Dans la plupart des cas, la cause est plus simple : la collecte a ete faite sans methode.",
          "Une collecte mal cadree cree de la dette : tu recuperes des donnees inutiles, tu melanges des grains, tu perds la tracabilite et tu decouvres les contraintes trop tard.",
          "Objectif de ce theme : lister les sources, evaluer vite ce qui est utile et accessible, produire un inventaire, un data mapping minimal et un plan de collecte reproductible (notebook + exports).",
        ],
      },
    ],
  },
  {
    title: "Les 4 erreurs classiques de collecte",
    sections: [
      {
        heading: "2) Erreurs (Page 2)",
        body: [
          "Erreur 1 : collecter trop large. Beaucoup de colonnes et de tables, mais rien ne sert une decision. Tu nettoies des infos qui ne serviront jamais.",
          "Erreur 2 : melanger des niveaux de detail (grain). Une table commandes (1 ligne = 1 commande) jointee avec une table articles (1 ligne = 1 article) peut multiplier les montants et creer des KPI faux.",
          "Erreur 3 : perdre la tracabilite. Personne ne sait d'ou vient un chiffre, quand l'extraction a ete faite, quel filtre a ete applique, ni quelle version.",
          "Erreur 4 : decouvrir les contraintes trop tard. Acces refuse, API limitee, historique absent : tu le decouvres apres avoir promis des resultats.",
        ],
      },
    ],
  },
  {
    title: "Types de donnees (structurees / semi-structurees / non structurees)",
    sections: [
      {
        heading: "3) Typologie (Page 3)",
        body: [
          "Donnees structurees : tables SQL, CSV propres, tableaux simples. Avantage : jointures et agregations faciles. Risques : cles manquantes, grain incoherent.",
          "Donnees semi-structurees : JSON d'API, logs d'evenements. Avantage : riches et adaptees aux parcours utilisateurs. Risques : schema changeant, champs imbriques, pagination.",
          "Donnees non structurees : tickets, PDF, images. Avantage : contexte metier. Risque : plus couteux; souvent a garder en phase 2.",
        ],
      },
    ],
  },
  {
    title: "Familles de sources : fichiers (CSV/Excel)",
    sections: [
      {
        heading: "4) Fichiers (Page 4)",
        body: [
          "Les fichiers arrivent souvent via exports CRM, rapports internes ou listes apprenants/clients.",
          "Questions a poser : combien de fichiers et a quelle frequence ? formats de dates, separateur CSV, encodage ? Excel multi-feuilles, tables fusionnees, lignes de total ?",
        ],
      },
    ],
  },
  {
    title: "Familles de sources : bases SQL",
    sections: [
      {
        heading: "5) SQL (Page 5)",
        body: [
          "Les bases SQL viennent d'une application (inscriptions, commandes) ou d'un back-office (ERP/CRM).",
          "Questions a poser : qui donne l'acces ? quelles tables ? quelles cles ? quel est le grain exact ? historique complet ou partiel ?",
        ],
      },
    ],
  },
  {
    title: "Familles de sources : APIs",
    sections: [
      {
        heading: "6) APIs (Page 6)",
        body: [
          "Les APIs couvrent paiements, SMS, analytics, outils externes, open data.",
          "Questions a poser : auth (API key/OAuth), pagination (page/limit/cursor), rate limits, endpoints stables, format JSON et champs requis.",
        ],
      },
    ],
  },
  {
    title: "Familles de sources : outils metiers et tracking",
    sections: [
      {
        heading: "7) Outils & logs (Page 7)",
        body: [
          "Outils metiers : CRM/ERP/Analytics. Souvent via export CSV ou connecteurs. Attention aux definitions internes (utilisateur actif, conversion), segmentation, fenetre d'historique.",
          "Logs & tracking : evenements opened_theme, opened_notebook, submitted, validated. A verifier : timezone, evenements manquants, proprietes utiles (country, device, channel).",
        ],
      },
    ],
  },
  {
    title: "La methode Source → KPI → Decision",
    sections: [
      {
        heading: "8) Decision d'abord (Page 8)",
        body: [
          "Avant de collecter, tu relies : Decision → Objectif → KPI → Questions → Donnees → Sources.",
          "Si une donnee ne sert aucun KPI ni aucune question, elle devient du bruit, ralentit le projet et augmente les risques (privacy, qualite, stockage).",
          "Exemple : decision 'quelles lecons enrichir ?' → KPI completion_rate_m1 → question 'a quel theme les gens decrochent ?' → donnees events/validations → sources platform_events + validations.",
        ],
      },
    ],
  },
  {
    title: "Inventaire des sources : le tableau standard",
    sections: [
      {
        heading: "9) Inventory (Page 9)",
        body: [
          "L'inventaire liste toutes les sources candidates, meme hypothetique.",
          "Colonnes recommandees : source_name, type, owner, access, refresh, grain, key_fields, coverage, known_issues, privacy, linked_kpis.",
          "Objectif : rendre visible l'utile, l'accessibilite, les risques et la valeur pour les KPI.",
        ],
      },
    ],
  },
  {
    title: "Data mapping minimal : relier les sources",
    sections: [
      {
        heading: "10) Mapping (Page 10)",
        body: [
          "Le data mapping te dit quelles sources se relient, par quelles cles et ou sont les trous.",
          "Exemple : platform_events.user_id -> validations.user_id -> profile.user_id -> marketing.user_id -> support_tickets.user_id.",
        ],
      },
    ],
  },
  {
    title: "Controles avant d'integrer une source",
    sections: [
      {
        heading: "11) Controles (Page 11)",
        body: [
          "La cle existe-t-elle dans chaque source ? Meme type (string vs int) ? Unicite attendue ? % de valeurs manquantes sur la cle ?",
          "Verifier l'impact des jointures : combien de user_id perdus ? quels orphelins ? quel volume apres jointure ?",
          "Le grain est-il coherent avant agregations ? (event vs user vs ticket).",
        ],
      },
    ],
  },
  {
    title: "Plan de collecte : document operationnel",
    sections: [
      {
        heading: "12) Plan (Page 12)",
        body: [
          "Le plan repond : quoi collecter, d'ou, comment, quand, dans quel ordre, et comment valider.",
          "Template : contexte, sources, data requirements, methode d'acces, ordre d'extraction, controles qualite, stockage, tracabilite, risques.",
        ],
      },
    ],
  },
  {
    title: "Ordre recommande (pro)",
    sections: [
      {
        heading: "13) Priorites (Page 13)",
        body: [
          "Priorite 1 : sources coeur KPI (events, commandes, validations).",
          "Priorite 2 : segmentation (profile, marketing, device).",
          "Priorite 3 : garde-fous / qualite (support tickets, remboursements).",
        ],
      },
    ],
  },
  {
    title: "Controles qualite express",
    sections: [
      {
        heading: "14) QC express (Page 14)",
        body: [
          "Avant toute analyse : % manquants, doublons, coherence des dates, valeurs inattendues, outliers simples, volumes par jour/semaine (trous de tracking).",
          "Ces checks ne remplacent pas une gouvernance complete, mais ils evitent 80% des mauvaises surprises.",
        ],
      },
    ],
  },
  {
    title: "Exercices et livrables",
    sections: [
      {
        heading: "15) A faire (Page 15)",
        body: [
          "A) Remplir un inventaire de 8 sources minimum.",
          "B) Ecrire un data mapping minimal (au moins 4 sources reliees).",
          "C) Ecrire un plan de collecte 1 page.",
          "D) Executer le notebook et generer les exports obligatoires.",
        ],
      },
    ],
  },
  {
    title: "Checklist de validation",
    sections: [
      {
        heading: "16) Checklist (Page 16)",
        body: [
          "inventory >= 8 sources.",
          "data mapping : 4+ sources + cles + jointures proposees.",
          "plan de collecte : etapes + controles + stockage + tracabilite.",
          "exports notebook generes + soumission validee.",
        ],
      },
    ],
  },
];

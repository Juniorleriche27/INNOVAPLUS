import type { ThemeArticle, ThemeVideo } from "../content";

export type ThemePageSection = {
  heading: string;
  body: string[];
};

export type ThemePage = {
  title: string;
  sections: ThemePageSection[];
};

export const theme5Meta = {
  title: "Thème 5 — Capstone cadrage : dossier complet",
  module: "Module 1 — Cadrage & KPIs",
  readingTime: "90–120 min",
};

export const theme5Videos: ThemeVideo[] = [
  { lang: "fr", youtubeId: "YMsJnmjFsJI", title: "Tuto Charte projet (définition + éléments clés)" },
  { lang: "en", youtubeId: "xvj0bbOfyTg", title: "What is a Project Charter? | Explained in 4 Minutes" },
];

export const theme5Articles: ThemeArticle[] = [
  { label: "Shopify — How To Write a Project Charter", url: "https://www.shopify.com/in/blog/project-charter" },
  { label: "Wrike — What is a project charter?", url: "https://www.wrike.com/project-management-guide/faq/what-is-a-project-charter-in-project-management/" },
  { label: "Atlassian — Acceptance criteria", url: "https://www.atlassian.com/work-management/project-management/acceptance-criteria" },
];

export const theme5Pages: ThemePage[] = [
  {
    title: "Objectif du capstone pack (ce que tu dois livrer)",
    sections: [
      {
        heading: "Lecture (Page 1)",
        body: [
          "Jusqu’ici, tu as produit des éléments séparés : objectif SMART + baseline (Thème 2), dictionnaire KPI (Thème 3), plan d’analyse + exigences de données + critères d’acceptation (Thème 4).",
          "Le Thème 5 te fait livrer un dossier unique, propre, vendable : exactement ce qu’un Data Analyst remet avant d’exécuter l’analyse.",
          "Livrable final : Module 1 Capstone Pack (ZIP) contenant :",
          "1) capstone_brief.md (1 page, clair)",
          "2) theme2_baseline_metrics.json",
          "3) theme3_kpi_dictionary.csv",
          "4) theme4_analysis_plan.md",
          "5) theme4_data_requirements.csv",
          "6) theme4_acceptance_criteria.json",
          "7) capstone_checklist.json (contrôles automatiques)",
          "8) README.md (reproduction)",
        ],
      },
    ],
  },
  {
    title: "Pourquoi un “Capstone Pack” est indispensable",
    sections: [
      {
        heading: "Lecture (Page 2)",
        body: [
          "Beaucoup de projets data échouent parce qu’on commence à produire (graphes, dashboard, requêtes) avant d’avoir figé : la décision à changer, le périmètre, les définitions KPI, les données nécessaires (et leur grain), et ce que signifie “terminé et acceptable”.",
          "Résultat typique : donnée clé inexistante, définitions incohérentes, demande qui change, reporting décoratif.",
          "Le Capstone Pack verrouille 3 choses :",
          "1) Alignement : tout le monde parle de la même chose.",
          "2) Exécutabilité : données/accès/grain sont réalistes.",
          "3) Validation : on sait comment accepter ou rejeter le livrable.",
        ],
      },
    ],
  },
  {
    title: "Le brief (ta page la plus importante)",
    sections: [
      {
        heading: "Lecture (Page 3)",
        body: [
          "Le brief est la version courte qui répond à 7 questions : pourquoi on fait l’analyse, quelle décision change, quel objectif SMART, quels KPI, quel scope IN/OUT, quelles données (sources + grain), comment on valide.",
          "Ton capstone_brief.md doit contenir : Contexte, Décision à changer, Objectif (SMART), KPIs (principal + guardrail), Scope (IN/OUT), Données (sources + grain), Méthode (très court), Livrables, Validation.",
          "Règle pro : un brief est une promesse vérifiable (ce que je livre, comment on accepte, ce que je ne ferai pas).",
        ],
      },
    ],
  },
  {
    title: "Assembler le dossier + consignes de soumission",
    sections: [
      {
        heading: "Lecture (Page 4)",
        body: [
          "Inputs récupérés : theme2_baseline_metrics.json, theme3_kpi_dictionary.csv, theme4_analysis_plan.md, theme4_data_requirements.csv, theme4_acceptance_criteria.json.",
          "Ce que tu ajoutes : capstone_brief.md, capstone_checklist.json, README.md, module1_capstone_submission.zip.",
          "Pourquoi le notebook est obligatoire : forcer la présence des fichiers, la cohérence minimale, et l’export automatique du ZIP.",
          "Soumission : tu dois uploader module1_capstone_submission.zip. Le pack est validé si capstone_checklist.json.passed == true.",
        ],
      },
    ],
  },
  {
    title: "Checklist de validation (avant le quiz)",
    sections: [
      {
        heading: "Lecture (Page 5)",
        body: [
          "Checklist Thème 5 (validation) : brief 1 page clair, KPI dictionary cohérent, plan d’analyse exécutable, critères d’acceptation testables, ZIP généré par notebook, ZIP soumis et validé.",
          "Exercices obligatoires : exécuter le notebook, générer le ZIP, soumettre le ZIP.",
          "Le quiz est verrouillé tant que le ZIP n’est pas validé.",
        ],
      },
    ],
  },
];


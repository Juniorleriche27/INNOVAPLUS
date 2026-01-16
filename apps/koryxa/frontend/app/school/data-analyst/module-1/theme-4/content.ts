import type { ThemeArticle, ThemeMeta, ThemePage, ThemeVideo } from "../components/PagedThemeLayout";

export const theme4Meta: ThemeMeta = {
  title: "Thème 4 — Plan d'analyse, données, critères d'acceptation",
  module: "Module 1 — Cadrage & KPIs",
  readingTime: "45–60 min",
};

export const theme4Videos: ThemeVideo[] = [
  { title: "Comment être sûr de recueillir TOUS les besoins métier ?", youtubeId: "iGCnaZdoG_o", lang: "fr" },
  { title: "How to Gather Data Requirements That Deliver Real Business Value", youtubeId: "dD0b73Qjf6s", lang: "en" },
];

export const theme4Articles: ThemeArticle[] = [
  { label: "Étapes d'un projet BI", url: "https://www.myreport.fr/blog/etapes-projet-de-business-intelligence/" },
  { label: "Note de cadrage : méthode QQOQCP", url: "https://www.manager-go.com/gestion-de-projet/dossiers-methodes/realiser-une-note-de-cadrage" },
];

export const theme4Pages: ThemePage[] = [
  {
    title: "Plan d'analyse : cadrer les données et les attentes",
    sections: [
      {
        heading: "Pourquoi ce thème compte",
        body: [
          "Le scope est ton meilleur allié : ce que tu fais maintenant + ce que tu repousses en phase 2. Sans scope, tu promets tout et tu livres partiel.",
          "Pour chaque KPI ou question : quelles variables, où elles vivent (CRM, DB, Excel, API), qualité attendue, identifiant commun.",
          "Critères d'acceptation : dashboard < 5s, KPI alignés aux définitions validées, notebook reproductible.",
          "Livrable plan d'analyse : objectifs + KPIs, données sources, transformations, risques, limites, planning.",
        ],
      },
      {
        heading: "Objectifs concrets",
        body: [
          "Définir les données minimales nécessaires pour répondre aux questions prioritaires.",
          "Écrire un plan d'analyse clair (périmètre, risques, exclusions, phase 2).",
          "Poser des critères d'acceptation explicites pour éviter les malentendus.",
        ],
      },
      {
        heading: "Exemples terrain",
        body: ["KPI de rétention → besoin d'un user_id stable + date d'inscription pour calculer les cohortes sans doublons."],
      },
      {
        heading: "Checklist express",
        body: [
          "Plan d'analyse rédigé et partagé.",
          "Sources de données listées (avec propriétaires + accès).",
          "Critères d'acceptation posés et validés avec le métier.",
        ],
      },
    ],
  },
];

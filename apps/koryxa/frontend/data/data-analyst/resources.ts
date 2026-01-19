export type Module = {
  id: string;
  title: string;
  order: number;
  objectiveShort: string;
};

export type Theme = {
  id: string;
  moduleId: string;
  title: string;
  order: number;
};

export type Video = {
  id: string;
  moduleId: string;
  themeId: string;
  title: string;
  descriptionShort: string;
  language: "FR" | "EN";
  durationSec: number;
  source: "youtube";
  youtubeId: string;
  order: number;
  status: "active" | "unavailable";
  backupYoutubeId?: string;
};

export type Article = {
  id: string;
  moduleId: string;
  themeId: string;
  title: string;
  descriptionShort: string;
  language: "FR" | "EN";
  sourceName?: string;
  url: string;
  readingMinutes?: number;
  order: number;
  status: "active" | "unavailable";
  backupUrl?: string;
};

export const DATA_ANALYST_MODULES: Module[] = [
  { id: "module-1", title: "Module 1 — Cadrage & KPIs", order: 1, objectiveShort: "Cadrer un besoin et poser des KPI fiables." },
  { id: "module-2", title: "Module 2 — Collecte", order: 2, objectiveShort: "Collecter et structurer les données à partir de sources réelles." },
  { id: "module-3", title: "Module 3 — Nettoyage", order: 3, objectiveShort: "Nettoyer, contrôler la qualité et fiabiliser le dataset." },
  { id: "module-4", title: "Module 4 — Préparation", order: 4, objectiveShort: "Préparer les données pour l’analyse (jointures, agrégations, features)." },
  { id: "module-5", title: "Module 5 — EDA", order: 5, objectiveShort: "Explorer et comprendre les patterns, segments et anomalies." },
  { id: "module-6", title: "Module 6 — Reporting & Dashboards", order: 6, objectiveShort: "Restituer avec clarté (storytelling, dashboards, décisions)." },
  { id: "module-7", title: "Module 7 — Recommandations + capstone", order: 7, objectiveShort: "Transformer l’analyse en recommandations actionnables." },
];

export const DATA_ANALYST_THEMES: Theme[] = [
  // Module 1 (5 thèmes)
  { id: "m1t1", moduleId: "module-1", title: "Thème 1", order: 1 },
  { id: "m1t2", moduleId: "module-1", title: "Thème 2", order: 2 },
  { id: "m1t3", moduleId: "module-1", title: "Thème 3", order: 3 },
  { id: "m1t4", moduleId: "module-1", title: "Thème 4", order: 4 },
  { id: "m1t5", moduleId: "module-1", title: "Thème 5", order: 5 },
  // Module 2 (5 thèmes)
  { id: "m2t1", moduleId: "module-2", title: "Thème 1", order: 1 },
  { id: "m2t2", moduleId: "module-2", title: "Thème 2", order: 2 },
  { id: "m2t3", moduleId: "module-2", title: "Thème 3", order: 3 },
  { id: "m2t4", moduleId: "module-2", title: "Thème 4", order: 4 },
  { id: "m2t5", moduleId: "module-2", title: "Thème 5", order: 5 },
  // Module 3 (2 thèmes)
  { id: "m3t1", moduleId: "module-3", title: "Thème 1", order: 1 },
  { id: "m3t2", moduleId: "module-3", title: "Thème 2", order: 2 },
  // Modules 4–7 (placeholder: 3 thèmes chacun)
  { id: "m4t1", moduleId: "module-4", title: "Thème 1", order: 1 },
  { id: "m4t2", moduleId: "module-4", title: "Thème 2", order: 2 },
  { id: "m4t3", moduleId: "module-4", title: "Thème 3", order: 3 },
  { id: "m5t1", moduleId: "module-5", title: "Thème 1", order: 1 },
  { id: "m5t2", moduleId: "module-5", title: "Thème 2", order: 2 },
  { id: "m5t3", moduleId: "module-5", title: "Thème 3", order: 3 },
  { id: "m6t1", moduleId: "module-6", title: "Thème 1", order: 1 },
  { id: "m6t2", moduleId: "module-6", title: "Thème 2", order: 2 },
  { id: "m6t3", moduleId: "module-6", title: "Thème 3", order: 3 },
  { id: "m7t1", moduleId: "module-7", title: "Thème 1", order: 1 },
  { id: "m7t2", moduleId: "module-7", title: "Thème 2", order: 2 },
  { id: "m7t3", moduleId: "module-7", title: "Thème 3", order: 3 },
];

export const DATA_ANALYST_VIDEOS: Video[] = [];

export const DATA_ANALYST_ARTICLES: Article[] = [];

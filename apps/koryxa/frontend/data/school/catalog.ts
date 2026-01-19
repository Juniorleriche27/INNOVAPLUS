export type TrackId = "fundamental" | "data-analyst" | "data-engineer" | "data-science" | "machine-learning";

export type TrackModule = {
  id: string;
  title: string;
  order: number;
  href: string;
};

export type Track = {
  id: TrackId;
  label: string;
  modules: TrackModule[];
};

const fundamentalModules: TrackModule[] = [
  { id: "module-1", title: "Module 1 — Introduction", order: 1, href: "/school/parcours/fondamental/intro-metiers" },
  { id: "module-2", title: "Module 2 — Python data", order: 2, href: "/school/parcours/fondamental/python-data" },
  { id: "module-3", title: "Module 3 — Manipulation des données", order: 3, href: "/school/parcours/fondamental/manip-donnees" },
  { id: "module-4", title: "Module 4 — SQL bases", order: 4, href: "/school/parcours/fondamental/sql-bases" },
  { id: "module-5", title: "Module 5 — Visualisation", order: 5, href: "/school/parcours/fondamental/visualisation" },
  { id: "module-6", title: "Module 6 — Projet synthèse", order: 6, href: "/school/parcours/fondamental/projet-synthese" },
];

const dataAnalystModules: TrackModule[] = [
  { id: "module-1", title: "Module 1 — Cadrage & KPIs", order: 1, href: "/school/data-analyst/module-1/videos" },
  { id: "module-2", title: "Module 2 — Collecte", order: 2, href: "/school/data-analyst/module-2/videos" },
  { id: "module-3", title: "Module 3 — Nettoyage", order: 3, href: "/school/data-analyst/module-3/videos" },
  { id: "module-4", title: "Module 4 — Préparation", order: 4, href: "/school/data-analyst/module-4/videos" },
  { id: "module-5", title: "Module 5 — EDA", order: 5, href: "/school/data-analyst/module-5/videos" },
  { id: "module-6", title: "Module 6 — Reporting & Dashboards", order: 6, href: "/school/data-analyst/module-6/videos" },
  { id: "module-7", title: "Module 7 — Recommandations + capstone", order: 7, href: "/school/data-analyst/module-7/videos" },
];

const dataEngineerModules: TrackModule[] = [
  { id: "module-1", title: "Module 1", order: 1, href: "/school/data-engineer/module-1/videos" },
  { id: "module-2", title: "Module 2", order: 2, href: "/school/data-engineer/module-2/videos" },
];

const dataScienceModules: TrackModule[] = [{ id: "module-1", title: "Module 1", order: 1, href: "/school/data-science/module-1/videos" }];

const machineLearningModules: TrackModule[] = [
  { id: "module-1", title: "Module 1", order: 1, href: "/school/machine-learning/module-1/videos" },
];

export const SCHOOL_TRACKS: Track[] = [
  { id: "fundamental", label: "Fondamental", modules: fundamentalModules },
  { id: "data-analyst", label: "Data Analyst", modules: dataAnalystModules },
  { id: "data-engineer", label: "Data Engineer", modules: dataEngineerModules },
  { id: "data-science", label: "Data Scientist", modules: dataScienceModules },
  { id: "machine-learning", label: "Machine Learning", modules: machineLearningModules },
];

export function getTrack(trackId: TrackId): Track | undefined {
  return SCHOOL_TRACKS.find((t) => t.id === trackId);
}


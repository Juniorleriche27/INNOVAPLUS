export type SchoolTrackId =
  | "data-analyst"
  | "data-engineer"
  | "data-scientist"
  | "machine-learning-engineer";

export type LessonLink = {
  title: string;
  href: string;
};

export type CourseTheme = {
  title: string;
  lessons: LessonLink[];
};

export type CourseModule = {
  index: number;
  title: string;
  href: string;
  description: string;
  themes: CourseTheme[];
};

export type TrackMeta = {
  id: SchoolTrackId;
  label: string;
  href: string;
};

export const SCHOOL_TRACKS: TrackMeta[] = [
  { id: "data-analyst", label: "Data Analyst", href: "/school/data-analyst" },
  { id: "data-engineer", label: "Data Engineer", href: "/school/data-engineer" },
  { id: "data-scientist", label: "Data Scientist", href: "/school/data-scientist" },
  { id: "machine-learning-engineer", label: "ML Engineer", href: "/school/machine-learning-engineer" },
];

export const DATA_ENGINEER_MODULES: CourseModule[] = [
  {
    index: 1,
    title: "Module 1 — Fondations data engineering",
    href: "/school/data-engineer",
    description: "Pipelines, SQL, formats, ingestion (bientôt).",
    themes: [],
  },
  {
    index: 2,
    title: "Module 2 — Orchestration & qualité",
    href: "/school/data-engineer",
    description: "Airflow, tests, observabilité (bientôt).",
    themes: [],
  },
];

export const DATA_SCIENTIST_MODULES: CourseModule[] = [
  {
    index: 1,
    title: "Module 1 — Fondations data science",
    href: "/school/data-scientist",
    description: "EDA, stats, modèles (bientôt).",
    themes: [],
  },
];

export const ML_ENGINEER_MODULES: CourseModule[] = [
  {
    index: 1,
    title: "Module 1 — ML Engineering",
    href: "/school/machine-learning-engineer",
    description: "MLOps, déploiement, monitoring (bientôt).",
    themes: [],
  },
];


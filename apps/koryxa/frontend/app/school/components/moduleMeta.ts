import { DATA_ANALYST_MODULES, DATA_ANALYST_THEMES } from "@/data/data-analyst/resources";

export type TrackKey = "data-analyst" | "data-engineer" | "data-science" | "machine-learning";

type ModuleMeta = {
  title: string;
  objectiveShort: string;
  themesCount: number;
};

const OTHER_TRACKS: Record<Exclude<TrackKey, "data-analyst">, Array<{ title: string; objectiveShort: string; themesCount: number }>> = {
  "data-engineer": [
    { title: "Module 1 — Fondations data engineering", objectiveShort: "Construire des bases solides pour des pipelines fiables.", themesCount: 3 },
    { title: "Module 2 — Orchestration & qualité", objectiveShort: "Automatiser, tester et monitorer les flux de données.", themesCount: 3 },
  ],
  "data-science": [
    { title: "Module 1 — Fondations data science", objectiveShort: "Explorer, modéliser et évaluer proprement.", themesCount: 3 },
  ],
  "machine-learning": [
    { title: "Module 1 — ML Engineering", objectiveShort: "Déployer et fiabiliser des modèles en production.", themesCount: 3 },
  ],
};

export function getModuleMeta(track: TrackKey, moduleNumber: number): ModuleMeta {
  if (track === "data-analyst") {
    const mod = DATA_ANALYST_MODULES.find((m) => m.order === moduleNumber);
    const themesCount = DATA_ANALYST_THEMES.filter((t) => t.moduleId === `module-${moduleNumber}`).length;
    return {
      title: mod?.title ?? `Module ${moduleNumber}`,
      objectiveShort: mod?.objectiveShort ?? "Objectif du module (à définir).",
      themesCount: Math.max(themesCount, 0),
    };
  }
  const list = OTHER_TRACKS[track];
  const idx = Math.min(Math.max(moduleNumber, 1), list.length) - 1;
  return list[idx] ?? { title: `Module ${moduleNumber}`, objectiveShort: "Objectif du module (à définir).", themesCount: 0 };
}


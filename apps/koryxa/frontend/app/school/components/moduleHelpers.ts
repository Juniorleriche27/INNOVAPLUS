import type { TrackId } from "@/data/school/catalog";
import {
  DATA_ANALYST_ARTICLES,
  DATA_ANALYST_MODULES,
  DATA_ANALYST_THEMES,
  DATA_ANALYST_VIDEOS,
} from "@/data/data-analyst/resources";

export function normalizeInlineSpacing(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function getThemeLabels(trackId: TrackId, moduleId: string): string[] {
  if (trackId === "data-analyst") {
    const themes = DATA_ANALYST_THEMES.filter((t) => t.moduleId === moduleId).sort((a, b) => a.order - b.order);
    return themes.map((t) => normalizeInlineSpacing(t.title));
  }
  if (trackId === "data-engineer" || trackId === "data-science" || trackId === "machine-learning") {
    return ["Thème 1", "Thème 2", "Thème 3"];
  }
  return [];
}

export function getModuleObjective(trackId: TrackId, moduleId: string): string {
  if (trackId === "data-analyst") {
    return DATA_ANALYST_MODULES.find((m) => m.id === moduleId)?.objectiveShort ?? "Objectif du module (court)";
  }
  return "Objectif du module (court)";
}

export function hasAnyVideos(trackId: TrackId, moduleId: string): boolean {
  if (trackId === "data-analyst") {
    return DATA_ANALYST_VIDEOS.some((v) => v.moduleId === moduleId && v.status === "active");
  }
  return false;
}

export function hasAnyArticles(trackId: TrackId, moduleId: string): boolean {
  if (trackId === "data-analyst") {
    return DATA_ANALYST_ARTICLES.some((a) => a.moduleId === moduleId && a.status === "active");
  }
  return false;
}


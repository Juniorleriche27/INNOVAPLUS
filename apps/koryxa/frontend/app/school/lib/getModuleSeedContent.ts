import "server-only";

import module1Articles from "@/data/school/data-analyst/module-1/module-1.articles.json";
import module1Videos from "@/data/school/data-analyst/module-1/module-1.videos.json";
import module2Articles from "@/data/school/data-analyst/module-2/articles.json";
import module2Videos from "@/data/school/data-analyst/module-2/videos.json";
import type { TrackId } from "@/data/school/catalog";

export type SeedVideo = {
  id?: string;
  theme: number;
  themeTitle: string;
  lang: "fr" | "en";
  youtubeId: string;
  title: string;
  recommended?: boolean;
  rank?: number;
  order?: number;
};

export type SeedArticle = {
  id?: string;
  theme: number;
  themeTitle: string;
  title: string;
  url: string;
  lang?: "fr" | "en";
  order?: number;
};

export type ModuleSeedContent = {
  moduleTitle?: string;
  videos: SeedVideo[];
  articles: SeedArticle[];
};

type Module1VideosJson = typeof module1Videos;
type Module1ArticlesJson = typeof module1Articles;
type Module2VideosJson = typeof module2Videos;
type Module2ArticlesJson = typeof module2Articles;

function normalizeModuleTitle(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  if ("moduleTitle" in data && typeof (data as { moduleTitle?: unknown }).moduleTitle === "string") {
    return (data as { moduleTitle: string }).moduleTitle;
  }
  if ("module" in data && typeof (data as { module?: unknown }).module === "string") {
    return (data as { module: string }).module;
  }
  return undefined;
}

function normalizeVideos(data: Module1VideosJson | Module2VideosJson): SeedVideo[] {
  if ("videos" in data && Array.isArray(data.videos)) {
    return data.videos.map((v) => ({
      id: (v as { id?: string }).id,
      theme: v.theme,
      themeTitle: v.themeTitle,
      lang: v.lang,
      youtubeId: v.youtubeId,
      title: v.title,
      recommended: (v as { recommended?: boolean }).recommended ?? true,
      rank: (v as { rank?: number }).rank,
      order: (v as { order?: number }).order,
    }));
  }
  return [];
}

function normalizeArticles(data: Module1ArticlesJson | Module2ArticlesJson): SeedArticle[] {
  if ("articles" in data && Array.isArray(data.articles)) {
    return data.articles.map((a) => ({
      id: (a as { id?: string }).id,
      theme: a.theme,
      themeTitle: a.themeTitle,
      title: a.title,
      url: a.url,
      lang: (a as { lang?: "fr" | "en" }).lang,
      order: (a as { order?: number }).order,
    }));
  }
  return [];
}

const SEED: Partial<Record<TrackId, Partial<Record<string, ModuleSeedContent>>>> = {
  "data-analyst": {
    "module-1": {
      moduleTitle: normalizeModuleTitle(module1Videos) ?? normalizeModuleTitle(module1Articles),
      videos: normalizeVideos(module1Videos),
      articles: normalizeArticles(module1Articles),
    },
    "module-2": {
      moduleTitle: normalizeModuleTitle(module2Videos) ?? normalizeModuleTitle(module2Articles),
      videos: normalizeVideos(module2Videos),
      articles: normalizeArticles(module2Articles),
    },
  },
};

export function getModuleSeedContent(trackId: TrackId, moduleId: string): ModuleSeedContent {
  return SEED[trackId]?.[moduleId] ?? { videos: [], articles: [] };
}

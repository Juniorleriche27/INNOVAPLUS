import "server-only";

import module1Articles from "@/data/school/data-analyst/module-1/module-1.articles.json";
import module1Videos from "@/data/school/data-analyst/module-1/module-1.videos.json";
import module2Articles from "@/data/school/data-analyst/module-2/articles.json";
import module2Videos from "@/data/school/data-analyst/module-2/videos.json";
import module3Articles from "@/data/school/data-analyst/module-3/articles.json";
import module3Videos from "@/data/school/data-analyst/module-3/videos.json";
import module4Articles from "@/data/school/data-analyst/module-4/articles.json";
import module4Videos from "@/data/school/data-analyst/module-4/videos.json";
import module5Articles from "@/data/school/data-analyst/module-5/articles.json";
import module5Videos from "@/data/school/data-analyst/module-5/videos.json";
import type { TrackId } from "@/data/school/catalog";

const MODULE_3_THEME_TITLES: Record<number, string> = {
  1: "Valeurs manquantes & nettoyage",
  2: "Doublons & unicité",
  3: "Types & dates",
  4: "Valeurs aberrantes (outliers)",
  5: "Qualité & validation",
};

const MODULE_5_THEME_TITLES: Record<number, string> = {
  1: "EDA workflow (pandas)",
  2: "Visualisations (Matplotlib)",
  3: "Corrélations (Seaborn)",
  4: "Segmentation (groupby)",
  5: "Rapport automatique (profiling)",
};

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
type Module3VideosJson = typeof module3Videos;
type Module3ArticlesJson = typeof module3Articles;
type Module4VideosJson = typeof module4Videos;
type Module4ArticlesJson = typeof module4Articles;
type Module5VideosJson = typeof module5Videos;
type Module5ArticlesJson = typeof module5Articles;

function parseThemeString(theme: string): { themeIndex: number; themeTitle: string } | null {
  const match = /^\s*Th[èe]me\s+(\d+)\s*—\s*(.+?)\s*$/.exec(theme);
  if (!match) return null;
  const themeIndex = Number(match[1]);
  if (!Number.isFinite(themeIndex)) return null;
  return { themeIndex, themeTitle: match[2] };
}

function normalizeModuleTitle(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  if ("moduleTitle" in data && typeof (data as { moduleTitle?: unknown }).moduleTitle === "string") {
    return (data as { moduleTitle: string }).moduleTitle;
  }
  if (
    "module" in data &&
    typeof (data as { module?: unknown }).module === "object" &&
    (data as { module: { title?: unknown } }).module &&
    typeof (data as { module: { title?: unknown } }).module.title === "string"
  ) {
    return (data as { module: { title: string } }).module.title;
  }
  if ("module" in data && typeof (data as { module?: unknown }).module === "string") {
    return (data as { module: string }).module;
  }
  return undefined;
}

function normalizeVideos(
  data: Module1VideosJson | Module2VideosJson | Module3VideosJson | Module4VideosJson | Module5VideosJson,
): SeedVideo[] {
  if (Array.isArray(data)) {
    return data.map((v, idx) => ({
      id: (v as { id?: string }).id,
      theme: v.theme,
      themeTitle: MODULE_3_THEME_TITLES[v.theme] ?? `Thème ${v.theme}`,
      lang: v.lang,
      youtubeId: v.youtubeId,
      title: v.title,
      recommended: (v as { recommended?: boolean }).recommended ?? true,
      order: (v as { order?: number }).order ?? idx + 1,
    }));
  }

  if ("videos" in data && Array.isArray(data.videos)) {
    return data.videos.map((v, idx) => ({
      id: (v as { id?: string }).id,
      theme:
        typeof (v as { theme?: unknown }).theme === "string"
          ? parseThemeString((v as { theme: string }).theme)?.themeIndex ?? 0
          : v.theme,
      themeTitle:
        typeof (v as { theme?: unknown }).theme === "string"
          ? parseThemeString((v as { theme: string }).theme)?.themeTitle ?? (v as { theme: string }).theme
          : (v as { themeTitle?: string }).themeTitle ??
            MODULE_3_THEME_TITLES[v.theme] ??
            MODULE_5_THEME_TITLES[v.theme] ??
            `Thème ${v.theme}`,
      lang: v.lang,
      youtubeId: v.youtubeId,
      title: v.title,
      recommended: (v as { recommended?: boolean }).recommended ?? true,
      rank: (v as { rank?: number }).rank,
      order: (v as { recommendedOrder?: number }).recommendedOrder ?? (v as { order?: number }).order ?? idx + 1,
    }));
  }

  return [];
}

function normalizeArticles(
  data: Module1ArticlesJson | Module2ArticlesJson | Module3ArticlesJson | Module4ArticlesJson | Module5ArticlesJson,
): SeedArticle[] {
  if (Array.isArray(data)) {
    return data.flatMap((block) =>
      block.articles.map((a, idx) => ({
        theme: block.theme,
        themeTitle: MODULE_3_THEME_TITLES[block.theme] ?? `Thème ${block.theme}`,
        title: a.title,
        url: a.url,
        order: idx + 1,
      })),
    );
  }

  if ("articles" in data && Array.isArray(data.articles)) {
    return data.articles.map((a, idx) => ({
      id: (a as { id?: string }).id,
      theme:
        typeof (a as { theme?: unknown }).theme === "string"
          ? parseThemeString((a as { theme: string }).theme)?.themeIndex ?? 0
          : a.theme,
      themeTitle:
        typeof (a as { theme?: unknown }).theme === "string"
          ? parseThemeString((a as { theme: string }).theme)?.themeTitle ?? (a as { theme: string }).theme
          : (a as { themeTitle?: string }).themeTitle ??
            MODULE_3_THEME_TITLES[a.theme] ??
            MODULE_5_THEME_TITLES[a.theme] ??
            `Thème ${a.theme}`,
      title: a.title,
      url: a.url,
      lang: (a as { lang?: "fr" | "en" }).lang,
      order: (a as { order?: number }).order ?? idx + 1,
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
    "module-3": {
      moduleTitle: "Module 3 — Nettoyage",
      videos: normalizeVideos(module3Videos),
      articles: normalizeArticles(module3Articles),
    },
    "module-4": {
      moduleTitle: normalizeModuleTitle(module4Videos) ?? normalizeModuleTitle(module4Articles),
      videos: normalizeVideos(module4Videos),
      articles: normalizeArticles(module4Articles),
    },
    "module-5": {
      moduleTitle: normalizeModuleTitle(module5Videos) ?? normalizeModuleTitle(module5Articles),
      videos: normalizeVideos(module5Videos),
      articles: normalizeArticles(module5Articles),
    },
  },
};

export function getModuleSeedContent(trackId: TrackId, moduleId: string): ModuleSeedContent {
  return SEED[trackId]?.[moduleId] ?? { videos: [], articles: [] };
}

import type { CourseModule } from "@/app/school/catalog";
import { themes as module1Themes } from "./module-1/content";
import { theme1Pages } from "./module-1/theme-1/content";
import { theme2Pages } from "./module-1/theme-2/content";
import { theme3Pages } from "./module-1/theme-3/content";
import { theme4Pages } from "./module-1/theme-4/content";
import { theme5Pages } from "./module-1/theme-5/content";
import { module2Theme2Pages } from "./module-2/theme-2/content";

type ThemePageLike = { title: string };

function buildPagedLessons(base: string, pages: ThemePageLike[]) {
  return pages.map((page, idx) => ({
    title: `Page ${idx + 1} — ${page.title}`,
    href: `${base}/page/${idx + 1}`,
  }));
}

export const DATA_ANALYST_MODULES: CourseModule[] = [
  {
    index: 1,
    title: "Module 1 — Cadrage & KPIs",
    href: "/school/data-analyst/module-1",
    description: "Cadrer un besoin, definir KPIs, parties prenantes, validation + preuves.",
    themes: module1Themes.map((theme) => {
      const base = `/school/data-analyst/module-1/${theme.slug}`;
      const pages =
        theme.slug === "theme-1"
          ? theme1Pages
          : theme.slug === "theme-2"
            ? theme2Pages
            : theme.slug === "theme-3"
              ? theme3Pages
              : theme.slug === "theme-4"
                ? theme4Pages
                : theme.slug === "theme-5"
                  ? theme5Pages
                  : [{ title: theme.title }];
      return { title: theme.title, lessons: buildPagedLessons(base, pages) };
    }),
  },
  {
    index: 2,
    title: "Module 2 — Collecte",
    href: "/school/data-analyst/module-2",
    description: "Collecter les donnees (Excel/SQL/API) et preparer les sources.",
    themes: [
      {
        title: "Thème 1 — Panorama des sources & plan de collecte",
        lessons: [
          {
            title: "Page 1 — Lecture",
            href: "/school/data-analyst/module-2/theme-1/page/1",
          },
        ],
      },
      {
        title: "Thème 2 — CSV/Excel + Power Query",
        lessons: buildPagedLessons("/school/data-analyst/module-2/theme-2", module2Theme2Pages),
      },
      {
        title: "Thème 3 — SQL extraction",
        lessons: [
          {
            title: "Page 1 — Lecture",
            href: "/school/data-analyst/module-2/theme-3/page/1",
          },
        ],
      },
      {
        title: "Thème 4 — APIs + Python (requests)",
        lessons: [
          {
            title: "Page 1 — Lecture",
            href: "/school/data-analyst/module-2/theme-4/page/1",
          },
        ],
      },
      {
        title: "Thème 5 — Capstone collecte",
        lessons: [
          {
            title: "Page 1 — Lecture",
            href: "/school/data-analyst/module-2/theme-5/page/1",
          },
        ],
      },
    ],
  },
  {
    index: 3,
    title: "Module 3 — Nettoyage",
    href: "/school/data-analyst/module-3",
    description: "Nettoyage, valeurs manquantes, doublons, qualite et regles.",
    themes: [
      {
        title: "Thème 1 — Profilage & valeurs manquantes",
        lessons: [
          {
            title: "Page 1 — Lecture",
            href: "/school/data-analyst/module-3/theme-1/page/1",
          },
        ],
      },
    ],
  },
  {
    index: 4,
    title: "Module 4 — Preparation",
    href: "/school/data-analyst/module-4",
    description: "Jointures, aggregations, features et dataset final.",
    themes: [],
  },
  {
    index: 5,
    title: "Module 5 — EDA",
    href: "/school/data-analyst/module-5",
    description: "Stats descriptives + visualisations pour comprendre le dataset.",
    themes: [],
  },
  {
    index: 6,
    title: "Module 6 — Reporting & Dashboards",
    href: "/school/data-analyst/module-6",
    description: "Restitution, dashboards et prise de decision.",
    themes: [],
  },
  {
    index: 7,
    title: "Module 7 — Recommandations + capstone",
    href: "/school/data-analyst/module-7",
    description: "Recommandations, limites, decision et projet final.",
    themes: [],
  },
];

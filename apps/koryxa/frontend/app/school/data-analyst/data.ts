import { themes as module1Themes } from "./module-1/content";

export type DataAnalystModule = {
  index: number;
  title: string;
  href: string;
  description: string;
  themes: Array<{ title: string; href: string; match?: string }>;
};

export const DATA_ANALYST_MODULES: DataAnalystModule[] = [
  {
    index: 1,
    title: "Module 1 — Cadrage & KPIs",
    href: "/school/data-analyst/module-1",
    description: "Cadrer un besoin, definir KPIs, parties prenantes, validation + preuves.",
    themes: module1Themes.map((theme) => {
      const href =
        theme.slug === "theme-1"
          ? "/school/data-analyst/module-1/theme-1/page/1"
          : theme.slug === "theme-2"
            ? "/school/data-analyst/module-1/theme-2/page/1"
            : theme.slug === "theme-3"
              ? "/school/data-analyst/module-1/theme-3/page/1"
              : theme.slug === "theme-5"
                ? "/school/data-analyst/module-1/theme-5/page/1"
              : `/school/data-analyst/module-1/${theme.slug}`;
      const match = href.replace(/\/page\/1$/, "");
      return { title: theme.title, href, match };
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
        href: "/school/data-analyst/module-2/theme-1",
      },
      {
        title: "Thème 2 — CSV/Excel + Power Query",
        href: "/school/data-analyst/module-2/theme-2/page/1",
        match: "/school/data-analyst/module-2/theme-2",
      },
      {
        title: "Thème 3 — SQL extraction",
        href: "/school/data-analyst/module-2/theme-3",
      },
      {
        title: "Thème 5 — Capstone collecte",
        href: "/school/data-analyst/module-2/theme-5",
      },
    ],
  },
  {
    index: 3,
    title: "Module 3 — Nettoyage",
    href: "/school/data-analyst/module-3",
    description: "Nettoyage, valeurs manquantes, doublons, qualite et regles.",
    themes: [],
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

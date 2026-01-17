"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";
import { themes as module1Themes } from "./module-1/content";

type Module1Status = {
  notebooks_validated?: boolean;
  quiz_passed?: boolean;
};

type Module2Status = {
  validated?: boolean;
};

type ModuleCard = {
  index: number;
  title: string;
  href: string;
  description: string;
  themes: Array<{ title: string; href: string }>;
};

const MODULES: ModuleCard[] = [
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
      return { title: theme.title, href };
    }),
  },
  {
    index: 2,
    title: "Module 2 — Collecte",
    href: "/school/data-analyst/module-2",
    description: "Collecter les donnees (Excel/SQL/API) et preparer les sources.",
    themes: [
      { title: "Thème 1 — Panorama des sources & plan de collecte", href: "/school/data-analyst/module-2/theme-1" },
      { title: "Thème 2 — CSV/Excel + Power Query", href: "/school/data-analyst/module-2/theme-2/page/1" },
      { title: "Thème 3 — SQL extraction", href: "/school/data-analyst/module-2/theme-3" },
      { title: "Thème 5 — Capstone collecte", href: "/school/data-analyst/module-2/theme-5" },
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

export default function DataAnalystLandingPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "unauth" | "error">("loading");
  const [module1, setModule1] = useState<Module1Status>({});
  const [module2, setModule2] = useState<Module2Status>({});
  const [activeModule, setActiveModule] = useState<number>(1);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/status`, { credentials: "include" });
        if (resp.status === 401) {
          setStatus("unauth");
          return;
        }
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setStatus("ready");
          setStatusNote("Statut indisponible pour le moment. Mode lecture libre activé.");
          return;
        }
        setModule1({ notebooks_validated: !!data?.notebooks_validated, quiz_passed: !!data?.quiz_passed });
        try {
          const m2resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-5/status`, { credentials: "include" });
          const m2data = await m2resp.json().catch(() => ({}));
          if (m2resp.ok) setModule2({ validated: !!m2data?.validated });
        } catch {
          // ignore module 2 status errors
        }
        setStatus("ready");
      } catch {
        setStatus("ready");
        setStatusNote("Statut indisponible pour le moment. Mode lecture libre activé.");
      }
    }
    load();
  }, []);

  const module1Completed = useMemo(() => Boolean(module1?.notebooks_validated && module1?.quiz_passed), [module1]);
  const module2Completed = useMemo(() => Boolean(module2?.validated), [module2]);

  function unlocked(moduleIndex: number): boolean {
    if (moduleIndex <= 1) return true;
    if (moduleIndex === 2) return module1Completed;
    return module2Completed;
  }

  const active = MODULES.find((m) => m.index === activeModule) || MODULES[0];
  const activeUnlocked = unlocked(active.index);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Certificat Data Analyst</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">Dashboard étudiant</h1>
            <p className="mt-2 text-sm text-slate-600">
              Menu déroulant en haut pour choisir un module. Le module suivant se déverrouille après validation du module précédent.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Module</label>
            <select
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              value={active.index}
              onChange={(e) => setActiveModule(Number(e.target.value))}
            >
              {MODULES.map((m) => (
                <option key={m.index} value={m.index} disabled={!unlocked(m.index)}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {status === "unauth" ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Connecte-toi pour suivre ta progression et déverrouiller les modules.
          </div>
        ) : null}
        {statusNote ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {statusNote}
          </div>
        ) : null}
        {status === "ready" ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 px-3 py-1">
              Module 1: {module1Completed ? "validé" : "à valider"}
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1">
              Module 2: {module2Completed ? "validé" : "à valider"}
            </span>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Module sélectionné</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">{active.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{active.description}</p>
            </div>
            {!activeUnlocked ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                Verrouillé
              </span>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {activeUnlocked ? (
              <Link className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href={active.href}>
                Ouvrir le module
              </Link>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
                Valide le module précédent pour déverrouiller
              </span>
            )}
            {active.themes.length > 0 ? (
              <Link className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href={active.themes[0].href}>
                Commencer le premier thème
              </Link>
            ) : null}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900">Thèmes du module</h3>
            {active.themes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Contenu en préparation pour ce module.</p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {active.themes.map((theme) => (
                  <div key={theme.href} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                    <p className="text-sm font-semibold text-slate-900">{theme.title}</p>
                    <Link href={theme.href} className="mt-3 inline-flex text-sm font-semibold text-sky-700">
                      Ouvrir le cours →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Leçon en cours</h3>
            {active.themes.length > 0 ? (
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-900">{active.themes[0].title}</p>
                <p className="mt-2 text-sm text-slate-600">Reprendre ta progression sur le thème en cours.</p>
                <Link className="mt-3 inline-flex text-sm font-semibold text-sky-700" href={active.themes[0].href}>
                  Continuer →
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Aucune leçon disponible pour ce module.</p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Règle de progression</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tu peux lire librement les thèmes, mais tu dois valider le module précédent pour accéder au module suivant.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Modules disponibles</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {MODULES.map((m) => (
                <li key={m.index} className="flex items-center justify-between gap-2">
                  <span>{m.title}</span>
                  <span className="text-xs text-slate-500">{unlocked(m.index) ? "Ouvert" : "Verrouillé"}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

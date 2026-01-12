"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Module1Status = {
  notebooks_validated?: boolean;
  quiz_passed?: boolean;
};

type ModuleCard = {
  index: number;
  title: string;
  href: string;
  description: string;
};

const MODULES: ModuleCard[] = [
  {
    index: 1,
    title: "Module 1 — Cadrage & KPIs",
    href: "/school/data-analyst/module-1",
    description: "Cadrer un besoin, definir KPIs, parties prenantes, validation + preuves.",
  },
  {
    index: 2,
    title: "Module 2 — Collecte",
    href: "/school/data-analyst/module-2",
    description: "Collecter les donnees (Excel/SQL/API) et preparer les sources.",
  },
  {
    index: 3,
    title: "Module 3 — Nettoyage",
    href: "/school/data-analyst/module-3",
    description: "Nettoyage, valeurs manquantes, doublons, qualite et regles.",
  },
  {
    index: 4,
    title: "Module 4 — Preparation",
    href: "/school/data-analyst/module-4",
    description: "Jointures, aggregations, features et dataset final.",
  },
  {
    index: 5,
    title: "Module 5 — EDA",
    href: "/school/data-analyst/module-5",
    description: "Stats descriptives + visualisations pour comprendre le dataset.",
  },
  {
    index: 6,
    title: "Module 6 — Reporting & Dashboards",
    href: "/school/data-analyst/module-6",
    description: "Restitution, dashboards et prise de decision.",
  },
  {
    index: 7,
    title: "Module 7 — Recommandations + capstone",
    href: "/school/data-analyst/module-7",
    description: "Recommandations, limites, decision et projet final.",
  },
];

export default function DataAnalystLandingPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "unauth" | "error">("loading");
  const [module1, setModule1] = useState<Module1Status>({});

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/status`, { credentials: "include" });
        if (resp.status === 401) {
          setStatus("unauth");
          return;
        }
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error("status");
        setModule1({ notebooks_validated: !!data?.notebooks_validated, quiz_passed: !!data?.quiz_passed });
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    }
    load();
  }, []);

  const module1Completed = useMemo(() => Boolean(module1?.notebooks_validated && module1?.quiz_passed), [module1]);

  function unlocked(moduleIndex: number): boolean {
    if (moduleIndex <= 1) return true;
    return module1Completed; // V1: gate everything after Module 1
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Certificat Data Analyst</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Tableau des modules</h1>
        <p className="mt-2 text-sm text-slate-600">
          Progression lineaire : tu debloques le module suivant seulement apres validation du module precedent.
        </p>
        {status === "unauth" ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Connecte-toi pour suivre ta progression et debloquer les modules.
          </div>
        ) : null}
        {status === "error" ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Impossible de charger ton statut pour le moment.
          </div>
        ) : null}
        {status === "ready" ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 px-3 py-1">
              Module 1: {module1Completed ? "valide" : "a valider"}
            </span>
            {!module1Completed ? (
              <span className="rounded-full border border-slate-200 px-3 py-1">
                Pour debloquer: notebooks + quiz Module 1
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {MODULES.map((m) => {
          const isUnlocked = unlocked(m.index);
          return (
            <div key={m.index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                {!isUnlocked ? (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    Verrouille
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-600">{m.description}</p>
              <div className="mt-4">
                {isUnlocked ? (
                  <Link className="inline-flex text-sm font-semibold text-sky-700" href={m.href}>
                    Ouvrir →
                  </Link>
                ) : (
                  <span className="inline-flex text-sm font-semibold text-slate-400">Debloquer en validant le Module 1</span>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}


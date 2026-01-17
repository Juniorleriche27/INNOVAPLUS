"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { INNOVA_API_BASE } from "@/lib/env";
import { DATA_ANALYST_MODULES } from "./data";

type Module1Status = {
  notebooks_validated?: boolean;
  quiz_passed?: boolean;
};

type Module2Status = {
  validated?: boolean;
};

const MODULES = DATA_ANALYST_MODULES;

function DataAnalystDashboard() {
  const [status, setStatus] = useState<"loading" | "ready" | "unauth" | "error">("loading");
  const [module1, setModule1] = useState<Module1Status>({});
  const [module2, setModule2] = useState<Module2Status>({});
  const [activeModule, setActiveModule] = useState<number>(1);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const searchParams = useSearchParams();

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

  useEffect(() => {
    const raw = searchParams.get("module");
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= MODULES.length) {
      setActiveModule(parsed);
    }
  }, [searchParams]);

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
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Certificat Data Analyst</p>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard étudiant</h1>
          <p className="text-sm text-slate-600">
            Avance module par module, puis choisis un thème dans la navigation de gauche pour démarrer la lecture.
          </p>
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
        
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Continuer</h3>
          {active.themes.length > 0 ? (
            <div className="mt-3">
              <p className="text-base font-semibold text-slate-900">{active.themes[0].title}</p>
              <p className="mt-2 text-sm text-slate-600">Reprendre la leçon en cours et garder le rythme.</p>
              <Link className="mt-3 inline-flex text-sm font-semibold text-sky-700" href={active.themes[0].href}>
                Continuer →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">Aucune leçon disponible pour ce module.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="mt-5 flex flex-wrap gap-3">
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
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Apercu des themes</h3>
        {active.themes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Contenu en préparation pour ce module.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {active.themes.slice(0, 3).map((theme) => (
              <div key={theme.href} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                <p className="text-sm font-semibold text-slate-900">{theme.title}</p>
                <Link href={theme.href} className="mt-3 inline-flex text-sm font-semibold text-sky-700">
                  Ouvrir le cours →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function DataAnalystLandingPage() {
  return (
    <Suspense fallback={<div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">Chargement…</div>}>
      <DataAnalystDashboard />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { INNOVA_API_BASE } from "@/lib/env";
import { DATA_ANALYST_MODULES } from "./data";

const MODULES = DATA_ANALYST_MODULES;

function DataAnalystDashboard() {
  const [status, setStatus] = useState<"loading" | "ready" | "unauth" | "error">("loading");
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
        await resp.json().catch(() => ({}));
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

  const active = MODULES.find((m) => m.index === activeModule) || MODULES[0];
  const firstLesson = active.themes?.[0]?.lessons?.[0] ?? null;

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
            Connecte-toi pour suivre ta progression.
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
          {firstLesson ? (
            <div className="mt-3">
              <p className="text-base font-semibold text-slate-900">{active.themes[0].title}</p>
              <p className="mt-2 text-sm text-slate-600">Reprendre la leçon en cours et garder le rythme.</p>
              <Link className="mt-3 inline-flex text-sm font-semibold text-sky-700" href={firstLesson.href}>
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
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href={active.href}>
              Ouvrir le module
            </Link>
            {firstLesson ? (
              <Link className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href={firstLesson.href}>
                Commencer la première leçon
              </Link>
            ) : null}
            <Link className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href="/school/data-analyst/planning">
              Mon planning d’apprentissage
            </Link>
          </div>
        </div>
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

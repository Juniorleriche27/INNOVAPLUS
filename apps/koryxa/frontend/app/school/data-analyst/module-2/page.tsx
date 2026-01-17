"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

export default function DataAnalystModule2Placeholder() {
  const [module1, setModule1] = useState<{ notebooks_validated?: boolean; quiz_passed?: boolean }>({});
  const module1Completed = useMemo(() => Boolean(module1?.notebooks_validated && module1?.quiz_passed), [module1]);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/status`, { credentials: "include" });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) setModule1({ notebooks_validated: !!data?.notebooks_validated, quiz_passed: !!data?.quiz_passed });
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  if (!module1Completed) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-800">
        Module 2 verrouille. Valide d'abord le Module 1 (notebooks + quiz).
        <div className="mt-4">
          <Link className="font-semibold text-sky-700" href="/school/data-analyst/module-1">
            Aller au Module 1 →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Certificat Data Analyst</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Module 2 — Collecte</h1>
        <p className="mt-2 text-sm text-slate-600">
          Objectif : identifier les sources, produire un inventaire, un data mapping minimal et un plan de collecte reproductible.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Choisis une leçon dans la sidebar (Sommaire du module) pour démarrer la lecture.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            href="/school/data-analyst/module-2/theme-1/page/1"
          >
            Commencer la lecture
          </Link>
        </div>
      </section>
    </div>
  );
}

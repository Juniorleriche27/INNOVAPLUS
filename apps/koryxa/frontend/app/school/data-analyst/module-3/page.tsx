"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

function useModule1Completed() {
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
  return module1Completed;
}

export default function DataAnalystModule3Placeholder() {
  const module1Completed = useModule1Completed();
  if (!module1Completed) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-800">
        Module 3 verrouille. Valide d'abord le Module 1 (notebooks + quiz).
        <div className="mt-4">
          <Link className="font-semibold text-sky-700" href="/school/data-analyst/module-1">
            Aller au Module 1 →
          </Link>
        </div>
      </section>
    );
  }
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Module 3 — Nettoyage</h1>
      <p className="mt-2 text-sm text-slate-600">Bientot disponible.</p>
    </section>
  );
}


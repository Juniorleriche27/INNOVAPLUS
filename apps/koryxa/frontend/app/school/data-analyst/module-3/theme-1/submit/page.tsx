"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Status = {
  validated?: boolean;
  checks?: Record<string, boolean>;
  errors?: string[];
};

export default function Module3Theme1Submit() {
  const [status, setStatus] = useState<Status>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validated = useMemo(() => Boolean(status?.validated), [status]);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-3/theme-1/status`, {
          credentials: "include",
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) setStatus(data);
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-3/theme-1/submit`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setMessage(data?.detail || "Soumission échouée.");
      } else {
        setStatus(data);
        setMessage(Boolean(data?.validated) ? "Soumission validée ✅" : "Soumission reçue, mais rejetée.");
      }
    } catch {
      setMessage("Erreur réseau. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Module 3 — Thème 1</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Soumettre les preuves</h1>
      <p className="mt-2 text-sm text-slate-600">
        Dépose les 4 fichiers générés par le notebook. Le quiz se déverrouille après validation (checks: user_id_unique,
        age_reasonable, dates_parsable + colonnes missing_* présentes).
      </p>

      {validated ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ Soumission validée.
          <div className="mt-3">
            <Link className="font-semibold text-sky-700" href="/school/data-analyst/module-3/theme-1/quiz">
              Aller au quiz →
            </Link>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</div>
      ) : null}

      {Array.isArray(status?.errors) && status.errors.length ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <p className="font-semibold">Rejet (détails)</p>
          <ul className="mt-2 list-disc pl-5">
            {status.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m3t1_profiling_table.csv</span>
          <input name="profiling_table_csv" type="file" accept=".csv,text/csv" required className="rounded-xl border border-slate-200 p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m3t1_dataset_clean.csv</span>
          <input name="dataset_clean_csv" type="file" accept=".csv,text/csv" required className="rounded-xl border border-slate-200 p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m3t1_quality_report.json</span>
          <input name="quality_report_json" type="file" accept=".json,application/json" required className="rounded-xl border border-slate-200 p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m3t1_missingness_plan.md</span>
          <input name="missingness_plan_md" type="file" accept=".md,text/markdown,.txt,text/plain" required className="rounded-xl border border-slate-200 p-2" />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-fit items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Envoi..." : "Envoyer"}
        </button>
      </form>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-3/theme-1/notebook">
          Revoir notebook
        </Link>
        <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-3/theme-1/page/1">
          Revoir cours
        </Link>
      </div>
    </section>
  );
}


"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Status = { validated?: boolean; rows_fetched?: number | null; requests_made?: number | null; n_429?: number | null; errors?: string[] };

export default function Module2Theme4Submit() {
  const [status, setStatus] = useState<Status>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validated = useMemo(() => Boolean(status?.validated), [status]);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-4/status`, {
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
      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-4/submit`, {
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
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Module 2 — Thème 4</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Soumettre les preuves</h1>
      <p className="mt-2 text-sm text-slate-600">
        Dépose les 5 fichiers générés par le notebook. Le quiz se déverrouille après validation (rows_fetched ≥ 200,
        requests_made ≥ 2, n_429 ≥ 1).
      </p>

      {validated ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          ✅ Soumission validée (rows_fetched={status?.rows_fetched ?? "?"}, requests_made={status?.requests_made ?? "?"}
          , n_429={status?.n_429 ?? "?"}).
          <div className="mt-3">
            <Link className="font-semibold text-sky-700" href="/school/data-analyst/module-2/theme-4/quiz">
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
          <span className="font-semibold text-slate-900">m2t4_transactions_raw.csv</span>
          <input name="transactions_raw_csv" type="file" accept=".csv,text/csv" required className="rounded-xl border border-slate-200 p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m2t4_transactions_clean.csv</span>
          <input name="transactions_clean_csv" type="file" accept=".csv,text/csv" required className="rounded-xl border border-slate-200 p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m2t4_request_log.csv</span>
          <input name="request_log_csv" type="file" accept=".csv,text/csv" required className="rounded-xl border border-slate-200 p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m2t4_run_report.json</span>
          <input name="run_report_json" type="file" accept=".json,application/json" required className="rounded-xl border border-slate-200 p-2" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-semibold text-slate-900">m2t4_api_contract.md</span>
          <input name="api_contract_md" type="file" accept=".md,text/markdown,.txt,text/plain" required className="rounded-xl border border-slate-200 p-2" />
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
        <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-2/theme-4/notebook">
          Revoir notebook
        </Link>
        <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-2/theme-4/page/1">
          Revoir cours
        </Link>
      </div>
    </section>
  );
}


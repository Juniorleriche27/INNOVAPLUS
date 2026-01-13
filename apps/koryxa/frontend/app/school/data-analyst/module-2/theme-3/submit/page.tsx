"use client";

import { useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Status = {
  validated: boolean;
};

export default function Module2Theme3SubmitPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{
    queries?: File;
    report?: File;
    q1?: File;
    q2?: File;
    q3?: File;
  }>({});

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-3/status`, {
          credentials: "include",
        });
        if (!resp.ok) return;
        const data = await resp.json().catch(() => ({}));
        setStatus({ validated: Boolean(data?.validated) });
      } catch {
        setStatus(null);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!files.queries || !files.report || !files.q1 || !files.q2 || !files.q3) {
      setMessage("Merci de joindre tous les fichiers requis.");
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("queries_sql", files.queries);
      form.append("run_report", files.report);
      form.append("q1_csv", files.q1);
      form.append("q2_csv", files.q2);
      form.append("q3_csv", files.q3);

      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-3/submit`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setStatus({ validated: Boolean(data?.validated) });
      setMessage(Boolean(data?.validated) ? "Soumission reçue. Thème validé." : "Soumission reçue, mais rejetée.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre — Module 2 · Thème 3</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dépose ton fichier SQL, les 3 exports CSV, et le run report JSON généré par le notebook.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">m2t3_queries.sql</p>
            <input
              type="file"
              accept=".sql,.txt"
              onChange={(e) => setFiles((p) => ({ ...p, queries: e.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">m2t3_q1_funnel_by_theme.csv</p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFiles((p) => ({ ...p, q1: e.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">m2t3_q2_completion_by_country.csv</p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFiles((p) => ({ ...p, q2: e.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">m2t3_q3_notebook48h_vs_validation.csv</p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFiles((p) => ({ ...p, q3: e.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">m2t3_run_report.json</p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setFiles((p) => ({ ...p, report: e.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={uploading}
          className="mt-6 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {uploading ? "Envoi en cours..." : "Soumettre"}
        </button>
        {message && (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </p>
        )}
      </section>

      {status && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Statut: {status.validated ? "Validé" : "Non validé"}
        </section>
      )}
    </div>
  );
}


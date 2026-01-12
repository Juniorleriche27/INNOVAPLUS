"use client";

import { useState } from "react";
import Link from "next/link";

export default function Theme3SubmitPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<{ dict?: File; values?: File; analysis?: File }>({});

  function handleSubmit() {
    if (!files.dict || !files.values || !files.analysis) {
      setMessage("Merci de joindre les 3 fichiers (CSV, JSON, MD).");
      return;
    }
    setMessage(
      "Soumission reçue côté UI. La validation serveur sera branchée ensuite (gating du quiz). Pour l’instant, garde ces fichiers : ils servent de preuves."
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre — Thème 3</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dépose les exports générés par le notebook. Le contrôle serveur (validation + déverrouillage quiz) sera
          activé ensuite.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">theme3_kpi_dictionary.csv</p>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setFiles((prev) => ({ ...prev, dict: event.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">theme3_kpi_values.json</p>
            <input
              type="file"
              accept=".json"
              onChange={(event) => setFiles((prev) => ({ ...prev, values: event.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">theme3_guardrail_analysis.md</p>
            <input
              type="file"
              accept=".md,.txt"
              onChange={(event) => setFiles((prev) => ({ ...prev, analysis: event.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-6 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Soumettre
        </button>

        {message && (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href="/school/data-analyst/module-1/theme-3/notebook"
          >
            Retour notebook
          </Link>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href="/school/data-analyst/module-1/theme-3/page/1"
          >
            Retour au cours
          </Link>
        </div>
      </section>
    </div>
  );
}


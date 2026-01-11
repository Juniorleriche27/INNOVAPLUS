"use client";

import { FormEvent, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

export default function Module1SubmitPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [seed, setSeed] = useState("demo");
  const [projectLink, setProjectLink] = useState("");
  const [kpiResults, setKpiResults] = useState<File | null>(null);
  const [kpiDictionary, setKpiDictionary] = useState<File | null>(null);
  const [brief, setBrief] = useState<File | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    if (!kpiResults || !kpiDictionary) {
      setStatus("error");
      setMessage("Les fichiers KPI sont obligatoires.");
      return;
    }

    const body = new FormData();
    body.append("seed", seed.trim() || "demo");
    body.append("kpi_results", kpiResults);
    body.append("kpi_dictionary", kpiDictionary);
    if (brief) body.append("brief", brief);
    if (projectLink.trim()) body.append("project_link", projectLink.trim());

    try {
      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/submit`, {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setStatus("success");
      setMessage(data?.ok ? "Validation OK. Quiz debloque." : "Soumission recue, mais validation echouee.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre Module 1</h1>
        <p className="mt-2 text-sm text-slate-600">
          Le quiz est debloque apres validation des notebooks.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Seed (dataset)</label>
            <input
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
              placeholder="demo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Lien projet (optionnel)</label>
            <input
              value={projectLink}
              onChange={(event) => setProjectLink(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
              placeholder="https://"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">module1_kpi_results.json</label>
            <input type="file" accept=".json" required onChange={(e) => setKpiResults(e.target.files?.[0] || null)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">module1_kpi_dictionary.csv</label>
            <input type="file" accept=".csv" required onChange={(e) => setKpiDictionary(e.target.files?.[0] || null)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Brief (PDF ou MD, optionnel)</label>
            <input type="file" accept=".pdf,.md" onChange={(e) => setBrief(e.target.files?.[0] || null)} />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 disabled:opacity-60"
          >
            {status === "loading" ? "Envoi..." : "Soumettre"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message}
          </div>
        )}
      </section>
    </div>
  );
}

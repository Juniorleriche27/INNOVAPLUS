"use client";

import { useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Status = {
  validated: boolean;
  rows_count?: number;
};

export default function Theme1SubmitPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<{ register?: File; plan?: File }>({});

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/theme-1/status`, {
          credentials: "include",
        });
        if (!resp.ok) return;
        const data = await resp.json().catch(() => ({}));
        setStatus({ validated: Boolean(data?.validated), rows_count: data?.rows_count });
      } catch {
        setStatus(null);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!files.register || !files.plan) {
      setMessage("Merci de joindre les deux fichiers.");
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("stakeholder_register", files.register);
      form.append("engagement_plan", files.plan);

      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/theme-1/submit`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setStatus({ validated: Boolean(data?.validated), rows_count: data?.rows_count });
      setMessage("Soumission recue. Theme 1 valide.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre — Theme 1</h1>
        <p className="mt-2 text-sm text-slate-600">
          Depose le registre des parties prenantes et le plan d'engagement exportes depuis le notebook.
        </p>
        <div className="mt-6 grid gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">theme1_stakeholder_register.csv</p>
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setFiles((prev) => ({ ...prev, register: event.target.files?.[0] }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">theme1_engagement_plan.md</p>
            <input
              type="file"
              accept=".md,.txt"
              onChange={(event) => setFiles((prev) => ({ ...prev, plan: event.target.files?.[0] }))}
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
          Statut: {status.validated ? "Valide" : "Non valide"}{" "}
          {status.rows_count ? `· ${status.rows_count} lignes` : null}
        </section>
      )}
    </div>
  );
}

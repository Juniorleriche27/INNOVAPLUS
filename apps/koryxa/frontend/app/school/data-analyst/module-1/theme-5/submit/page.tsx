"use client";

import { useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Status = {
  validated: boolean;
  passed?: boolean;
};

export default function Theme5SubmitPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [failedChecks, setFailedChecks] = useState<Array<{ check: string; detail?: string }> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/theme-5/status`, {
          credentials: "include",
        });
        if (!resp.ok) return;
        const data = await resp.json().catch(() => ({}));
        setStatus({ validated: Boolean(data?.validated), passed: Boolean(data?.passed) });
      } catch {
        setStatus(null);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!zipFile) {
      setMessage("Merci de joindre le fichier ZIP du capstone.");
      return;
    }
    setUploading(true);
    setMessage(null);
    setFailedChecks(null);
    try {
      const form = new FormData();
      form.append("capstone_zip", zipFile);

      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/theme-5/submit`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setStatus({ validated: Boolean(data?.validated), passed: Boolean(data?.passed) });
      if (Array.isArray(data?.failed_checks) && data.failed_checks.length > 0) {
        setFailedChecks(data.failed_checks);
      }
      setMessage(Boolean(data?.validated) ? "Soumission recue. Thème 5 validé." : "Soumission recue, mais rejetée.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre — Thème 5</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dépose <span className="font-semibold">module1_capstone_submission.zip</span>. Le serveur valide le pack si{" "}
          <span className="font-semibold">capstone_checklist.json.passed</span> est à true.
        </p>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">module1_capstone_submission.zip</p>
          <input
            type="file"
            accept=".zip"
            onChange={(event) => setZipFile(event.target.files?.[0] ?? null)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
          />
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

        {failedChecks && failedChecks.length > 0 && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <p className="font-semibold">Checks en échec</p>
            <ul className="mt-2 list-disc pl-5">
              {failedChecks.map((c) => (
                <li key={c.check}>
                  {c.check}
                  {c.detail ? ` — ${c.detail}` : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {status && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Statut: {status.validated ? "Validé" : "Non validé"}{" "}
          {typeof status.passed === "boolean" ? `· checklist passed: ${status.passed ? "true" : "false"}` : null}
        </section>
      )}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Status = {
  has_submission: boolean;
  validated: boolean;
  passed?: boolean;
  failed_checks?: string[];
  missing?: string[];
  warnings?: string[];
};

export default function Module2Theme5SubmitPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);

  async function refreshStatus() {
    try {
      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-5/status`, { credentials: "include" });
      if (!resp.ok) return;
      const data = await resp.json().catch(() => ({}));
      setStatus({
        has_submission: Boolean(data?.has_submission),
        validated: Boolean(data?.validated),
        passed: typeof data?.passed === "boolean" ? data.passed : undefined,
        failed_checks: Array.isArray(data?.failed_checks) ? data.failed_checks : undefined,
        missing: Array.isArray(data?.missing) ? data.missing : undefined,
        warnings: Array.isArray(data?.warnings) ? data.warnings : undefined,
      });
    } catch {
      setStatus(null);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  async function handleSubmit() {
    if (!zipFile) {
      setMessage("Merci de joindre le fichier ZIP du capstone.");
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("capstone_zip", zipFile);

      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-5/submit`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setMessage(Boolean(data?.validated) ? "Soumission validée." : "Soumission reçue, mais rejetée (voir checks).");
      await refreshStatus();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre — Module 2 · Thème 5</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dépose le ZIP généré par le notebook packager (structure capstone/ + preuves + scripts).
        </p>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">module2_capstone_collection_pack.zip</p>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setZipFile(e.target.files?.[0] || null)}
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
      </section>

      {status && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          <p>Statut: {status.validated ? "Validé" : status.has_submission ? "Soumis (rejeté)" : "Non soumis"}</p>
          {Array.isArray(status.warnings) && status.warnings.length ? (
            <p className="mt-2">Warnings: {status.warnings.join(" · ")}</p>
          ) : null}
          {Array.isArray(status.missing) && status.missing.length ? (
            <p className="mt-2">Missing: {status.missing.join(", ")}</p>
          ) : null}
          {Array.isArray(status.failed_checks) && status.failed_checks.length ? (
            <p className="mt-2">Failed checks: {status.failed_checks.join(", ")}</p>
          ) : null}
        </section>
      )}
    </div>
  );
}


"use client";

import { FormEvent, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

export default function Module6SubmitPage() {
  const [url, setUrl] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);
    setSubmissionId(null);

    const body = new FormData();
    body.append("url_livrable", url);
    if (comment.trim()) body.append("comment", comment.trim());
    if (file) body.append("file", file);

    try {
      const resp = await fetch(`${INNOVA_API_BASE}/submissions`, {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Echec de la soumission.";
        throw new Error(detail);
      }
      setSubmissionId(data?.submission_id || null);
      setStatus("success");
      setMessage("Soumission recue.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre le livrable</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ajoute un lien (GitHub ou Drive). Tu peux aussi televerser un fichier .zip en option.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Lien GitHub / Drive</label>
            <input
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              placeholder="https://"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Fichier .zip (optionnel)</label>
            <input
              type="file"
              accept=".zip"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Commentaire (optionnel)</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-800 disabled:opacity-60"
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
            {submissionId ? <div className="mt-2 text-xs">Submission ID: {submissionId}</div> : null}
          </div>
        )}
      </section>
    </main>
  );
}

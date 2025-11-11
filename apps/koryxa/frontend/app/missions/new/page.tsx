"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { missionsApi, MissionPayload } from "@/lib/api-client/missions";
import { useAuth } from "@/components/auth/AuthProvider";

const DEFAULT_PAYLOAD: MissionPayload = {
  title: "",
  description: "",
  deliverables: "",
  deadline: "",
  duration_days: 14,
  budget: { minimum: 300, maximum: 1500, currency: "EUR" },
  language: "fr",
  work_mode: "remote",
  allow_expansion: false,
  collect_multiple_quotes: true,
  location_hint: "",
};

export default function NewMissionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [payload, setPayload] = useState<MissionPayload>(DEFAULT_PAYLOAD);
  const [preview, setPreview] = useState<{ summary?: string; keywords?: string[]; deliverables?: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!loading && !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg text-slate-600">Connecte-toi pour publier un besoin.</p>
      </main>
    );
  }

  function update<K extends keyof MissionPayload>(key: K, value: MissionPayload[K]) {
    setPayload((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePreview(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await missionsApi.preview(payload);
      const ai = data.summary as typeof preview;
      setPreview(ai || { summary: "Aperçu indisponible", keywords: data.tags });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de générer le résumé");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await missionsApi.create(payload);
      setSuccess("Mission créée. Redirection vers le suivi…");
      if (response.mission_id) {
        setTimeout(() => router.push(`/missions/track/${response.mission_id}`), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-500">Bloc 2 — Poster un besoin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Nouveau besoin</h1>
        <p className="text-sm text-slate-600">Décris ta mission, vérifie le résumé IA à droite et poste en moins d’une minute.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label className="text-sm font-medium text-slate-700">Titre *</label>
            <input
              required
              value={payload.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Description *</label>
            <textarea
              required
              rows={5}
              value={payload.description}
              onChange={(e) => update("description", e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Livrables attendus *</label>
            <textarea
              required
              rows={3}
              value={payload.deliverables}
              onChange={(e) => update("deliverables", e.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Délai souhaité</label>
              <input
                value={payload.deadline || ""}
                onChange={(e) => update("deadline", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                placeholder="ex: 30 avril 2025"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Durée (jours)</label>
              <input
                type="number"
                min={1}
                value={payload.duration_days ?? 14}
                onChange={(e) => update("duration_days", Number(e.target.value) || undefined)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Budget min.</label>
              <input
                type="number"
                min={0}
                value={payload.budget.minimum ?? ""}
                onChange={(e) => update("budget", { ...payload.budget, minimum: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Budget max.</label>
              <input
                type="number"
                min={0}
                value={payload.budget.maximum ?? ""}
                onChange={(e) => update("budget", { ...payload.budget, maximum: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Devise</label>
              <input
                value={payload.budget.currency ?? "EUR"}
                onChange={(e) => update("budget", { ...payload.budget, currency: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Langue</label>
              <input
                value={payload.language}
                onChange={(e) => update("language", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Mode</label>
              <select
                value={payload.work_mode}
                onChange={(e) => update("work_mode", e.target.value as MissionPayload["work_mode"])}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="remote">Remote</option>
                <option value="local">Local</option>
                <option value="hybrid">Hybride</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Zone / ville</label>
              <input
                value={payload.location_hint ?? ""}
                onChange={(e) => update("location_hint", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={payload.allow_expansion} onChange={(e) => update("allow_expansion", e.target.checked)} />
              Autoriser l’élargissement budget/délai
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={payload.collect_multiple_quotes} onChange={(e) => update("collect_multiple_quotes", e.target.checked)} />
              Collecter plusieurs devis (max 3)
            </label>
          </div>

          {error && <p className="rounded-2xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{error}</p>}
          {success && <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-600">{success}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreview}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-sky-200"
              disabled={saving}
            >
              Générer le résumé IA
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Publication…" : "Poster"}
            </button>
          </div>
        </form>

        <aside className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/50 p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">Preview IA</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Résumé</h2>
          {preview ? (
            <>
              <p className="mt-3 text-sm text-slate-700">{preview.summary}</p>
              {preview.deliverables && preview.deliverables.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Livrables clés</p>
                  <ul className="mt-2 list-disc pl-4 text-sm text-slate-700">
                    {preview.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {(preview.keywords ?? []).map((tag) => (
                  <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Remplis le formulaire puis clique sur “Générer le résumé IA”.</p>
          )}

          <div className="mt-10 rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-slate-700 shadow-inner">
            <p className="font-semibold text-slate-900">Après publication</p>
            <ul className="mt-2 list-disc pl-4">
              <li>Statut initial : <span className="font-semibold">Nouveau</span></li>
              <li>Tu seras redirigé vers <Link href="/missions/track" className="text-sky-600 underline">Suivi de la mission</Link>.</li>
              <li>La vague 1 peut être déclenchée dès que le profil est prêt.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

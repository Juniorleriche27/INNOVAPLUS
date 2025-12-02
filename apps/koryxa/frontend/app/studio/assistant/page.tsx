"use client";

import { useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

const API = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/studio`;

type GenResult = {
  plan: string;
  texte: string;
  titres: string[];
  mots_cles: string[];
};

export default function StudioAssistantPage() {
  const [form, setForm] = useState({
    content_type: "",
    title: "",
    context: "",
    target_audience: "",
    objective: "informer",
    tone: "professionnel",
    length_hint: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);

  const handleChange = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const genRes = await fetch(`${API}/assistant/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: form.content_type,
          title: form.title || undefined,
          context: form.context,
          target_audience: form.target_audience,
          objective: form.objective,
          tone: form.tone,
          length_hint: form.length_hint,
        }),
      });
      if (!genRes.ok) throw new Error(await genRes.text());
      const data = await genRes.json();
      setResult({
        plan: data.plan || "",
        texte: data.texte || "",
        titres: data.titres || [],
        mots_cles: data.mots_cles || [],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inattendue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CHATLAYA Studio</p>
      <h1 className="text-3xl font-semibold text-slate-900">Rédaction assistée</h1>
      <p className="text-sm text-slate-600">Crée un brief puis génère un plan, un texte, des titres et des mots-clés.</p>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Type de contenu
            <input
              required
              value={form.content_type}
              onChange={(e) => handleChange("content_type", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Titre (optionnel)
            <input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="md:col-span-2 text-sm text-slate-700">
            Contexte / activité
            <textarea
              required
              value={form.context}
              onChange={(e) => handleChange("context", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Public cible
            <input
              required
              value={form.target_audience}
              onChange={(e) => handleChange("target_audience", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Objectif
            <select
              value={form.objective}
              onChange={(e) => handleChange("objective", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {["informer", "vendre", "recruter", "mobiliser"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Ton
            <select
              value={form.tone}
              onChange={(e) => handleChange("tone", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {["professionnel", "simple", "motivante", "institutionnel"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Longueur approximative
            <input
              value={form.length_hint}
              onChange={(e) => handleChange("length_hint", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Génération..." : "Générer avec CHATLAYA"}
          </button>
          <a href="/studio" className="text-sm font-semibold text-sky-700">
            ← Retour à CHATLAYA Studio
          </a>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan proposé</p>
          {result ? (
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-800">{result.plan}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Le plan apparaîtra ici après la génération.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Texte généré</p>
          {result ? (
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-slate-800">{result.texte}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Le texte complet apparaîtra ici après la génération.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Titres possibles</p>
          {result ? (
            <ul className="mt-3 list-disc pl-5 text-base leading-7 text-slate-800">
              {result.titres.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Les propositions de titres apparaîtront ici.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Mots-clés suggérés</p>
          {result ? (
            <p className="mt-3 text-base leading-7 text-slate-800">{result.mots_cles.join(", ")}</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Les mots-clés apparaîtront ici.</p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

const API = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/studio`;

type GenResult = {
  plan: string;
  texte: string;
  titres: string[];
  mots_cles: string[];
  combined: string;
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
    max_tokens: "1200",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "plan" | "markdown">("content");

  const handleChange = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (fullscreen) {
      document.body.classList.add("studio-fullscreen");
    } else {
      document.body.classList.remove("studio-fullscreen");
    }
    return () => document.body.classList.remove("studio-fullscreen");
  }, [fullscreen]);

  const stats = useMemo(() => {
    if (!result?.texte) return { words: 0, tokens: 0 };
    const words = result.texte.trim().split(/\s+/).filter(Boolean).length;
    const tokens = Math.round(words * 1.35);
    return { words, tokens };
  }, [result]);

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
          max_tokens: Number(form.max_tokens) || undefined,
        }),
      });
      if (!genRes.ok) throw new Error(await genRes.text());
      const data = await genRes.json();
      const combined = [
        data.plan && `Plan :\n${data.plan}`,
        data.texte && `Texte :\n${data.texte}`,
        (data.titres || []).length ? `Titres :\n${(data.titres || []).join("\n")}` : "",
        (data.mots_cles || []).length ? `Mots-clés :\n${(data.mots_cles || []).join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      setResult({
        plan: data.plan || "",
        texte: data.texte || "",
        titres: data.titres || [],
        mots_cles: data.mots_cles || [],
        combined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inattendue";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 via-sky-50 to-emerald-50 p-6 shadow-lg shadow-slate-900/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CHATLAYA STUDIO</p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-900">Rédaction assistée</h1>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-100">
                Génération IA
              </span>
            </div>
            <p className="text-sm text-slate-600">Brief → Génération → Copier en un clic, avec contrôle des tokens.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
              Tokens choisis : {form.max_tokens}
            </div>
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {fullscreen ? "Quitter le plein écran" : "Plein écran"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-900/5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800">Brief rapide</p>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">1/2</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <details open className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Brief & Contexte
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    Type de contenu
                    <input
                      required
                      value={form.content_type}
                      onChange={(e) => handleChange("content_type", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Article, page web, post…"
                    />
                  </label>
                  <label className="text-sm text-slate-700">
                    Titre (optionnel)
                    <input
                      value={form.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Titre provisoire"
                    />
                  </label>
                  <label className="md:col-span-2 text-sm text-slate-700">
                    Contexte / activité
                    <textarea
                      required
                      value={form.context}
                      onChange={(e) => handleChange("context", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      rows={4}
                      placeholder="Détails clés, produit/service, contraintes, CTA…"
                    />
                  </label>
                </div>
              </details>

              <details open className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Cible & Objectif
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-slate-700">
                    Public cible
                    <input
                      required
                      value={form.target_audience}
                      onChange={(e) => handleChange("target_audience", e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Ex: jeunes urbains, B2B, parents…"
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
                </div>
              </details>

              <details open className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Style & Longueur
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                      placeholder="Ex: 800 mots"
                    />
                  </label>
                  <div className="text-sm text-slate-700 space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span>Max tokens (jusqu'à 4000)</span>
                      <span className="text-xs text-slate-500">{form.max_tokens}</span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={4000}
                      step={50}
                      value={Number(form.max_tokens) || 1200}
                      onChange={(e) => handleChange("max_tokens", e.target.value)}
                      className="w-full accent-sky-600"
                    />
                  </div>
                </div>
              </details>

              <div className="flex flex-wrap items-center gap-3">
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
                {error && <p className="text-sm text-rose-600">{error}</p>}
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md shadow-slate-900/5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">Contenu complet</p>
                {result && (
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                    {stats.words} mots · ~{stats.tokens} tokens
                  </span>
                )}
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
                    <button
                      type="button"
                      onClick={() => setActiveTab("content")}
                      className={`px-2 py-1 rounded-full ${activeTab === "content" ? "bg-white shadow" : ""}`}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("plan")}
                      className={`px-2 py-1 rounded-full ${activeTab === "plan" ? "bg-white shadow" : ""}`}
                    >
                      Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("markdown")}
                      className={`px-2 py-1 rounded-full ${activeTab === "markdown" ? "bg-white shadow" : ""}`}
                    >
                      Markdown
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(result.combined || "")}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Copier
                  </button>
                </div>
              )}
            </div>
            {result ? (
              <div className="mt-3 space-y-3">
                <details open className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                  <summary className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 cursor-pointer">
                    Aperçu rapide
                  </summary>
                  <p className="mt-2 text-sm text-slate-700">
                    Max tokens : {form.max_tokens} • Objectif : {form.objective} • Ton : {form.tone}
                  </p>
                </details>
                {activeTab === "content" && (
                  <p className="whitespace-pre-wrap text-base leading-7 text-slate-800">{result.combined}</p>
                )}
                {activeTab === "plan" && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800 mb-2">Plan</p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.plan}</p>
                    <p className="text-sm font-semibold text-slate-800 mt-3 mb-1">Titres</p>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {result.titres.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    <p className="text-sm font-semibold text-slate-800 mt-3 mb-1">Mots-clés</p>
                    <p className="text-sm text-slate-700">{result.mots_cles.join(", ")}</p>
                  </div>
                )}
                {activeTab === "markdown" && (
                  <pre className="whitespace-pre-wrap rounded-2xl bg-slate-900 text-slate-100 p-4 text-sm overflow-auto">
{`# ${form.title || "Titre"}

## Plan
${result.plan}

## Texte
${result.texte}

## Titres
- ${result.titres.join("\n- ")}

## Mots-clés
${result.mots_cles.join(", ")}`}
                  </pre>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Le contenu complet apparaîtra ici après la génération.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-sky-50/40 to-white">
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur px-4 py-3 sm:px-6 lg:px-10 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <h1 className="text-xl font-semibold text-slate-900">Rédaction assistée</h1>
            <input
              required
              value={form.content_type}
              onChange={(e) => handleChange("content_type", e.target.value)}
              className="w-40 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white shadow-inner"
              placeholder="Type (article...)"
            />
            <select
              value={form.objective}
              onChange={(e) => handleChange("objective", e.target.value)}
              className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white shadow-inner"
            >
              {["informer", "vendre", "recruter", "mobiliser"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={form.tone}
              onChange={(e) => handleChange("tone", e.target.value)}
              className="w-36 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white shadow-inner"
            >
              {["professionnel", "simple", "motivante", "institutionnel"].map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </select>
            <input
              value={form.length_hint}
              onChange={(e) => handleChange("length_hint", e.target.value)}
              className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white shadow-inner"
              placeholder="Longueur"
            />
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={200}
                max={4000}
                step={50}
                value={Number(form.max_tokens) || 1200}
                onChange={(e) => handleChange("max_tokens", e.target.value)}
                className="w-32 accent-sky-600"
              />
              <span className="text-xs text-slate-600">{form.max_tokens} tok</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Tokens {form.max_tokens}
            </div>
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              {fullscreen ? "Quitter le plein écran" : "Plein écran"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-60 transition"
            >
              {loading ? "Génération..." : "Générer avec Chatlaya"}
            </button>
          </div>
        </form>
      </div>

      <div className="px-4 sm:px-6 lg:px-10 pb-10 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-900/5 backdrop-blur">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              Titre (optionnel)
              <input
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                placeholder="Titre provisoire"
              />
            </label>
            <label className="text-sm text-slate-700">
              Public cible
              <input
                required
                value={form.target_audience}
                onChange={(e) => handleChange("target_audience", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                placeholder="Ex: jeunes urbains, B2B, parents…"
              />
            </label>
          </div>
          <label className="mt-3 block text-sm text-slate-700">
            Contexte / activité
            <textarea
              required
              value={form.context}
              onChange={(e) => handleChange("context", e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm bg-white shadow-inner"
              rows={4}
              placeholder="Détails clés, produit/service, contraintes, CTA…"
            />
          </label>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-xl shadow-slate-900/5 backdrop-blur min-h-[60vh] flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">Zone IA</p>
              {result && (
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                  {stats.words} mots · ~{stats.tokens} tokens
                </span>
              )}
            </div>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                    activeTab === "content" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("plan")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                    activeTab === "plan" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  Plan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("markdown")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                    activeTab === "markdown" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(result.combined || "")}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Copier
                </button>
              </div>
            )}
          </div>

          {result ? (
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Aperçu rapide</p>
                <p className="mt-1 text-sm text-slate-700">
                  Tokens : {form.max_tokens} • Objectif : {form.objective} • Ton : {form.tone}
                </p>
              </div>

                {activeTab === "content" && (
                  <div className="space-y-4">
                    {result.plan && (
                      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4 shadow-md shadow-slate-900/10">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300 mb-2">Plan</p>
                        <p className="whitespace-pre-wrap text-sm leading-6">{result.plan}</p>
                      </div>
                    )}
                    {result.texte && (
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 shadow-md shadow-slate-900/10">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          Réponse IA · {stats.words} mots · ~{stats.tokens} tok
                        </div>
                        <div className="whitespace-pre-wrap text-base leading-7 text-slate-800">{result.texte}</div>
                      </div>
                    )}
                    {(result.titres.length > 0 || result.mots_cles.length > 0) && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 shadow-sm shadow-slate-900/5">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Titres & mots-clés</p>
                      {result.titres.length > 0 && (
                        <ul className="list-disc pl-5 text-sm text-slate-800 space-y-1">
                          {result.titres.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                      {result.mots_cles.length > 0 && (
                        <p className="mt-2 text-sm text-slate-700">{result.mots_cles.join(", ")}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "plan" && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-2">Plan</p>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-2">Titres</p>
                    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {result.titres.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 mb-2">Mots-clés</p>
                    <p className="text-sm text-slate-700">{result.mots_cles.join(", ")}</p>
                  </div>
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
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
              Le contenu généré apparaîtra ici après la génération.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

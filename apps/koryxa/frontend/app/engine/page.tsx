"use client";

import { useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type EngineRules = {
  rag_sources: string[];
  llm: { primary_model: string; llm_api_enabled: boolean };
  equity: { quotas: Array<{ country: string; min?: number; max?: number; active?: boolean }> };
  filters?: { languages?: string[]; countries?: string[] };
  updated_at?: string;
};

type DecisionLog = { items: Array<{ kind?: string; offer_id?: string; user_id?: string; need_index?: number; quota?: any; ts?: string }> };

function StatPill({ label }: { label: string }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{label}</span>;
}

export default function EnginePage() {
  const [rules, setRules] = useState<EngineRules | null>(null);
  const [decisions, setDecisions] = useState<DecisionLog["items"]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${INNOVA_API_BASE}/engine/rules`, { cache: "no-store" }).then((res) => res.json());
        setRules(r);
        const d = await fetch(`${INNOVA_API_BASE}/engine/decisions?limit=10`, { cache: "no-store" }).then((res) => res.json());
        setDecisions(d.items || []);
      } catch (e: any) {
        setError(e?.message || "Impossible de charger les règles");
      }
    })();
  }, []);

  async function save() {
    if (!rules) return;
    setSaving(true);
    setError(null);
    try {
      await fetch(`${INNOVA_API_BASE}/engine/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      }).then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
      });
    } catch (e: any) {
      setError(e?.message || "Échec de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Moteur IA</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Règles RAG & équité</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Paramètres de matching, quotas d&apos;équité et modèles utilisés par Chatlaya. Configurez vos sources RAG, le modèle principal et les quotas par pays.
          </p>
          {rules?.updated_at && <p className="mt-2 text-xs text-slate-500">Dernière mise à jour : {new Date(rules.updated_at).toLocaleString()}</p>}
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Sources RAG</p>
                <p className="text-xs text-slate-500">URLs ou identifiants d’index.</p>
              </div>
              <StatPill label={`${rules?.rag_sources?.length || 0} source(s)`} />
            </div>
            <textarea
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-sky-300 focus:outline-none"
              rows={4}
              value={(rules?.rag_sources || []).join("\n")}
              onChange={(e) => setRules((prev) => ({ ...(prev || _emptyRules), rag_sources: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) }))}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Modèles IA</p>
              <StatPill label={rules?.llm?.llm_api_enabled ? "API LLM active" : "API LLM inactive"} />
            </div>
            <label className="text-xs text-slate-500">Modèle principal</label>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-sky-300 focus:outline-none"
              value={rules?.llm?.primary_model || ""}
              onChange={(e) => setRules((prev) => ({ ...(prev || _emptyRules), llm: { ...(prev?.llm || {}), primary_model: e.target.value } }))}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!rules?.llm?.llm_api_enabled}
                onChange={(e) => setRules((prev) => ({ ...(prev || _emptyRules), llm: { ...(prev?.llm || {}), llm_api_enabled: e.target.checked } }))}
              />
              Activer l&apos;API LLM
            </label>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Quotas d’équité</p>
              <p className="text-xs text-slate-500">Min/Max par pays.</p>
            </div>
            <StatPill label={`${rules?.equity?.quotas?.length || 0} quotas`} />
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            {(rules?.equity?.quotas || []).map((q, idx) => (
              <div key={`${q.country}-${idx}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <input
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={q.country}
                  onChange={(e) =>
                    setRules((prev) => {
                      const next = { ...(prev || _emptyRules) };
                      const quotas = [...(next.equity.quotas || [])];
                      quotas[idx] = { ...quotas[idx], country: e.target.value.toUpperCase() };
                      next.equity.quotas = quotas;
                      return next;
                    })
                  }
                  placeholder="Pays"
                />
                <input
                  type="number"
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={q.min ?? ""}
                  onChange={(e) =>
                    setRules((prev) => {
                      const next = { ...(prev || _emptyRules) };
                      const quotas = [...(next.equity.quotas || [])];
                      quotas[idx] = { ...quotas[idx], min: e.target.value ? Number(e.target.value) : undefined };
                      next.equity.quotas = quotas;
                      return next;
                    })
                  }
                  placeholder="Min"
                />
                <input
                  type="number"
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  value={q.max ?? ""}
                  onChange={(e) =>
                    setRules((prev) => {
                      const next = { ...(prev || _emptyRules) };
                      const quotas = [...(next.equity.quotas || [])];
                      quotas[idx] = { ...quotas[idx], max: e.target.value ? Number(e.target.value) : undefined };
                      next.equity.quotas = quotas;
                      return next;
                    })
                  }
                  placeholder="Max"
                />
                <label className="ml-2 flex items-center gap-1 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!q.active}
                    onChange={(e) =>
                      setRules((prev) => {
                        const next = { ...(prev || _emptyRules) };
                        const quotas = [...(next.equity.quotas || [])];
                        quotas[idx] = { ...quotas[idx], active: e.target.checked };
                        next.equity.quotas = quotas;
                        return next;
                      })
                    }
                  />
                  Actif
                </label>
                <button
                  className="ml-auto text-xs font-semibold text-red-600 hover:underline"
                  onClick={() =>
                    setRules((prev) => {
                      const next = { ...(prev || _emptyRules) };
                      next.equity.quotas = (next.equity.quotas || []).filter((_, i) => i !== idx);
                      return next;
                    })
                  }
                >
                  Supprimer
                </button>
              </div>
            ))}
            {(rules?.equity?.quotas || []).length === 0 && <p className="text-xs text-slate-500">Aucun quota défini.</p>}
            <button
              className="mt-2 inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
              onClick={() =>
                setRules((prev) => {
                  const next = { ...(prev || _emptyRules) };
                  next.equity.quotas = [...(next.equity.quotas || []), { country: "", min: undefined, max: undefined, active: true }];
                  return next;
                })
              }
            >
              + Ajouter un quota
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Journal des décisions</p>
            <StatPill label={`${decisions.length} entrées`} />
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {decisions.map((d, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="font-semibold text-slate-900">{d.kind || "decision"}</p>
                <p className="text-xs text-slate-500">
                  Offre {d.offer_id || "-"} · User {d.user_id || "-"} · NeedIndex {d.need_index ?? "ND"} · {d.ts ? new Date(d.ts).toLocaleString() : "ts ND"}
                </p>
              </div>
            ))}
            {decisions.length === 0 && <p className="text-xs text-slate-500">Aucune entrée pour le moment.</p>}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={saving || !rules}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </main>
  );
}

const _emptyRules: EngineRules = {
  rag_sources: [],
  llm: { primary_model: "", llm_api_enabled: true },
  equity: { quotas: [] },
};

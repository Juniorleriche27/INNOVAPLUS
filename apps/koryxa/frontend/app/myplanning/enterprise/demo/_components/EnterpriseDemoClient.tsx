"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EnterpriseLeadForm } from "../../_components/EnterpriseLeadForm";

type MartOverview = Record<string, any>;
type MartProject = Record<string, any>;

function safeNumber(value: any): number | null {
  if (value === null || typeof value === "undefined") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(num)) return num;
  return null;
}

function percent(value: any): string {
  const num = safeNumber(value);
  if (num === null) return "n/a";
  return `${Math.round(num * 100)}%`;
}

function shortText(value: any, fallback = "n/a"): string {
  const s = String(value ?? "").trim();
  return s ? s : fallback;
}

function barWidth01(value: any): string {
  const num = safeNumber(value);
  if (num === null) return "0%";
  const clamped = Math.max(0, Math.min(1, num));
  return `${Math.round(clamped * 100)}%`;
}

function buildAlerts(project: MartProject): string[] {
  const alerts: string[] = [];
  const presenceRate = safeNumber(project.presence_rate);
  const progress = safeNumber(project.progress);

  if (presenceRate !== null && presenceRate < 0.4) alerts.push("Présence faible (< 40%).");
  if (progress !== null && progress < 0.3) alerts.push("Progression faible (< 30%).");

  return alerts;
}

export default function EnterpriseDemoClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<MartOverview | null>(null);
  const [projects, setProjects] = useState<MartProject[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [oRes, pRes] = await Promise.all([
        fetch("/innova/api/mart/app-overview", { cache: "no-store" }),
        fetch("/innova/api/mart/projects?limit=50&offset=0", { cache: "no-store" }),
      ]);
      if (!oRes.ok) throw new Error(`mart overview HTTP ${oRes.status}`);
      if (!pRes.ok) throw new Error(`mart projects HTTP ${pRes.status}`);
      const o = await oRes.json();
      const p = await pRes.json();
      setOverview(o && typeof o === "object" ? o : null);
      setProjects(Array.isArray(p) ? p : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement";
      setError(message);
      setOverview(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) => {
      const hay = `${p.project_id ?? ""} ${p.project_name ?? ""} ${p.company_name ?? ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [projects, q]);

  const topRisks = useMemo(() => {
    const withRate = filtered
      .map((p) => ({ p, rate: safeNumber(p.presence_rate) }))
      .filter((x) => x.rate !== null) as { p: MartProject; rate: number }[];
    withRate.sort((a, b) => a.rate - b.rate);
    return withRate.slice(0, 10).map((x) => x.p);
  }, [filtered]);

  const narrative = useMemo(() => {
    const nProjects = overview?.n_projects ?? null;
    const avgPresence = overview?.avg_company_presence_rate ?? null;
    const lowPresence = topRisks.filter((p) => safeNumber(p.presence_rate) !== null && (safeNumber(p.presence_rate) as number) < 0.4).length;
    const bits = [
      nProjects ? `${nProjects} projets suivis` : null,
      avgPresence !== null ? `présence moyenne ~${percent(avgPresence)}` : null,
      topRisks.length ? `${topRisks.length} projets à risque visibles` : null,
      lowPresence ? `${lowPresence} avec présence faible` : null,
    ].filter(Boolean);
    if (!bits.length) return "Démo chargée depuis vos vues mart (lecture seule).";
    return `${bits.join(" · ")}.`;
  }, [overview, topRisks]);

  return (
    <div className="w-full space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Enterprise demo</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Démo interactive: portefeuille + risques + présence</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Une vue concrète du reporting Entreprise: projets, risques, agrégats de présence, et recommandations
          actionnables. Sans login.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#activate"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Activer sur vos données
          </a>
          <Link
            href="/myplanning/enterprise"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retour Entreprise
          </Link>
          <Link
            href="/myplanning/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voir les offres
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Vue d’ensemble</h2>
            <p className="mt-2 text-sm text-slate-700">{narrative}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Chargement..." : "Recharger"}
          </button>
        </div>

        {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Projets</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{overview?.n_projects ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Entreprises</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{overview?.n_companies ?? "—"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Présence moyenne</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{percent(overview?.avg_company_presence_rate)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Portefeuille projets</h2>
              <p className="mt-2 text-sm text-slate-700">Recherche simple sur projet et entreprise.</p>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (ex: P001, Acme...)"
              className="w-full max-w-xs rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600">Chargement...</p>
          ) : filtered.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Aucun projet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                <div className="col-span-3">Projet</div>
                <div className="col-span-4">Nom</div>
                <div className="col-span-3">Entreprise</div>
                <div className="col-span-2 text-right">Présence</div>
              </div>
              <div className="divide-y divide-slate-200">
                {filtered.slice(0, 12).map((p) => (
                  <div key={`${p.project_id}-${p.company_name}`} className="grid grid-cols-12 gap-2 px-4 py-3">
                    <div className="col-span-3 text-sm font-semibold text-slate-900">{shortText(p.project_id)}</div>
                    <div className="col-span-4 text-sm text-slate-700">{shortText(p.project_name)}</div>
                    <div className="col-span-3 text-sm text-slate-700">{shortText(p.company_name)}</div>
                    <div className="col-span-2 text-right text-sm font-semibold text-slate-900">
                      {percent(p.presence_rate)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Risques & alertes (exemple)</h2>
          <p className="mt-2 text-sm text-slate-700">
            Les risques ci-dessous sont calculés automatiquement sur des règles déterministes (pas d’hallucination).
          </p>

          {loading ? (
            <p className="mt-4 text-sm text-slate-600">Chargement...</p>
          ) : topRisks.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">Données insuffisantes pour afficher les risques.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topRisks.map((p) => {
                const alerts = buildAlerts(p);
                return (
                  <article key={`${p.project_id}-${p.company_name}-risk`} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {shortText(p.project_id)} · {shortText(p.project_name)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{shortText(p.company_name)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Présence</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{percent(p.presence_rate)}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: barWidth01(p.presence_rate) }} />
                    </div>
                    {alerts.length ? (
                      <ul className="mt-3 space-y-1 text-sm text-slate-700">
                        {alerts.map((a) => (
                          <li key={a} className="flex items-start gap-2">
                            <span className="mt-1 inline-block h-2 w-2 rounded-full bg-rose-500" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">Aucune alerte détectée.</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="activate" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Activer sur vos données</h2>
        <p className="mt-2 text-sm text-slate-700">
          Dites-nous votre contexte. Nous vous aidons à brancher vos sources et à configurer un reporting Entreprise
          fiable.
        </p>
        <div className="mt-6">
          <EnterpriseLeadForm sourcePage="/myplanning/enterprise/demo" />
        </div>
      </section>
    </div>
  );
}

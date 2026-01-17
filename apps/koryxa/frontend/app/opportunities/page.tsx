"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INNOVA_API_BASE } from "@/lib/env";
import type { Opportunity, OpportunityListResponse } from "@/lib/types/opportunities";

const API = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/opportunities`;

const STATUS_LABEL: Record<string, string> = {
  open: "Ouvert",
  closed: "Fermé",
  draft: "Brouillon",
};

const STATUS_CLASS: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-100",
  draft: "bg-slate-50 text-slate-700 border-slate-200",
  closed: "bg-rose-50 text-rose-700 border-rose-100",
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [country, setCountry] = useState("");
  const [total, setTotal] = useState<number>(0);
  const [source, setSource] = useState("all");
  const [product, setProduct] = useState("");

  type LoadParams = {
    search: string;
    status: string;
    country: string;
    source: string;
    product: string;
  };

  const load = useCallback(async (paramsInput: LoadParams) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (paramsInput.search.trim()) params.set("search", paramsInput.search.trim());
      if (paramsInput.status !== "all") params.set("status", paramsInput.status);
      if (paramsInput.country.trim()) params.set("country", paramsInput.country.trim());
      if (paramsInput.source !== "all") params.set("source", paramsInput.source);
      if (paramsInput.product.trim()) params.set("product", paramsInput.product.trim());
      const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Impossible de charger les opportunités");
      }
      const data: OpportunityListResponse = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ search: "", status: "all", country: "", source: "all", product: "" });
  }, [load]);

  const filtered = useMemo(() => items, [items]);

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-lg shadow-slate-900/5 sm:p-8">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Opportunités</p>
            <h1 className="text-3xl font-semibold text-slate-900">Pipeline des opportunités</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Suivez vos besoins publiés, les offres et leurs statuts. Créez une opportunité, associez une mission ou filtrez par pays/statut.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
            <Link href="/missions/new" className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
              Poster un besoin
            </Link>
            <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:bg-slate-50">
              Créer une offre
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-5 shadow-inner shadow-slate-100/60">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              placeholder="Rechercher un titre"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="all">Tous statuts</option>
              <option value="open">Ouvert</option>
              <option value="draft">Brouillon</option>
              <option value="closed">Fermé</option>
            </select>
            <input
              placeholder="Pays (ex: CI, SN)"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="all">Toutes sources</option>
              <option value="manual">Manuel</option>
              <option value="product">Produit</option>
              <option value="mission">Mission</option>
            </select>
            <input
              placeholder="Produit (slug)"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
            <button
              onClick={() => void load({ search, status, country, source, product })}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Rafraîchir
            </button>
          </div>
          <div className="mt-3 text-xs text-slate-500">{filtered.length} opportunité(s) · Total: {total}</div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Chargement…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Aucune opportunité pour ces filtres. Publiez un besoin ou importez une offre pour démarrer.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((opp) => (
              <div key={opp.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-900">{opp.title}</p>
                    <p className="text-xs text-slate-500">Créée le {formatDate(opp.created_at)}</p>
                    {opp.problem && <p className="text-sm text-slate-600 line-clamp-2">{opp.problem}</p>}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      {opp.country && <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold">{opp.country}</span>}
                      <span className={`rounded-full border px-2 py-1 font-semibold ${STATUS_CLASS[opp.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {STATUS_LABEL[opp.status] || opp.status}
                      </span>
                      {opp.skills_required?.slice(0, 4).map((s) => (
                        <span key={s} className="rounded-full border border-slate-200 px-2 py-1">
                          {s}
                        </span>
                      ))}
                      {opp.tags?.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                          {t}
                        </span>
                      ))}
                      {opp.product_slug && <span className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">Produit : {opp.product_slug}</span>}
                      {opp.source && <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">Source : {opp.source}</span>}
                      {opp.mission_id && (
                        <Link href={`/missions/track/${opp.mission_id}`} className="rounded-full bg-sky-50 px-2 py-1 font-semibold text-sky-700 underline">
                          Mission liée
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm sm:items-end">
                    <Link href="/missions/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                      Associer une mission
                    </Link>
                    <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                      Ajouter une offre
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

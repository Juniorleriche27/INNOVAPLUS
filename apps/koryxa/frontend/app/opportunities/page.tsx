"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INNOVA_API_BASE } from "@/lib/env";

type Opportunity = {
  id: string;
  title: string;
  problem?: string;
  status: string;
  country?: string;
  skills_required?: string[];
  tags?: string[];
  created_at?: string;
};

type ListResponse = {
  items: Opportunity[];
  total: number;
  has_more?: boolean;
};

const API = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/opportunities`;

const STATUS_LABEL: Record<string, string> = {
  open: "Ouvert",
  closed: "Fermé",
  draft: "Brouillon",
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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      if (country.trim()) params.set("country", country.trim());
      const res = await fetch(`${API}?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Impossible de charger les opportunités");
      }
      const data: ListResponse = await res.json();
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return items;
  }, [items]);

  return (
    <div className="w-full px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Opportunités</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Pipeline des opportunités</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Suivez les besoins publiés, leurs offres et les statuts. Publiez un besoin, créez une offre ou importez vos opportunités.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/missions/new" className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
              Poster un besoin
            </Link>
            <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50">
              Créer une offre
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-4">
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
            <button
              onClick={() => void load()}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Rafraîchir
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Chargement…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            Aucune opportunité pour ces filtres. Publiez un besoin ou importez une offre.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((opp) => (
              <div key={opp.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{opp.title}</p>
                    <p className="text-xs text-slate-500">Créée le {formatDate(opp.created_at)}</p>
                    {opp.problem && <p className="mt-1 text-sm text-slate-600 line-clamp-2">{opp.problem}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                      {opp.country && <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold">{opp.country}</span>}
                      <span className="rounded-full bg-sky-50 px-2 py-1 font-semibold text-sky-700">{STATUS_LABEL[opp.status] || opp.status}</span>
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
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <Link href="/missions/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                      Associer une mission
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

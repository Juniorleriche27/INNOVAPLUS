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
    <main className="grid gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Opportunités</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Le hub KORYXA pour suivre missions, besoins et signaux d’activation.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Cette surface relie besoin publié, source, produit concerné, pays, compétences attendues et potentiel de
              mission. Elle doit servir autant à l’équipe KORYXA qu’aux profils déjà prêts à être activés.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "Les opportunités doivent relier progression, validation et besoin réel.",
              "Une mission ou un produit peut devenir une source d’opportunité structurée.",
              "Le filtrage par pays, statut, source et produit doit rester rapide et lisible.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/missions/new" className="btn-primary">
            Poster un besoin
          </Link>
          <Link href="/projects/new" className="btn-secondary">
            Déposer une capacité
          </Link>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-[34px] border border-slate-200/70 bg-white/95 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Pipeline visible</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{filtered.length}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Opportunités actuellement chargées et exploitables dans le hub.</p>
          </article>
          <article className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Total back-office</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{total}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Volume total remonté par l’API opportunités KORYXA.</p>
          </article>
          <article className="rounded-[26px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Sources reliées</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">Mission • Produit • Manuel</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Le hub doit garder la trace de l’origine de chaque opportunité.</p>
          </article>
        </section>

        <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/70 p-4 sm:p-5 shadow-inner shadow-slate-100/60">
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
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Chargement…</div>
        ) : error ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Aucune opportunité pour ces filtres. Publiez un besoin ou importez une offre pour démarrer.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((opp) => (
              <div key={opp.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_36px_rgba(14,165,233,0.10)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold tracking-[-0.02em] text-slate-900">{opp.title}</p>
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
                    <Link href={`/opportunities/${opp.id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 font-semibold text-white hover:bg-sky-700">
                      Voir le détail
                    </Link>
                    <Link href="/myplanning/profile" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                      Profils activables
                    </Link>
                    <Link href="/missions/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                      Associer une mission
                    </Link>
                    <Link href="/projects/new" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                      Déposer une capacité
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

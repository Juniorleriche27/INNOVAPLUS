// app/marketplace/page.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TelemetryPing from "@/components/util/TelemetryPing";

export default function MarketplacePage() {
  const pathname = usePathname();
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
      <TelemetryPing name="view_marketplace" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Marketplace</h1>
          <p className="text-sm text-slate-500">Talents, services et offres packagées.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/marketplace/new" className="btn-primary">Publier une offre</Link>
        </div>
      </header>

      {/* Filtres (sticky sous le header) */}
      <section className="sticky top-20 z-10 mb-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input placeholder="Pays" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
          <input placeholder="Compétences" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
          <input placeholder="Tags" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
        </div>
      </section>

      {/* KPIs */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Offres actives", value: "56" },
          { label: "Missions remplies", value: "212" },
          { label: "Délai médian d'attribution", value: "48 h" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="mt-1 text-xl font-semibold text-sky-600">{k.value}</p>
          </div>
        ))}
      </section>

      {/* Tabs */}
      <nav className="mb-4 flex flex-wrap gap-2">
        {[
          { href: "/marketplace/talents", label: "Talents" },
          { href: "/marketplace/services", label: "Services" },
          { href: "/marketplace/offers", label: "Offres" },
        ].map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={
                `rounded-full px-3 py-1.5 text-sm transition border ${
                  active
                    ? "border-sky-300 bg-sky-50 text-sky-700"
                    : "border-slate-200 text-slate-600 hover:border-sky-200 hover:text-sky-700"
                }`
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {/* Cards offres */}
      <section className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <article key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">Offre #{i} · Data Analyst</p>
                <p
                  className="text-sm text-slate-700"
                  style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  Mission 10 jours · tableau de bord pricing régional, exploration des ventes, recommandations actionnables, livrables Power BI.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">SN</span>
                  <span className="chip">#data</span>
                  <span className="chip">#bi</span>
                </div>
              </div>
              <div className="ml-auto shrink-0">
                <Link href={`/marketplace/offers/${i}`} className="btn-secondary">Voir / Postuler</Link>
              </div>
            </header>
          </article>
        ))}
        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {[1, 2, 3, 4].map((p) => (
            <button key={p} className="h-9 w-9 rounded-full border border-slate-200 text-sm font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500">
              {p}
            </button>
          ))}
          <button className="rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500">
            Suivant
          </button>
        </div>
      </section>
    </main>
  );
}


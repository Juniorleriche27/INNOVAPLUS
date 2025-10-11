// app/marketplace/page.tsx
import Link from "next/link";
import TelemetryPing from "@/components/util/TelemetryPing";

export default function MarketplacePage() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
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

      {/* Filtres */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input placeholder="Pays" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
          <input placeholder="Compétences" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
          <input placeholder="Tags" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
        </div>
      </section>

      {/* Métriques */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Offres actives", value: "56" },
          { label: "Missions remplies", value: "212" },
          { label: "Délai médian d’attribution", value: "48 h" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="mt-1 text-xl font-semibold text-sky-600">{k.value}</p>
          </div>
        ))}
      </section>

      {/* Onglets */}
      <nav className="mb-4 flex flex-wrap gap-2">
        {[
          { href: "/marketplace/talents", label: "Talents" },
          { href: "/marketplace/services", label: "Services" },
          { href: "/marketplace/offers", label: "Offres" },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-200 hover:text-sky-700">
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Cartes placeholder */}
      <section className="space-y-3">
        {[1, 2, 3].map((i) => (
          <article key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Offre #{i} — Data analyst</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">SN • #data #bi</span>
            </header>
            <p className="text-sm text-slate-700">Mission 10 jours — tableau de bord pricing régional, livrables Power BI.</p>
          </article>
        ))}
      </section>
    </main>
  );
}

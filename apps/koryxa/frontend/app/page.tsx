// Landing page épurée sans métriques démo
import Link from "next/link";

export const dynamic = "force-dynamic";

const SECTION_TITLE = "text-3xl font-semibold text-slate-900";
const SECTION_SUBTITLE = "text-base text-slate-500";

export default function HomePage() {
  return (
    <div className="space-y-10 sm:space-y-14 pb-14 px-4 sm:px-0 pt-14 sm:pt-0">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-xl shadow-slate-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_32%),radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.2),transparent_35%)]" aria-hidden />
        <div className="relative z-10 grid gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.6fr_1fr] lg:px-12 lg:py-18">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-100 backdrop-blur">
                KORYXA
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-100/70 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                IA • Transparence • Équité • Mobile
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white sm:text-5xl">
                KORYXA, pensé mobile pour transformer vos besoins en actions
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-slate-200/90 max-w-2xl">
                Publiez un besoin, structurez-le avec l’IA, suivez le matching et les quotas d’équité. Une expérience fluide, même sur téléphone.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/opportunities" className="btn-primary bg-white text-slate-900 shadow-white/30 hover:bg-slate-100">
                Voir le pipeline
              </Link>
              <Link href="/missions/new" className="btn-secondary border-white/40 bg-white/10 text-white hover:border-white hover:bg-white/15">
                Poster un besoin
              </Link>
              <Link href="/equity" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
                Règles d’équité →
              </Link>
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-white/20 bg-white/10 p-5 sm:p-6 shadow-lg shadow-slate-900/30 backdrop-blur">
            <p className="text-sm font-semibold text-white">Copilotes & modules</p>
            <div className="grid gap-2 text-sm text-white/90">
              <Link href="/opportunities" className="rounded-xl border border-white/30 px-3 py-3 bg-white/10 hover:border-white hover:bg-white/15">Pipeline opportunités</Link>
              <Link href="/talents" className="rounded-xl border border-white/30 px-3 py-3 bg-white/10 hover:border-white hover:bg-white/15">Talents & disponibilité</Link>
              <Link href="/marketplace" className="rounded-xl border border-white/30 px-3 py-3 bg-white/10 hover:border-white hover:bg-white/15">Marketplace & offres</Link>
              <Link href="/chatlaya" className="rounded-xl border border-white/30 px-3 py-3 bg-white/10 hover:border-white hover:bg-white/15">CHATLAYA (copilote IA)</Link>
              <Link href="/myplanning" className="rounded-xl border border-white/30 px-3 py-3 bg-white/10 hover:border-white hover:bg-white/15">MyPlanning</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile quick actions */}
      <section className="sm:hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Actions rapides</h2>
          <span className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-full">Mobile</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {[
            { label: "Poster un besoin", href: "/missions/new", accent: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { label: "Pipeline", href: "/opportunities", accent: "bg-sky-50 text-sky-700 border-sky-100" },
            { label: "Talents", href: "/talents", accent: "bg-indigo-50 text-indigo-700 border-indigo-100" },
            { label: "CHATLAYA", href: "/chatlaya", accent: "bg-orange-50 text-orange-700 border-orange-100" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`snap-start min-w-[180px] rounded-2xl border px-4 py-4 text-sm font-semibold shadow-sm ${item.accent}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Modules clés */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className={SECTION_TITLE + " text-2xl sm:text-3xl"}>Modules KORYXA</h2>
          <Link href="/resources" className="text-sm font-semibold text-sky-700">Voir la documentation</Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm hover:-translate-y-0.5 transition">
            <p className="text-sm font-semibold text-slate-900">Opportunités & missions</p>
            <p className="mt-2 text-sm text-slate-600">Publier des besoins, suivre les statuts et associer des offres.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/opportunities" className="btn-secondary">Pipeline</Link>
              <Link href="/missions/new" className="btn-primary">Nouveau besoin</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm hover:-translate-y-0.5 transition">
            <p className="text-sm font-semibold text-slate-900">Talents & Marketplace</p>
            <p className="mt-2 text-sm text-slate-600">Profils, bundles, services et offres packagées.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/marketplace" className="btn-secondary">Découvrir</Link>
              <Link href="/talents" className="btn-secondary">Talents</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm hover:-translate-y-0.5 transition">
            <p className="text-sm font-semibold text-slate-900">Copilotes IA</p>
            <p className="mt-2 text-sm text-slate-600">CHATLAYA, MyPlanning, Studio IA.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/chatlaya" className="btn-secondary">CHATLAYA</Link>
              <Link href="/myplanning" className="btn-secondary">MyPlanning</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Équité / gouvernance */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm sm:grid sm:grid-cols-2 sm:gap-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Équité & NeedIndex</h3>
          <p className="text-sm text-slate-600">
            Configurez les quotas min/max par pays et auditez les attributions. Tous les réglages sont documentés.
          </p>
          <Link href="/equity" className="btn-secondary w-fit">Consulter</Link>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Règles IA & RAG</h3>
          <p className="text-sm text-slate-600">Sources, prompts et gouvernance centralisés dans le module Moteur IA.</p>
          <Link href="/engine" className="btn-secondary w-fit">Configurer</Link>
        </div>
      </section>

    </div>
  );
}

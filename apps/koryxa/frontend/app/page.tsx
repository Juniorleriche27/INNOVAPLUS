// Landing page épurée sans métriques démo
import Link from "next/link";

export const dynamic = "force-dynamic";

const SECTION_TITLE = "text-3xl font-semibold text-slate-900";
const SECTION_SUBTITLE = "text-base text-slate-500";

export default function HomePage() {
  return (
    <div className="space-y-10 sm:space-y-14 pb-12 px-3 sm:px-0 pt-16 sm:pt-0">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/50 to-blue-50/40 shadow-xl shadow-sky-900/5">
        <div className="absolute inset-y-0 -right-20 w-1/2 bg-sky-50/70 blur-3xl" aria-hidden />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-100 opacity-70 blur-3xl" aria-hidden />
        <div className="relative z-10 grid gap-8 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.6fr_1fr] lg:px-12 lg:py-18">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                KORYXA
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                IA • Transparence • Équité
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Transformez vos besoins en opportunités actionnables
              </h1>
              <p className="text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl">
                Publiez un besoin, structurez-le avec l’IA, puis suivez le matching et les quotas d’équité. Un seul espace pour vos missions, talents et copilotes KORYXA.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/opportunities" className="btn-primary">Voir le pipeline</Link>
              <Link href="/missions/new" className="btn-secondary">Poster un besoin</Link>
              <Link href="/equity" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                Règles d’équité →
              </Link>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-sky-100 bg-white/95 p-5 sm:p-6 shadow-lg shadow-sky-200/40 backdrop-blur">
            <p className="text-sm font-semibold text-slate-900">Copilotes & modules</p>
            <div className="grid gap-2 text-sm text-slate-700">
              <Link href="/opportunities" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">Pipeline opportunités</Link>
              <Link href="/talents" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">Talents & disponibilité</Link>
              <Link href="/marketplace" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">Marketplace & offres</Link>
              <Link href="/chatlaya" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">CHATLAYA (copilote IA)</Link>
              <Link href="/myplanning" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">MyPlanning</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modules clés */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className={SECTION_TITLE}>Modules KORYXA</h2>
          <Link href="/resources" className="text-sm font-semibold text-sky-700">Voir la documentation</Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Opportunités & missions</p>
            <p className="mt-2 text-sm text-slate-600">Publier des besoins, suivre les statuts et associer des offres.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/opportunities" className="btn-secondary">Pipeline</Link>
              <Link href="/missions/new" className="btn-primary">Nouveau besoin</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Talents & Marketplace</p>
            <p className="mt-2 text-sm text-slate-600">Profils, bundles, services et offres packagées.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/marketplace" className="btn-secondary">Découvrir</Link>
              <Link href="/talents" className="btn-secondary">Talents</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Copilotes IA</p>
            <p className="mt-2 text-sm text-slate-600">CHATLAYA, MyPlanning, Studio IA.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/chatlaya" className="btn-secondary">CHATLAYA</Link>
              <Link href="/myplanning" className="btn-secondary">MyPlanning</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Équité / gouvernance */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:grid sm:grid-cols-2 sm:gap-4">
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

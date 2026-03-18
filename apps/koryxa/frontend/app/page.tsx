import Link from "next/link";
import { IS_V1_SIMPLE } from "@/lib/env";

const SECTION_TITLE = "text-3xl font-semibold text-slate-900";

const V1_SIGNAL_ITEMS = [
  "Trajectoires guidées autour de besoins réels",
  "Missions concrètes et progression pilotée",
  "Validation plus claire et opportunités utiles",
];

const V1_FLOW = [
  {
    title: "1. Clarifier le besoin",
    text: "Un besoin réel, un profil ou un objectif concret sert de point de départ au diagnostic.",
  },
  {
    title: "2. Identifier la bonne trajectoire et la mission adaptée",
    text: "KORYXA combine onboarding, diagnostic et matching pour recommander la bonne trajectoire, les bonnes ressources et les bonnes missions.",
  },
  {
    title: "3. Valider la progression et ouvrir des opportunités",
    text: "La progression est suivie, scorée et validée pour déboucher sur une mission, un stage ou une collaboration plus pertinente.",
  },
];

const V1_ENTRY_POINTS = [
  {
    href: "/trajectoire",
    label: "Trajectoire",
    eyebrow: "Orientation pilotée",
    description:
      "Des trajectoires guidées pour aider chaque personne à identifier la bonne direction, les bons partenaires de montée en compétence, les bonnes étapes de progression et le bon moment pour passer à l’action.",
    bullets: ["Onboarding intelligent", "Matching de trajectoire", "Ressources partenaires", "Score et validation"],
    cta: "Explorer les trajectoires",
    secondary: { href: "/about", label: "Comprendre le fonctionnement" },
  },
  {
    href: "/entreprise",
    label: "Entreprise",
    eyebrow: "Exécution suivie",
    description: "KORYXA aide les organisations à cadrer un besoin, le transformer en mission structurée, suivre l'exécution et récupérer des livrables utiles.",
    bullets: ["Besoin cadré", "Mission structurée", "Livrables utiles"],
    cta: "Déposer un besoin entreprise",
    secondary: { href: "/about", label: "Comprendre l'approche" },
  },
];

const V1_PRODUCTS = [
  {
    href: "/myplanning",
    label: "MyPlanningAI",
    eyebrow: "Pilotage",
    description:
      "MyPlanningAI aide à piloter l'action, organiser les priorités et suivre la progression en individuel comme en équipe.",
    cta: "Découvrir MyPlanningAI",
  },
  {
    href: "/chatlaya",
    label: "ChatLAYA",
    eyebrow: "Copilote",
    description:
      "ChatLAYA sert de copilote conversationnel pour clarifier une demande et soutenir l'exécution avec plus de fluidité.",
    cta: "Découvrir ChatLAYA",
  },
];

const V1_DIFFERENTIATORS = [
  "Des cas réels, pas des démonstrations vides.",
  "Une trajectoire guidée, pas une navigation floue.",
  "Une exécution encadrée, pas un simple contenu à consulter.",
  "Des résultats utiles et défendables pour avancer.",
];

export default function HomePage() {
  if (IS_V1_SIMPLE) {
    return (
      <div className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,248,255,0.98))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <div className="absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_62%)]" aria-hidden />
            <div className="absolute -left-20 top-8 h-48 w-48 rounded-full bg-sky-100/60 blur-3xl" aria-hidden />
            <div className="relative grid gap-8 lg:grid-cols-[1.45fr_0.9fr] lg:items-center">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700">
                    KORYXA
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    Trajectoire • progression • opportunités
                  </span>
                </div>

                <div className="max-w-3xl space-y-4">
                  <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
                    KORYXA transforme des besoins réels en trajectoires guidées, missions concrètes et opportunités utiles.
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    La plateforme combine diagnostic, matching, progression pilotée, exécution et validation pour
                    orienter chaque personne vers la bonne trajectoire, et chaque organisation vers des résultats utiles.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link href="/trajectoire" className="btn-primary">
                    Explorer les trajectoires
                  </Link>
                  <Link href="/entreprise#deposer" className="btn-secondary">
                    Déposer un besoin entreprise
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {V1_SIGNAL_ITEMS.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/80 bg-white/75 px-4 py-4 text-sm font-medium text-slate-700 shadow-[0_14px_34px_rgba(148,163,184,0.16)] backdrop-blur"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Pourquoi c’est différent</p>
                  <div className="mt-5 grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold">Des cas réels, pas des démonstrations vides</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Chaque trajectoire ou mission part d'un besoin utile au terrain : structuration, reporting,
                        automatisation, analyse ou pilotage.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold">Une exécution encadrée</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        KORYXA clarifie les attentes, suit l'avancement et aide à maintenir un niveau de résultat plus professionnel.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-[24px] border border-slate-200/80 bg-white/88 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trajectoire</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">Diagnostic, progression pilotée et validation</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/80 bg-white/88 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Entreprise</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">Transformer un besoin en mission structurée</p>
                  </div>
                  <div className="rounded-[24px] border border-slate-200/80 bg-white/88 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Produits</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">Piloter l'action avec les bons outils</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[34px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mode opératoire</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Comment KORYXA fonctionne</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600">
                KORYXA part d'un besoin réel, identifie la bonne trajectoire, structure la mission, suit l'exécution et aboutit à une restitution utile.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {V1_FLOW.map((item, index) => (
                <article
                  key={item.title}
                  className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))] p-6"
                >
                  <div className="absolute right-5 top-5 text-5xl font-semibold tracking-[-0.08em] text-slate-200">
                    0{index + 1}
                  </div>
                  <div className="relative max-w-xs">
                    <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {V1_ENTRY_POINTS.map((item) => (
              <article
                key={item.label}
                className="rounded-[32px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{item.eyebrow}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{item.label}</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{item.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {item.bullets.map((bullet) => (
                    <span
                      key={bullet}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={item.href} className="btn-primary">
                    {item.cta}
                  </Link>
                  <Link href={item.secondary.href} className="btn-secondary">
                    {item.secondary.label}
                  </Link>
                </div>
              </article>
            ))}
          </section>

          <section className="rounded-[34px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Produits KORYXA</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Les outils de l’écosystème</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-600">
                L’écosystème KORYXA inclut aussi des outils opérationnels pour structurer l'action, suivre la progression et piloter l'exécution.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {V1_PRODUCTS.map((product) => (
                <article
                  key={product.label}
                  className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{product.eyebrow}</p>
                  <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{product.label}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{product.description}</p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={product.href} className="btn-primary">
                      {product.cta}
                    </Link>
                    <Link href="/products" className="btn-secondary">
                      Voir les produits
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#0b2742)] p-6 text-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Différenciation</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Une plateforme plus claire pour relier progression, exécution et besoins réels.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                  KORYXA ne vend pas une logique scolaire. La plateforme structure un cadre d'action utile, lisible et défendable pour les organisations comme pour les utilisateurs.
                </p>
              </div>

              <div className="grid gap-3">
                {V1_DIFFERENTIATORS.map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/12 bg-white/8 p-4 text-sm font-medium leading-6 text-slate-100">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[34px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Passer à l'action</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl text-slate-950">
                  Choisissez votre point d'entrée.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Que vous vouliez structurer une progression, cadrer un besoin ou découvrir les outils de l'écosystème,
                  KORYXA vous aide à passer plus vite à l'action.
                </p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-slate-200/80 bg-slate-50/90 p-5">
                  <div className="flex flex-wrap gap-3">
                    <Link href="/trajectoire#demarrer" className="btn-primary">
                      Commencer ma trajectoire
                    </Link>
                    <Link href="/entreprise#deposer" className="btn-secondary">
                      Déposer un besoin entreprise
                    </Link>
                    <Link
                      href="/products"
                      className="inline-flex items-center rounded-full border border-slate-300/80 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      Découvrir les produits KORYXA
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-3 pb-12 pt-16 sm:space-y-14 sm:px-0 sm:pt-0">
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
                IA • Transparence • Equite
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl sm:text-5xl">
                Transformez vos besoins en opportunites actionnables
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Publiez un besoin, structurez-le avec l'IA, puis suivez le matching et les quotas d'equite. Un seul espace pour vos missions, talents et copilotes KORYXA.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/opportunities" className="btn-primary">
                Voir le pipeline
              </Link>
              <Link href="/missions/new" className="btn-secondary">
                Poster un besoin
              </Link>
              <Link href="/equity" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                Regles d'equite →
              </Link>
            </div>
          </div>
          <div className="space-y-3 rounded-3xl border border-sky-100 bg-white/95 p-5 shadow-lg shadow-sky-200/40 backdrop-blur sm:p-6">
            <p className="text-sm font-semibold text-slate-900">Copilotes et modules</p>
            <div className="grid gap-2 text-sm text-slate-700">
              <Link href="/opportunities" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">Pipeline opportunites</Link>
              <Link href="/talents" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">Talents et disponibilite</Link>
              <Link href="/marketplace" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">Marketplace et offres</Link>
              <Link href="/chatlaya" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">CHATLAYA</Link>
              <Link href="/myplanning" className="rounded-xl border border-slate-100 px-3 py-2 hover:border-sky-200 hover:text-sky-700">MyPlanning</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className={SECTION_TITLE}>Modules KORYXA</h2>
          <Link href="/resources" className="text-sm font-semibold text-sky-700">
            Voir la documentation
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Opportunites et missions</p>
            <p className="mt-2 text-sm text-slate-600">Publier des besoins, suivre les statuts et associer des offres.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/opportunities" className="btn-secondary">
                Pipeline
              </Link>
              <Link href="/missions/new" className="btn-primary">
                Nouveau besoin
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Talents et Marketplace</p>
            <p className="mt-2 text-sm text-slate-600">Profils, bundles, services et offres packagees.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/marketplace" className="btn-secondary">
                Decouvrir
              </Link>
              <Link href="/talents" className="btn-secondary">
                Talents
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Copilotes IA</p>
            <p className="mt-2 text-sm text-slate-600">CHATLAYA, MyPlanning, Studio IA.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/chatlaya" className="btn-secondary">
                CHATLAYA
              </Link>
              <Link href="/myplanning" className="btn-secondary">
                MyPlanning
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:grid sm:grid-cols-2 sm:gap-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Equite et NeedIndex</h3>
          <p className="text-sm text-slate-600">
            Configurez les quotas min/max par pays et auditez les attributions. Tous les reglages sont documentes.
          </p>
          <Link href="/equity" className="btn-secondary w-fit">
            Consulter
          </Link>
        </div>
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">Regles IA et RAG</h3>
          <p className="text-sm text-slate-600">Sources, prompts et gouvernance centralises dans le module Moteur IA.</p>
          <Link href="/engine" className="btn-secondary w-fit">
            Configurer
          </Link>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, GraduationCap, Users } from "lucide-react";
import { productList } from "./products/data";

export const metadata: Metadata = {
  title: "Accueil | KORYXA",
  description:
    "KORYXA structure les besoins IA des entreprises, active les trajectoires IA et connecte talents, formateurs, missions et produits dans une plateforme premium.",
  openGraph: {
    title: "Accueil | KORYXA",
    description:
      "KORYXA structure les besoins IA des entreprises, active les trajectoires IA et connecte talents, formateurs, missions et produits dans une plateforme premium.",
    url: "/",
  },
  twitter: {
    title: "Accueil | KORYXA",
    description:
      "KORYXA structure les besoins IA des entreprises, active les trajectoires IA et connecte talents, formateurs, missions et produits dans une plateforme premium.",
  },
};

const HERO_METRICS = [
  { value: "4", label: "Piliers orchestrés", detail: "Entreprise, trajectoire, produits et communauté" },
  { value: "24h", label: "Temps de cadrage", detail: "Pour transformer un besoin IA en plan exécutable" },
  { value: "Premium", label: "Positionnement", detail: "Expérience haut de gamme pour des parcours réels" },
];

const PLATFORM_PILLARS = [
  {
    icon: BriefcaseBusiness,
    title: "Entreprise",
    description: "Structurez un besoin IA concret, clarifiez les priorités et déclenchez la bonne exécution.",
    href: "/entreprise",
    cta: "Explorer l’offre entreprise",
  },
  {
    icon: GraduationCap,
    title: "Trajectoire",
    description: "Orientez les talents vers les métiers IA, les preuves attendues et les bons formateurs.",
    href: "/trajectoire",
    cta: "Voir les trajectoires",
  },
  {
    icon: Bot,
    title: "Produits",
    description: "Activez les outils KORYXA qui prolongent l’apprentissage, l’analyse et l’exécution.",
    href: "/produits",
    cta: "Découvrir les produits",
  },
  {
    icon: Users,
    title: "Communauté",
    description: "Connectez entreprises, talents et experts dans un réseau IA organisé autour de cas réels.",
    href: "/communaute",
    cta: "Entrer dans la communauté",
  },
];

const ORCHESTRATION_STEPS = [
  {
    step: "01",
    title: "Exprimer un besoin IA",
    text: "Le point d’entrée n’est pas un buzzword. KORYXA part d’un besoin métier clair, d’un objectif et d’un contexte.",
  },
  {
    step: "02",
    title: "Activer la bonne trajectoire",
    text: "La plateforme oriente vers le bon produit, le bon parcours ou la bonne combinaison de ressources humaines.",
  },
  {
    step: "03",
    title: "Prouver la progression",
    text: "Chaque étape est reliée à des preuves, à une montée en capacité et à des signaux de qualité visibles.",
  },
  {
    step: "04",
    title: "Transformer en impact",
    text: "Opportunités, missions, accompagnement et exécution utile sont activés au moment où le système est prêt.",
  },
];

const FOCUS_AREAS = [
  "Analyse et lecture de données",
  "Modèles prédictifs et aide à la décision",
  "Automatisation intelligente des opérations",
  "Assistants IA et copilotes métier",
];

export default function HomePage() {
  return (
    <main className="space-y-0">
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[linear-gradient(135deg,#0f223d_0%,#112846_38%,#13375d_72%,#16476f_100%)] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(120,155,190,0.18) 1.2px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div aria-hidden className="absolute inset-y-0 right-[-8%] w-[46%] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.18),transparent_64%)]" />
        <div aria-hidden className="absolute left-[-10%] top-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div aria-hidden className="absolute bottom-[-10%] right-[14%] h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-[var(--marketing-max-w)] flex-col px-4 pb-16 pt-20 sm:px-6 md:justify-center md:pb-24 md:pt-24 lg:px-8">
          <div className="mx-auto max-w-[70rem] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-200 shadow-[0_0_0_1px_rgba(14,165,233,0.08)] backdrop-blur">
              <span className="text-base leading-none">✦</span>
              Plateforme premium d&apos;orchestration IA
            </div>

            <h1 className="kx-display mt-8 text-[3.35rem] font-semibold leading-[0.95] tracking-[-0.08em] text-white sm:text-[4.6rem] lg:text-[6.4rem]">
              Structurez vos besoins IA.
              <span className="mt-3 block bg-[linear-gradient(90deg,#40b8ff_0%,#17d3d2_52%,#1de39f_100%)] bg-clip-text text-transparent">
                Bâtissez vos carrières IA.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-[58rem] text-lg leading-9 text-slate-200 sm:text-[1.55rem] sm:leading-[2.6rem]">
              KORYXA connecte entreprises, talents, formateurs et missions dans un écosystème
              d&apos;excellence pour l&apos;intelligence artificielle appliquée.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/entreprise/demarrer"
                className="inline-flex min-w-[18rem] items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#0f9ae8_0%,#1492dc_100%)] px-7 py-4 text-lg font-semibold text-white shadow-[0_22px_60px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_66px_rgba(14,165,233,0.35)]"
              >
                Exprimer un besoin IA
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/trajectoire/demarrer"
                className="inline-flex min-w-[18rem] items-center justify-center gap-3 rounded-2xl border border-white/16 bg-white/10 px-7 py-4 text-lg font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/14"
              >
                Démarrer une trajectoire
                <ArrowUpRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_METRICS.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[28px] border border-white/10 bg-white/[0.08] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur"
                >
                  <p className="text-3xl font-semibold tracking-[-0.05em] text-white">{metric.value}</p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">{metric.label}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{metric.detail}</p>
                </article>
              ))}
            </div>

            <article className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.08))] p-6 shadow-[0_24px_64px_rgba(15,23,42,0.2)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">Positionnement</p>
              <h2 className="kx-display mt-4 text-[2rem] font-semibold leading-[1.05] tracking-[-0.06em] text-white sm:text-[2.5rem]">
                Une interface premium pour piloter l’IA appliquée.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Le prototype montre une promesse claire: même marque, même plateforme, plusieurs parcours reliés
                entre eux. Cette landing raconte cette orchestration avec un langage plus haut de gamme et plus net.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f3f8fd] px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[var(--marketing-max-w)]">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Plateforme KORYXA</p>
              <h2 className="kx-display mt-4 text-[2.8rem] font-semibold leading-[1.02] tracking-[-0.07em] sm:text-[4rem]">
                Une même architecture pour connecter besoin, apprentissage et exécution.
              </h2>
            </div>
            <p className="max-w-[44rem] text-[1.05rem] leading-8 text-slate-600 lg:justify-self-end">
              Le prototype place KORYXA comme une plateforme premium d’orchestration IA. La homepage est donc
              reconstruite autour de quatre blocs clairs, reliés par une logique de progression.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLATFORM_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="group rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_54px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_28px_66px_rgba(15,23,42,0.1)]"
                >
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e0f2fe_0%,#dcfce7_100%)] text-sky-700">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-[1.75rem] font-semibold tracking-[-0.05em] text-slate-950">{pillar.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{pillar.description}</p>
                  <Link
                    href={pillar.href}
                    className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:text-emerald-600"
                  >
                    {pillar.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[var(--marketing-max-w)] gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[36px] bg-[linear-gradient(135deg,#eaf6ff_0%,#ffffff_65%)] p-7 shadow-[0_22px_60px_rgba(15,23,42,0.06)] sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Offre entreprise</p>
            <h2 className="kx-display mt-4 text-[2.4rem] font-semibold leading-[1.03] tracking-[-0.06em] text-slate-950 sm:text-[3.35rem]">
              Les besoins IA que KORYXA peut cadrer et transformer en action.
            </h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {FOCUS_AREAS.map((area) => (
                <div key={area} className="rounded-[24px] border border-slate-200/80 bg-white/90 px-5 py-4 text-sm font-semibold text-slate-700 shadow-[0_8px_22px_rgba(148,163,184,0.08)]">
                  {area}
                </div>
              ))}
            </div>
            <Link href="/entreprise/demarrer" className="btn-primary mt-8">
              Démarrer un cadrage
            </Link>
          </article>

          <article className="rounded-[36px] bg-[linear-gradient(135deg,#10223b_0%,#133659_55%,#145e7b_100%)] p-7 text-white shadow-[0_26px_72px_rgba(15,23,42,0.18)] sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Orchestration</p>
            <h2 className="kx-display mt-4 text-[2.25rem] font-semibold leading-[1.04] tracking-[-0.06em] sm:text-[3.1rem]">
              De l’intention à l’impact, sans casser le parcours.
            </h2>
            <div className="mt-8 grid gap-4">
              {ORCHESTRATION_STEPS.map((item) => (
                <article key={item.step} className="rounded-[24px] border border-white/10 bg-white/[0.06] px-5 py-5 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-cyan-100">
                      {item.step}
                    </span>
                    <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-[linear-gradient(180deg,#ffffff_0%,#eef7fb_100%)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[var(--marketing-max-w)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[48rem]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Produits reliés</p>
              <h2 className="kx-display mt-4 text-[2.5rem] font-semibold leading-[1.03] tracking-[-0.06em] text-slate-950 sm:text-[3.5rem]">
                Des produits utiles, raccordés à la plateforme et non posés à côté.
              </h2>
            </div>
              <Link href="/produits" className="inline-flex items-center gap-2 text-base font-semibold text-sky-700">
                Voir tous les produits
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {productList.slice(0, 3).map((product) => (
              <article
                key={product.slug}
                className="rounded-[30px] border border-slate-200/80 bg-white p-7 shadow-[0_20px_54px_rgba(15,23,42,0.06)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{product.tagline}</p>
                <h3 className="mt-4 text-[1.85rem] font-semibold leading-[1.08] tracking-[-0.05em] text-slate-950">
                  {product.name}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{product.summary}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.highlights.slice(0, 2).map((item) => (
                    <span
                      key={item}
                      className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={`/produits/${product.slug}`} className="btn-primary">
                    Voir la fiche
                  </Link>
                  <Link href={product.primaryCta.href} className="btn-secondary">
                    {product.primaryCta.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

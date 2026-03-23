import type { Metadata } from "next";
import Link from "next/link";
import { productList } from "./products/data";

export const metadata: Metadata = {
  title: "Accueil | KORYXA",
  description:
    "KORYXA structure les besoins IA des entreprises, pilote la montée en compétence vers les métiers IA et active un réseau de formateurs, talents et missions.",
  openGraph: {
    title: "Accueil | KORYXA",
    description:
      "KORYXA structure les besoins IA des entreprises, pilote la montée en compétence vers les métiers IA et active un réseau de formateurs, talents et missions.",
    url: "/",
  },
  twitter: {
    title: "Accueil | KORYXA",
    description:
      "KORYXA structure les besoins IA des entreprises, pilote la montée en compétence vers les métiers IA et active un réseau de formateurs, talents et missions.",
  },
};

const SIGNALS = [
  "Besoins IA cadrés et exécutables",
  "Trajectoires IA pilotées et validées",
  "Réseau de formateurs, talents et missions",
];

const ENTERPRISE_SUITES = [
  {
    title: "Analyse & lecture de données",
    description: "Dashboards, analyses descriptives, recommandations et lecture de tendances pour la décision.",
  },
  {
    title: "Modèles explicatifs & prédictifs",
    description: "Comprendre les leviers, projeter des scénarios, identifier des risques et prioriser les actions.",
  },
  {
    title: "Automatisation intelligente",
    description: "Tâches répétitives, reporting, workflows, collecte, transformation et diffusion automatisée.",
  },
  {
    title: "Chatbots & assistants",
    description: "Assistants métier, FAQ internes, copilotes documentaires et interfaces de clarification.",
  },
];

const TRAJECTORIES = [
  {
    title: "Data Analyst",
    description: "Lecture métier des données, dashboards, storytelling analytique et aide à la décision.",
  },
  {
    title: "Data Engineer",
    description: "Flux de données, structuration, pipelines, qualité et fondations techniques durables.",
  },
  {
    title: "ML / IA appliquée",
    description: "Modèles utiles, expérimentation encadrée, cas d'usage concrets et supervision humaine.",
  },
];

const ORCHESTRATION_FLOW = [
  {
    step: "01",
    title: "Cadrer le besoin",
    text: "L'entreprise ou le talent entre par un besoin réel, jamais par une promesse floue.",
  },
  {
    step: "02",
    title: "Orienter et activer",
    text: "KORYXA recommande la bonne trajectoire, le bon mode de traitement et les bons partenaires.",
  },
  {
    step: "03",
    title: "Prouver et valider",
    text: "La progression est reliée à des preuves, à des validations et à des signaux de qualité.",
  },
  {
    step: "04",
    title: "Exécuter réellement",
    text: "Missions, opportunités, accompagnement et capacité humaine sont activés au bon moment.",
  },
];

const ECOSYSTEM_CARDS = [
  {
    eyebrow: "Réseau IA",
    title: "Une communauté intégrée pour discuter d'IA, de métiers et de cas d'usage.",
    description:
      "Groupes thématiques, posts, échanges à forte valeur, messages directs et circulation de signal autour des métiers IA.",
    href: "/community",
    label: "Explorer le réseau",
  },
  {
    eyebrow: "Formateurs",
    title: "Des partenaires de capacité, pas une simple place de marché de coachs.",
    description:
      "Spécialité, charge, capacité mensuelle, supervision, validation et contribution potentielle aux besoins entreprise.",
    href: "/formateurs",
    label: "Voir les formateurs",
  },
  {
    eyebrow: "Talents",
    title: "Des profils activables reliés à une trajectoire, des preuves et une readiness.",
    description:
      "Les profils KORYXA doivent montrer disponibilité, signal de sérieux, validation et potentiel d'affectation.",
    href: "/talents",
    label: "Voir les talents",
  },
];

export default function HomePage() {
  return (
    <main className="grid gap-10">
      <section className="relative overflow-hidden rounded-[48px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(238,247,255,0.98))] px-7 py-9 shadow-[0_34px_94px_rgba(15,23,42,0.08)] sm:px-10 lg:px-12 lg:py-11">
        <div className="absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.2),transparent_62%)]" aria-hidden />
        <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.32fr)_minmax(360px,0.9fr)] lg:items-start">
          <div className="space-y-7">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-sky-700">
                KORYXA
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                besoins IA • trajectoires IA • exécution réelle
              </span>
            </div>

            <div className="max-w-[54rem] space-y-5">
              <h1 className="kx-display max-w-[10.6ch] text-[3.5rem] font-semibold leading-[0.94] text-slate-950 sm:text-[4.35rem] lg:text-[5.8rem]">
                La plateforme premium pour structurer les besoins IA et faire grandir les capacités IA.
              </h1>
              <p className="max-w-[41rem] text-[1.06rem] leading-8 text-slate-600 sm:text-[1.18rem]">
                KORYXA relie les besoins IA/data des entreprises, la montée en compétence vers les métiers IA,
                l'activation de formateurs partenaires, la validation des profils et l'accès à des missions ou
                opportunités réelles.
              </p>
            </div>

            <div className="grid gap-3 sm:max-w-[42rem] sm:grid-cols-[max-content_max-content]">
              <Link href="/entreprise/demarrer" className="btn-primary w-full justify-center sm:w-auto">
                Décrire un besoin entreprise
              </Link>
              <Link href="/trajectoire/demarrer" className="btn-secondary w-full justify-center sm:w-auto">
                Commencer une trajectoire
              </Link>
              <Link href="/community" className="btn-secondary w-full justify-center sm:w-auto">
                Rejoindre le réseau IA
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {SIGNALS.map((signal) => (
                <div key={signal} className="min-h-[5.8rem] rounded-[26px] border border-white/85 bg-white/78 px-5 py-4 text-[1.02rem] font-semibold leading-7 text-slate-700 shadow-[0_18px_36px_rgba(148,163,184,0.14)] backdrop-blur">
                  {signal}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 pt-2">
            <article className="rounded-[36px] border border-slate-200/80 bg-slate-950 p-7 text-white shadow-[0_28px_64px_rgba(15,23,42,0.22)]">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-200">Pourquoi KORYXA</p>
              <div className="mt-6 grid gap-5">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <p className="text-[1.02rem] font-semibold">Une logique d'orchestration</p>
                  <p className="mt-2 text-[1.02rem] leading-8 text-slate-300">
                    KORYXA ne vend pas de l'IA abstraite. La plateforme structure un besoin, active une trajectoire,
                    pilote la validation et connecte l'exécution au bon niveau.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                  <p className="text-[1.02rem] font-semibold">Une capacité humaine pilotée</p>
                  <p className="mt-2 text-[1.02rem] leading-8 text-slate-300">
                    Formateurs, talents certifiables, cockpit de progression, opportunités et mission matching doivent
                    fonctionner comme un système, pas comme des modules isolés.
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[30px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_16px_36px_rgba(148,163,184,0.14)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Entreprise</p>
                <p className="kx-display mt-3 text-[2.15rem] font-semibold leading-[1.12] text-slate-950">Besoins IA concrets, cadrage, pilote et livraison utile.</p>
              </div>
              <div className="rounded-[30px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_16px_36px_rgba(148,163,184,0.14)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trajectoire</p>
                <p className="kx-display mt-3 text-[2.15rem] font-semibold leading-[1.12] text-slate-950">Orientation, matching formateur, preuves et profil vérifié.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[40px] border border-slate-200/80 bg-white/94 p-7 shadow-[0_20px_52px_rgba(15,23,42,0.06)] sm:p-9 lg:p-10">
        <div className="grid gap-5 lg:grid-cols-[1.04fr_0.96fr] lg:items-end">
          <div className="max-w-[44rem]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Offre entreprise</p>
            <h2 className="kx-display mt-3 text-[2.8rem] font-semibold leading-[1.08] text-slate-950 sm:text-[3.45rem]">
              Les besoins IA/data que KORYXA structure et pilote
            </h2>
          </div>
          <p className="max-w-[34rem] text-[1.06rem] leading-8 text-slate-600 lg:justify-self-end">
            Les entreprises n'achètent pas un mot à la mode. Elles achètent un besoin cadré, un cas d'usage exécutable et un résultat utile.
          </p>
        </div>
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {ENTERPRISE_SUITES.map((suite) => (
            <article key={suite.title} className="min-h-[13.2rem] rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(249,251,255,0.94),rgba(255,255,255,0.99))] p-7 shadow-[0_10px_24px_rgba(148,163,184,0.08)]">
              <h3 className="kx-display text-[2.1rem] font-semibold leading-[1.12] text-slate-950">{suite.title}</h3>
              <p className="mt-5 text-[1.03rem] leading-8 text-slate-600">{suite.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[34px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Trajectoires phase 1</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Les trois métiers IA ouverts dès le lancement.
          </h2>
          <div className="mt-8 grid gap-4">
            {TRAJECTORIES.map((trajectory) => (
              <article key={trajectory.title} className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{trajectory.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{trajectory.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/trajectoire" className="btn-primary">
              Voir Trajectoire
            </Link>
            <Link href="/formateurs" className="btn-secondary">
              Comprendre le matching formateur
            </Link>
          </div>
        </article>

        <article className="rounded-[34px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Architecture de valeur</p>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Besoin entreprise vers cadrage KORYXA puis cas d'usage structure.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Diagnostic talent vers orientation IA puis matching avec formateur partenaire.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Progression vers preuves, validation, profil verifie puis mission ou opportunite.
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {ECOSYSTEM_CARDS.map((card) => (
          <article key={card.title} className="rounded-[32px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{card.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{card.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{card.description}</p>
            <Link href={card.href} className="mt-8 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">
              {card.label}
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-[34px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Écosystème produit</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Les outils qui prolongent KORYXA</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            KORYXA orchestre aussi un portefeuille produit utile, aligné avec la progression, l'exécution et les besoins métier.
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {productList.map((product) => (
            <article key={product.slug} className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{product.tagline}</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{product.name}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{product.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {product.highlights.slice(0, 2).map((item) => (
                  <span key={item} className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/products/${product.slug}`} className="btn-primary">
                  Voir la fiche
                </Link>
                <Link href={product.primaryCta.href} className="btn-secondary">
                  {product.primaryCta.label}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,#04111f,#0b2742_52%,#0e7490)] p-6 text-white shadow-[0_26px_68px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Mode opératoire</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Le prototype KORYXA doit raconter une orchestration, pas une accumulation d'écrans.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Ce produit doit toujours faire comprendre où l'on entre, quelle capacité KORYXA active, ce qui doit être
              prouvé et comment on passe d'un besoin réel à une trajectoire, puis à une exécution utile.
            </p>
          </div>
          <div className="grid gap-3">
            {ORCHESTRATION_FLOW.map((item) => (
              <article key={item.step} className="rounded-[24px] border border-white/12 bg-white/8 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-sky-100">
                    {item.step}
                  </span>
                  <p className="text-base font-semibold text-white">{item.title}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Compass,
  Cpu,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "A propos | KORYXA",
  description:
    "KORYXA est la premiere plateforme d'orchestration IA en Afrique. Un systeme complet qui relie cadrage, analyse, execution et delivery pour les entreprises et les talents.",
  keywords: [
    "plateforme IA Afrique",
    "orchestration IA",
    "startup IA Afrique",
    "data science Afrique",
    "intelligence artificielle entreprise",
  ],
};

const PLATFORM_BLOCKS = [
  {
    icon: Compass,
    title: "Formation IA",
    detail: "Clarifie les profils, la trajectoire et le plan d'action des talents.",
    href: "/trajectoire",
  },
  {
    icon: BriefcaseBusiness,
    title: "Entreprise",
    detail: "Cadre un besoin reel avant execution, avec un parcours structure.",
    href: "/entreprise",
  },
  {
    icon: Bot,
    title: "Service IA",
    detail: "Prend en charge l'execution: data, IA, automatisation, applications.",
    href: "/services-ia",
  },
  {
    icon: Sparkles,
    title: "ChatLAYA",
    detail: "Assistant pour lancer, structurer et vendre un projet de maniere claire.",
    href: "/chatlaya",
  },
] as const;

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "A propos de KORYXA",
  description: "KORYXA est la premiere plateforme d'orchestration IA en Afrique.",
  url: "https://koryxa.com/about",
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={aboutJsonLd} />
      <main className="space-y-0">

      <section className="kx-reveal-up relative overflow-hidden bg-[linear-gradient(140deg,#07162d_0%,#0b2345_46%,#123861_100%)] px-4 py-18 text-white sm:px-6 sm:py-24 lg:px-8">
        <div aria-hidden className="kx-animated-grid absolute inset-0 opacity-30" />
        <div aria-hidden className="kx-orb kx-orb-a" />
        <div aria-hidden className="kx-orb kx-orb-c" />

        <div className="relative mx-auto max-w-[var(--marketing-max-w)]">
          <div className="mx-auto max-w-4xl text-center">
            <div className="kx-hero-badge-pulse inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
              <Cpu className="h-4 w-4 text-sky-300" />
              A propos de KORYXA
            </div>
            <h1 className="kx-display mt-7 text-[2.4rem] font-semibold leading-[0.95] tracking-[-0.07em] sm:text-[4rem] lg:text-[4.8rem]">
              Nous transformons des besoins flous
              <span className="kx-title-gradient-loop mt-2 block">en execution metier claire.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-200 sm:text-[1.12rem] sm:leading-9">
              KORYXA n'est pas un outil isole. C'est un systeme complet qui relie cadrage, analyse,
              execution et delivery pour les entreprises et les talents.
            </p>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section className="bg-[#020617] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[var(--marketing-max-w)]">
            <div className="kx-stagger grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: "Notre probleme cible",
                  text: "Les projets echouent souvent avant le build: besoin mal cadre, priorites floues, execution non pilotee.",
                },
                {
                  icon: Sparkles,
                  title: "Notre reponse",
                  text: "Un parcours guide qui capte le contexte reel, structure les decisions et active le bon module KORYXA.",
                },
                {
                  icon: Zap,
                  title: "Notre promesse",
                  text: "Passer d'une intention a un livrable utile, mesurable et exploitable par le business.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="kx-kpi-card-glow kx-hover-lift kx-glow-card rounded-[26px] p-6">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-500/10 text-sky-400">
                      <Icon className="kx-kpi-icon-loop h-5 w-5" style={{ animationDelay: `${index * 0.25}s` }} />
                    </div>
                    <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-white">{item.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="bg-[#020617] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[var(--marketing-max-w)]">
            <div className="mb-8 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">La plateforme</p>
              <h2 className="kx-display mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[2.8rem]">
                Cinq briques, un meme langage metier.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Chaque brique couvre une etape. Ensemble, elles produisent une chaine complete de valeur.
              </p>
            </div>

            <div className="kx-stagger grid gap-4 lg:grid-cols-5">
              {PLATFORM_BLOCKS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="kx-kpi-card-glow kx-hover-lift kx-glow-card rounded-[24px] p-5">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-500/10 text-sky-400">
                      <Icon className="kx-module-icon-loop h-5 w-5" style={{ animationDelay: `${index * 0.2}s` }} />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{item.detail}</p>
                    <Link href={item.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200">
                      Ouvrir
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </ScrollReveal>

      <section className="kx-reveal-up relative overflow-hidden bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div aria-hidden className="kx-animated-grid absolute inset-0 opacity-15" />
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="kx-soft-float rounded-[30px] border border-slate-700 bg-slate-900/80 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Notre methode</p>
            <h2 className="kx-display mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.6rem]">
              4 etapes pour livrer proprement.
            </h2>
            <div className="mt-6 space-y-3">
              {[
                "1. Cadrer le besoin et les objectifs de decision",
                "2. Structurer les donnees, le scope et le plan d'execution",
                "3. Produire le livrable (analyse, systeme, application, agent)",
                "4. Accompagner l'adoption et les iterations",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-800/70 px-4 py-3">
                  <CheckCircle2 className="kx-check-loop mt-0.5 h-5 w-5 shrink-0 text-emerald-400" style={{ animationDelay: `${index * 0.2}s` }} />
                  <p className="text-sm leading-7 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="kx-soft-float rounded-[30px] border border-slate-700 bg-slate-900/80 p-6 sm:p-8" style={{ animationDelay: "0.4s" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Positionnement</p>
            <h2 className="kx-display mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.6rem]">
              Startup IA orientee impact business.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Nous ne vendons pas "de la techno". Nous vendons une execution qui aide une entreprise
              a mieux decider, mieux operer et mieux grandir.
            </p>
            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ce que vous obtenez</p>
              <ul className="mt-3 space-y-2">
                {[
                  "Un interlocuteur clair de la demande a la livraison",
                  "Un plan de travail transparent",
                  "Des livrables operationnels et pas cosmetiques",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-7 text-slate-200">
                    <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-sky-300" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(145deg,#061226_0%,#0c2140_48%,#103563_100%)] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div aria-hidden className="kx-animated-grid absolute inset-0 opacity-25" />
        <div className="relative mx-auto max-w-[var(--marketing-max-w)] text-center">
          <h2 className="kx-display mx-auto max-w-4xl text-[2.2rem] font-semibold leading-[0.95] tracking-[-0.07em] sm:text-[3.1rem]">
            KORYXA existe pour transformer l'intelligence
            <span className="kx-title-gradient-loop mt-2 block">en resultats concrets.</span>
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/services-ia"
              className="kx-cta-glow inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#0284c7)] px-8 py-4 text-base font-semibold text-white"
            >
              Ouvrir Service IA
              <ArrowRight className="kx-arrow-bounce h-4 w-4" />
            </Link>
            <Link
              href="/entreprise/demarrer"
              className="inline-flex items-center rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur"
            >
              Demarrer un cadrage
            </Link>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}


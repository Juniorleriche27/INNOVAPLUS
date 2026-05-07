import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCircle2,
  Compass,
  Cpu,
  FolderKanban,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import LiveSignalBars from "@/components/marketing/LiveSignalBars";
import LoopTypewriter from "@/components/marketing/LoopTypewriter";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CountUp from "@/components/ui/CountUp";
import GlowCard from "@/components/ui/GlowCard";
import AnimatedBeam from "@/components/ui/AnimatedBeam";
import AnimatedTicker from "@/components/ui/AnimatedTicker";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "KORYXA | Plateforme d'orchestration IA en Afrique — Formation IA, Entreprise, ChatLAYA",
  description:
    "KORYXA est la première plateforme d'orchestration IA en Afrique. Cadrez vos besoins, exécutez vos projets data et IA, activez vos talents avec Formation IA, Entreprise, Service IA et ChatLAYA.",
  keywords: [
    "plateforme IA Afrique",
    "orchestration IA",
    "service data intelligence artificielle",
    "Formation IA talent Afrique",
    "chatbot entreprise Afrique",
    "cadrage besoin IA",
    "data scientist Afrique",
  ],
  openGraph: {
    title: "KORYXA | L'IA qui transforme vos besoins en exécution",
    description:
      "La première plateforme d'orchestration IA orientée exécution en Afrique : cadrage, conception et livraison pour les entreprises et les talents.",
    url: "/",
    type: "website",
  },
};

const TICKER_ITEMS = [
  "Python",
  "Pandas",
  "NumPy",
  "SQL",
  "LLM",
  "Automation",
  "Forecasting",
  "Data Viz",
  "APIs",
  "MLOps",
] as const;

const KPI_ITEMS = [
  { icon: Cpu, label: "Briques connectees", value: 5, suffix: " modules", detail: "Formation IA, Entreprise, Service IA, ChatLAYA" },
  { icon: BriefcaseBusiness, label: "Exécution Service IA", value: 10, suffix: " offres", detail: "Data, IA, automatisations, applications et systèmes métier" },
  { icon: Target, label: "Qualification rapide", value: 72, suffix: "h", detail: "Premiere qualification et cadrage du besoin" },
  { icon: FolderKanban, label: "Mode livraison", value: 100, suffix: "%", detail: "De la demande au livrable exploitable" },
] as const;

const MODULE_ITEMS = [
  { icon: Compass, title: "Formation IA", description: "Profilage talent, trajectoire claire, plan d'action concret.", href: "/trajectoire", cta: "Démarrer Formation IA" },
  { icon: BriefcaseBusiness, title: "Entreprise", description: "Cadrage intelligent des besoins avant toute exécution.", href: "/entreprise", cta: "Cadrer un besoin" },
  { icon: Bot, title: "Service IA", description: "Exécution professionnelle : agents IA, modèles, applications et plateformes.", href: "/services-ia", cta: "Demander un service" },
  { icon: ChartNoAxesCombined, title: "Opportunités", description: "Pipeline de missions et activation commerciale sur les besoins qualifiés.", href: "/opportunites", cta: "Voir les opportunités" },
  { icon: Sparkles, title: "ChatLAYA", description: "Assistant de travail pour lancer, structurer et vendre un projet.", href: "/chatlaya", cta: "Ouvrir ChatLAYA" },
] as const;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "KORYXA",
  url: "https://koryxa.com",
  logo: "https://koryxa.com/logo.png",
  description: "Plateforme d'orchestration IA en Afrique — Formation IA, Entreprise, Service IA, ChatLAYA",
  areaServed: "Africa",
  knowsAbout: ["Intelligence Artificielle", "Data Science", "Machine Learning", "Automatisation"],
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "KORYXA Service IA",
  provider: { "@type": "Organization", name: "KORYXA" },
  description: "Services professionnels d'intelligence artificielle, data engineering, agents IA et automatisation en Afrique.",
  areaServed: "Africa",
  serviceType: "Intelligence Artificielle et Data",
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={serviceJsonLd} />
      <main className="space-y-0">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[linear-gradient(140deg,#020617_0%,#07111f_46%,#0b1a30_100%)] text-white">
          <AnimatedBeam />
          <div aria-hidden className="kx-animated-grid absolute inset-0 opacity-20" />
          <div aria-hidden className="kx-orb kx-orb-a" />
          <div aria-hidden className="kx-orb kx-orb-b" />
          <div aria-hidden className="kx-orb kx-orb-c" />
          <div aria-hidden className="kx-orb kx-orb-d" />
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={`p-${i}`}
              aria-hidden
              className="kx-particle"
              style={{ left: `${(i * 11) % 100}%`, top: `${(i * 23) % 100}%`, animationDelay: `-${i * 0.9}s`, animationDuration: `${10 + (i % 5) * 1.8}s` }}
            />
          ))}

          <div className="relative mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-[var(--marketing-max-w)] flex-col justify-center px-4 pb-20 pt-16 sm:min-h-[calc(100vh-80px)] sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
            <div className="mx-auto w-full max-w-5xl text-center">
              <div className="kx-hero-badge-pulse kx-reveal-up inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-sky-500/8 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                <Sparkles className="h-4 w-4 text-sky-300" />
                Plateforme d'orchestration IA en Afrique
              </div>

              <h1 className="mt-8 text-[2.5rem] font-semibold leading-[0.94] tracking-[-0.07em] sm:text-[4.2rem] lg:text-[5.3rem]">
                <span className="kx-title-gradient-loop kx-display block">KORYXA</span>
                <span className="mt-2 block text-white/90">la première plateforme d'orchestration IA en Afrique.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-4xl text-base leading-8 text-slate-300 sm:text-[1.15rem] sm:leading-9">
                De l'idée à la livraison concrète : Formation IA révèle les talents, Entreprise cadre les besoins,
                Service IA exécute, et ChatLAYA aide à lancer, structurer et vendre.
              </p>

              <div className="mt-6 text-sm font-semibold text-sky-200 sm:text-base">
                Nous construisons avec{" "}
                <LoopTypewriter
                  words={["Data Analysts", "Data Scientists", "Data Engineers", "AI Builders"]}
                  className="text-white"
                />
              </div>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/services-ia"
                  className="kx-cta-glow inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#0284c7_100%)] px-8 py-4 text-base font-semibold text-white shadow-[0_24px_58px_rgba(2,132,199,0.28)] sm:w-auto sm:min-w-[18rem]"
                >
                  Demander un service IA
                  <ArrowRight className="kx-arrow-bounce h-4 w-4" />
                </Link>
                <Link
                  href="/entreprise/demarrer"
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/12 bg-white/6 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto sm:min-w-[18rem]"
                >
                  Cadrer un besoin entreprise
                </Link>
              </div>

              <div className="mt-12">
                <AnimatedTicker items={TICKER_ITEMS} />
              </div>

              {/* ── Bloc collecte terrain ── */}
              <div className="mt-14 border-t border-white/10 pt-10">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Terrain africain</p>
                <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl lg:text-3xl">
                  Aidez KORYXA à comprendre les vrais problèmes du terrain africain.
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base sm:leading-8">
                  Parlez-nous d'un problème réel observé dans votre pays, votre ville, votre quartier ou votre secteur.
                  Chaque contribution aide KORYXA à mieux comprendre les réalités locales et à construire demain des
                  solutions plus utiles.
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/chatlaya?intent=problem_collector"
                    className="kx-cta-glow inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#0284c7_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(2,132,199,0.25)] sm:w-auto sm:min-w-[16rem]"
                  >
                    Partager un problème réel
                    <ArrowRight className="kx-arrow-bounce h-4 w-4" />
                  </Link>
                  <a
                    href="#modules-section"
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10 sm:w-auto sm:min-w-[16rem]"
                  >
                    Voir pourquoi c'est utile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="bg-[#020617] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[var(--marketing-max-w)]">
            <ScrollReveal>
              <div className="mb-8 max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Indicateurs d'exécution</p>
                <h2 className="kx-display mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[2.8rem]">
                  Un système pensé pour livrer, pas pour impressionner.
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {KPI_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <ScrollReveal key={item.label} delay={i * 0.08}>
                    <GlowCard as="article" className="h-full">
                      <div className="flex items-center justify-between gap-4">
                        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/8 text-sky-300">
                          <Icon className="kx-kpi-icon-loop h-5 w-5" style={{ animationDelay: `${i * 0.25}s` }} />
                        </div>
                        <p className="text-2xl font-semibold text-white">
                          <CountUp to={item.value} suffix={item.suffix} />
                        </p>
                      </div>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-300">{item.detail}</p>
                    </GlowCard>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Modules */}
        <section id="modules-section" className="bg-[#020617] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[var(--marketing-max-w)]">
            <ScrollReveal>
              <div className="mb-8 max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Écosystème produit</p>
                <h2 className="kx-display mt-3 text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[2.8rem]">
                  Chaque module a un rôle clair dans la chaîne de valeur.
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid gap-4 lg:grid-cols-5">
              {MODULE_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <ScrollReveal key={item.title} delay={i * 0.07}>
                    <GlowCard as="article" className="flex h-full flex-col">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/8 text-sky-300">
                        <Icon className="kx-module-icon-loop h-5 w-5" style={{ animationDelay: `${i * 0.2}s` }} />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-7 text-slate-400">{item.description}</p>
                      <Link href={item.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300">
                        {item.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </GlowCard>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Live Pulse + Methode */}
        <section className="bg-[#020617] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <ScrollReveal direction="left">
              <GlowCard as="article" className="rounded-[30px]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Activité en direct</p>
                <h2 className="kx-display mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.5rem]">
                  Un pipeline opérationnel en mouvement.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Le rythme de production suit un cycle clair : cadrage, audit, conception, tests et livraison.
                </p>
                <div className="mt-6">
                  <LiveSignalBars />
                </div>
              </GlowCard>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <GlowCard as="article" className="rounded-[30px]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400">Méthode</p>
                <h2 className="kx-display mt-3 text-[1.9rem] font-semibold tracking-[-0.05em] text-white sm:text-[2.5rem]">
                  Ce que KORYXA apporte en pratique.
                </h2>
                <div className="mt-6 space-y-3">
                  {[
                    "Une entrée claire selon votre besoin réel",
                    "Un cadrage métier avant le choix technique",
                    "Une exécution pilotée avec des livrables concrets",
                    "Un interlocuteur unique jusqu'a la mise en production",
                  ].map((item, i) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                      <CheckCircle2 className="kx-check-loop mt-0.5 h-5 w-5 shrink-0 text-emerald-400" style={{ animationDelay: `${i * 0.2}s` }} />
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden bg-[linear-gradient(145deg,#020617_0%,#07111f_44%,#0b1a30_100%)] px-4 py-16 text-white sm:px-6 lg:px-8">
          <AnimatedBeam />
          <div aria-hidden className="kx-animated-grid absolute inset-0 opacity-15" />
          <div className="relative mx-auto max-w-[var(--marketing-max-w)] text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                <Zap className="h-4 w-4 text-sky-300" />
                Commencer maintenant
              </div>
              <h2 className="kx-display mx-auto mt-6 max-w-4xl text-[2.15rem] font-semibold leading-[0.95] tracking-[-0.07em] sm:text-[3.2rem]">
                Vous avez un besoin data ou IA ?<br />
                Nous le transformons en exécution.
              </h2>
            </ScrollReveal>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/services-ia"
                className="kx-cta-glow inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#0284c7)] px-8 py-4 text-base font-semibold text-white"
              >
                Ouvrir Service IA
                <ArrowRight className="kx-arrow-bounce h-4 w-4" />
              </Link>
              <Link
                href="/chatlaya"
                className="inline-flex items-center rounded-2xl border border-white/12 bg-white/6 px-8 py-4 text-base font-semibold text-white backdrop-blur hover:bg-white/10"
              >
                Discuter avec ChatLAYA
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

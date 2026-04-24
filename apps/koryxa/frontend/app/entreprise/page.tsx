import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Entreprise | KORYXA",
  description:
    "Cadrez votre besoin IA en quelques minutes. KORYXA selectionne les profils data et IA qui correspondent — sans marketplace, sans tri. Plateforme B2B en Afrique.",
  keywords: ["cadrage besoin IA entreprise", "matching talent IA Afrique", "recrutement IA Afrique", "service IA B2B"],
};

export default function EntreprisePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Entreprise KORYXA",
    description: "Cadrez votre besoin IA — KORYXA selectionne les profils qui correspondent.",
    provider: { "@type": "Organization", name: "KORYXA" },
    areaServed: "Africa",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <main className="relative pb-16">
      <section className="px-2 pt-3 sm:px-2 sm:pt-4">
        <div className="mx-auto max-w-[var(--marketing-max-w)] space-y-5">

          {/* ── Hero ────────────────────────────────────────────────────── */}
          <div className="kx-reveal-up relative overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#0a1628_0%,#0f2443_55%,#0d3060_100%)] px-5 py-10 text-white sm:rounded-[40px] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div aria-hidden className="kx-animated-grid absolute inset-0 opacity-20" />
            <div aria-hidden className="kx-orb kx-orb-a opacity-45" />
            <div aria-hidden className="kx-orb kx-orb-c opacity-35" />
            {/* Texture */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(148,180,220,0.20) 1px, transparent 0)",
                backgroundSize: "30px 30px",
              }}
            />
            {/* Glow */}
            <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.15),transparent_70%)] sm:h-64 sm:w-64" />
            <div aria-hidden className="absolute -bottom-8 left-1/3 h-28 w-52 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.10),transparent_65%)] sm:h-48 sm:w-96" />

            <div className="relative mx-auto max-w-4xl">
              <div className="kx-hero-badge-pulse inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/12 px-4 py-2 text-xs font-semibold text-sky-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                Espace Entreprise — KORYXA
              </div>

              <h1 className="kx-shimmer-line mt-7 text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.06em] text-white sm:text-[3rem] lg:text-[3.6rem]">
                Vous ne cherchez pas.
                <span className="kx-title-gradient-loop mt-2 block">
                  On trouve pour vous.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-[1.08rem] sm:leading-[1.85]">
                Décrivez votre besoin en quelques minutes. Notre onboarding adaptatif pose
                les bonnes questions selon vos réponses. KORYXA analyse, structure et sélectionne
                les profils qui correspondent — sans que vous ayez à trier quoi que ce soit.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  href="/entreprise/demarrer"
                  className="kx-cta-glow inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-sky-500 px-7 py-3.5 text-sm font-semibold !text-white shadow-[0_14px_36px_rgba(14,165,233,0.30)] transition hover:-translate-y-0.5 hover:bg-sky-400 sm:w-auto"
                >
                  Cadrer mon besoin
                  <ArrowRight className="kx-arrow-bounce h-4 w-4" />
                </Link>
                <Link
                  href="/entreprise/demandes"
                  className="inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-semibold !text-white transition hover:bg-white/16 sm:w-auto"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Mes demandes
                </Link>
              </div>

              {/* Reassurance pills */}
              <div className="kx-stagger mt-8 flex flex-wrap gap-3">
                {[
                  "Parcours approfondi — résultat immédiat",
                  "Aucun compte requis pour commencer",
                  "Profils sélectionnés par l'IA",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/8 px-4 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Ce qui se passe après le cadrage ────────────────────────── */}
          <div className="kx-reveal-up overflow-hidden rounded-[28px] kx-glow-card sm:rounded-[36px]">
            <div className="border-b border-white/8 bg-white/4 px-5 py-5 sm:px-8 sm:py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-400">Comment ça marche</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
                De votre besoin aux bons profils — en 3 étapes.
              </h2>
            </div>

            <div className="kx-stagger grid gap-0 lg:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: BriefcaseBusiness,
                  color: "bg-sky-500/15 text-sky-300",
                  title: "Vous décrivez votre besoin",
                  text: "L'onboarding est adaptatif — chaque réponse oriente la question suivante. L'IA creuse jusqu'au vrai besoin, pas juste un titre de poste.",
                  detail: "Data & Reporting IA, Automatisation IA, Marketing IA, Sales CRM IA… 10 domaines IA, chacun avec son propre parcours de qualification approfondi.",
                },
                {
                  step: "02",
                  icon: Sparkles,
                  color: "bg-violet-500/15 text-violet-300",
                  title: "KORYXA analyse et structure",
                  text: "Votre besoin est qualifié, scoré et mis en correspondance avec les types de mission, domaines métier et modes de collaboration de notre référentiel commun.",
                  detail: "Le même référentiel que celui utilisé pour profiler chaque talent — c'est ce qui rend le matching précis.",
                },
                {
                  step: "03",
                  icon: Users,
                  color: "bg-emerald-500/15 text-emerald-300",
                  title: "Vous recevez les bons profils",
                  text: "3 à 5 profils sélectionnés — pas 80 candidatures. Chaque profil est scoré sur 5 axes : domaine, type de mission, mode de collab, disponibilité, compétences.",
                  detail: "Anonymes d'abord. KORYXA fait la mise en relation quand les deux côtés valident.",
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className={`kx-hover-lift flex flex-col gap-5 p-8 ${idx < 2 ? "lg:border-r lg:border-white/8" : ""} ${idx > 0 ? "border-t border-white/8 lg:border-t-0" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${item.color}`}>
                        <Icon className="kx-kpi-icon-loop h-5 w-5" style={{ animationDelay: `${idx * 0.18}s` }} />
                      </div>
                      <span className="text-[2rem] font-bold tracking-[-0.08em] text-white/30">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{item.title}</h3>
                      <p className="mt-2.5 text-sm leading-7 text-slate-300">{item.text}</p>
                    </div>
                    <div className="kx-kpi-card-glow mt-auto rounded-[14px] border border-white/8 bg-white/4 px-4 py-3.5">
                      <p className="text-[11.5px] leading-[1.7] text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Pourquoi pas une marketplace ────────────────────────────── */}
          <div className="kx-reveal-up grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">

            {/* Gauche — argument */}
            <div className="kx-hover-lift flex flex-col justify-center rounded-[28px] kx-glow-card p-6 sm:rounded-[36px] sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-400">Notre différence</p>
              <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-3xl">
                Pas une marketplace.<br />Un intermédiaire intelligent.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Sur Malt ou LinkedIn, vous publiez une offre et vous triez. KORYXA ne publie
                rien — il sélectionne. Parce qu'il connaît les deux côtés en profondeur :
                votre besoin structuré et le profil réel de chaque talent.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Pas de candidature publique — vous recevez une sélection",
                  "Matching sur le vrai besoin, pas sur des mots-clés",
                  "Profils construits avec le même référentiel que votre besoin",
                  "KORYXA reste intermédiaire jusqu'à la mise en relation",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-300">
                    <CheckCircle2 className="kx-check-loop mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/entreprise/demarrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold !text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition hover:bg-slate-700"
                >
                  Cadrer mon besoin maintenant
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Droite — comparaison visuelle */}
            <div className="kx-hover-lift flex flex-col gap-3 rounded-[28px] kx-glow-card p-6 sm:rounded-[36px] sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-400">Comparaison</p>
              {[
                {
                  label: "Marketplace classique",
                  items: ["Vous publiez une offre", "60–200 candidatures", "Vous triez seul", "Matching par mots-clés"],
                  good: false,
                },
                {
                  label: "KORYXA",
                  items: ["Vous décrivez votre besoin", "3–5 profils sélectionnés", "KORYXA fait la sélection", "Matching sémantique sur 5 axes"],
                  good: true,
                },
              ].map((block) => (
                <div
                  key={block.label}
                  className={`rounded-[20px] border p-5 ${
                    block.good
                      ? "border-emerald-500/20 bg-emerald-500/8"
                      : "border-white/8 bg-white/4 opacity-70"
                  }`}
                >
                  <p className={`mb-3 text-[11px] font-bold uppercase tracking-[0.2em] ${block.good ? "text-emerald-400" : "text-slate-500 line-through"}`}>
                    {block.label}
                  </p>
                  <div className="space-y-2">
                    {block.items.map((it) => (
                      <div key={it} className="flex items-center gap-2.5 text-sm text-slate-200">
                        {block.good
                          ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                          : <span className="h-4 w-4 flex-shrink-0 text-center text-xs leading-4 text-slate-400">—</span>
                        }
                        {it}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Accès direct aux outils ──────────────────────────────────── */}
          <div className="kx-reveal-up">
            <div className="mb-4 flex items-center gap-4">
              <h2 className="text-sm font-semibold text-white">Accès direct</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="kx-stagger grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  label: "Nouveau besoin",
                  desc: "Onboarding adaptatif IA. Résultat immédiat.",
                  href: "/entreprise/demarrer",
                  accent: "bg-sky-500/15 text-sky-300",
                  btn: "bg-sky-600 hover:bg-sky-700 text-white",
                },
                {
                  icon: Sparkles,
                  label: "Service IA",
                  desc: "Historique, scores et profils matchés.",
                  href: "/services-ia",
                  accent: "bg-emerald-500/15 text-emerald-300",
                  btn: "bg-emerald-600 hover:bg-emerald-700 text-white",
                },
                {
                  icon: LayoutDashboard,
                  label: "Mes demandes",
                  desc: "Historique, statuts et profils matchés.",
                  href: "/entreprise/demandes",
                  accent: "bg-white/8 text-slate-300",
                  btn: "bg-slate-800 hover:bg-slate-700 !text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.10)]",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="kx-kpi-card-glow flex flex-col rounded-[24px] kx-glow-card p-6"
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[13px] ${item.accent}`}>
                      <Icon className="kx-module-icon-loop h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-white">{item.label}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-6 text-slate-400">{item.desc}</p>
                    <Link
                      href={item.href}
                      className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${item.btn}`}
                    >
                      Ouvrir
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>
    </main>
    </>
  );
}

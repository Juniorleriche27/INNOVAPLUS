import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Entreprise | KORYXA",
  description:
    "Transformez un objectif métier en besoin structuré, mission claire et exécution pilotée avec KORYXA.",
  openGraph: {
    title: "Entreprise | KORYXA",
    description:
      "Transformez un objectif métier en besoin structuré, mission claire et exécution pilotée avec KORYXA.",
    url: "/entreprise",
  },
  twitter: {
    title: "Entreprise | KORYXA",
    description:
      "Transformez un objectif métier en besoin structuré, mission claire et exécution pilotée avec KORYXA.",
  },
};

const BENEFITS = [
  {
    title: "Objectif clarifié",
    text: "KORYXA vous aide à partir d’un objectif business ou opérationnel clair, pas d’un brief flou.",
  },
  {
    title: "Besoin structuré",
    text: "Le flow produit un besoin mieux qualifié, une mission exploitable et un mode de traitement recommandé.",
  },
  {
    title: "Exécution pilotée",
    text: "Le détail de l’exécution se pilote ensuite dans un cockpit KORYXA Entreprise adossé à MyPlanningAI.",
  },
];

const HOW_IT_WORKS = [
  {
    title: "1. Exprimer l’objectif ou le problème",
    text: "Vous partez d’un objectif concret à améliorer, structurer ou lancer.",
  },
  {
    title: "2. Recevoir un besoin structuré",
    text: "KORYXA clarifie le besoin, propose une mission et recommande le bon mode de traitement.",
  },
  {
    title: "3. Ouvrir le cockpit entreprise",
    text: "Le cockpit permet ensuite de piloter l’exécution, le suivi et la restitution dans MyPlanningAI.",
  },
];

export default function EntreprisePage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_62%)]" aria-hidden />
          <div className="relative max-w-3xl space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Entreprise
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                besoin structuré • exécution pilotée
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Exprimez votre besoin, KORYXA le transforme en plan d’action clair.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Décrivez ce que vous cherchez à améliorer, structurer ou lancer. KORYXA clarifie le besoin, propose un
                cadre d’exécution et vous oriente vers le bon cockpit.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/entreprise/demarrer" className="btn-primary w-full justify-center sm:w-auto">
                Commencer
              </Link>
              <Link href="#comment-ca-marche" className="btn-secondary w-full justify-center sm:w-auto">
                Voir comment ça marche
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {BENEFITS.map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
            >
              <p className="text-lg font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section
          id="comment-ca-marche"
          className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Comment ça marche</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Une logique simple en trois temps
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
              >
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/entreprise/demarrer" className="btn-primary w-full justify-center sm:w-auto">
              Commencer
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

const BENEFITS = [
  {
    title: "Piloter les priorités",
    description: "Centralisez tâches, échéances et vues d’exécution dans un cockpit unique, sobre et actionnable.",
  },
  {
    title: "Rendre la progression visible",
    description: "Suivez l’avancement réel, les points de blocage et les jalons utiles sans recréer plusieurs outils.",
  },
  {
    title: "Activer l’IA au bon endroit",
    description: "Coaching, synthèse et automatisations restent disponibles dans l’app, au service de l’exécution.",
  },
];

const MODULES = [
  "Dashboard quotidien et vues semaine",
  "Tâches, checklist, kanban et planning",
  "Stats, coaching IA, templates et automatisations",
];

export default function MyPlanningLandingPage() {
  const { user, initialLoggedIn } = useAuth();
  const isAuthenticated = initialLoggedIn || Boolean(user?.email);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.96))] px-6 py-8 shadow-sm sm:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
            MyPlanningAI
          </span>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
            Le moteur de pilotage qui fait agir, sans mélanger vitrine et exécution.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            MyPlanningAI reste le socle horizontal de pilotage. Il structure les tâches, l’exécution, les vues
            d’avancement et les automatismes. Les couches métier KORYXA viennent s’y brancher ensuite.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={isAuthenticated ? "/myplanning/app" : "/myplanning/signup"}
              className="inline-flex min-w-[176px] items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              {isAuthenticated ? "Ouvrir la plateforme" : "S’inscrire"}
            </Link>
            <Link
              href={isAuthenticated ? "/myplanning/profile" : "/myplanning/login"}
              className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
            >
              {isAuthenticated ? "Mon profil" : "Se connecter"}
            </Link>
            <Link
              href="/myplanning/pricing"
              className="inline-flex min-w-[140px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <article key={benefit.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-lg font-semibold text-slate-950">{benefit.title}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ce que porte MyPlanningAI</p>
          <div className="mt-4 grid gap-3">
            {MODULES.map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Alignement avec KORYXA</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              KORYXA attire, diagnostique et spécialise.
              <span className="font-semibold text-slate-950"> MyPlanningAI exécute, structure et pilote.</span>
            </p>
            <p>
              Dans la plateforme, on n’explique plus le produit. On l’utilise pour faire avancer les tâches, les
              preuves, les validations et les restitutions utiles.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/trajectoire" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
              Voir Trajectoire
            </Link>
            <Link href="/entreprise" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
              Voir Entreprise
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

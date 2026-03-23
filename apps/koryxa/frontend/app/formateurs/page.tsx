import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Formateurs partenaires | KORYXA",
  description:
    "Découvrez le réseau de formateurs partenaires KORYXA pour les métiers IA, l'accompagnement, la validation et la supervision.",
};

const TRAINERS = [
  {
    name: "Aminata D.",
    specialty: "Data Analyst",
    capacity: "8 apprenants / mois",
    quality: "96% de complétion",
    note: "Spécialisée en dashboards, lecture métier et validation de mini-livrables.",
  },
  {
    name: "Jean-Marc K.",
    specialty: "Data Engineer",
    capacity: "6 apprenants / mois",
    quality: "89% de validation",
    note: "Pipelines, qualité de données, orchestration et structuration de flux.",
  },
  {
    name: "Sarah T.",
    specialty: "ML / IA appliquée",
    capacity: "5 apprenants / mois",
    quality: "91% d'évaluations positives",
    note: "Modèles explicatifs, prototypes prédictifs et cadrage de cas d'usage.",
  },
];

const RULES = [
  "Les formateurs sont des partenaires sélectionnés, pas des comptes ouverts au hasard.",
  "Le matching prend en compte la spécialité, la charge, la disponibilité et la qualité réelle.",
  "Les formateurs peuvent aussi être activés sur des besoins entreprise en supervision ou accompagnement.",
];

export default function FormateursPage() {
  return (
    <main className="grid gap-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(242,248,255,0.98))] px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 w-[35%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_60%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                Formateurs partenaires
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                qualité • capacité • supervision
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                Un réseau de formateurs IA piloté comme une capacité stratégique.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                KORYXA ne traite pas ses formateurs comme des vendeurs de cours. Ce sont des partenaires de montée en
                compétence, de validation et parfois de supervision sur des besoins entreprise.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?redirect=%2Fformateurs" className="btn-primary w-full justify-center sm:w-auto">
                Candidater comme partenaire
              </Link>
              <Link href="/myplanning/formateurs" className="btn-secondary w-full justify-center sm:w-auto">
                Ouvrir l'espace partenaire
              </Link>
              <Link href="/community" className="btn-secondary w-full justify-center sm:w-auto">
                Voir le réseau IA
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Règles de qualité</p>
            <div className="mt-5 grid gap-3">
              {RULES.map((rule) => (
                <div key={rule} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {TRAINERS.map((trainer) => (
          <article key={trainer.name} className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{trainer.specialty}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{trainer.name}</h2>
              </div>
              <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                Partenaire
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{trainer.note}</p>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Capacité : {trainer.capacity}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                Qualité : {trainer.quality}
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

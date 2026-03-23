import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trajectoire | KORYXA",
  description:
    "Diagnostic d'orientation, matching formateur, progression, preuves, validation et profil vérifié pour les métiers IA.",
  openGraph: {
    title: "Trajectoire | KORYXA",
    description:
      "Diagnostic d'orientation, matching formateur, progression, preuves, validation et profil vérifié pour les métiers IA.",
    url: "/trajectoire",
  },
};

const TRAJECTORIES = [
  {
    title: "Data Analyst",
    text: "Dashboards, lecture métier, KPI, analyses descriptives, reporting et décision assistée.",
  },
  {
    title: "Data Engineer",
    text: "Qualité de données, pipelines, structuration, flux et fondations techniques fiables.",
  },
  {
    title: "ML / IA appliquée",
    text: "Modèles explicatifs, prédictifs, assistants, expérimentation utile et cas d'usage réels.",
  },
];

const SYSTEM_BLOCKS = [
  "Diagnostic d'orientation piloté par l'IA",
  "Validation de l'orientation par l'utilisateur",
  "Matching avec un formateur partenaire KORYXA",
  "Cockpit de progression, tâches et preuves",
  "Validation, profil vérifié et opportunités",
];

const FLOW = [
  {
    step: "01",
    title: "Diagnostiquer",
    text: "KORYXA comprend le profil, les préférences, le niveau et les objectifs pour recommander une trajectoire crédible.",
  },
  {
    step: "02",
    title: "Orienter et matcher",
    text: "Une fois l'orientation validée, le système propose les bons formateurs selon spécialité, capacité et qualité.",
  },
  {
    step: "03",
    title: "Prouver et progresser",
    text: "La progression s'appuie sur des tâches, des preuves soumises, des revues et des validations traçables.",
  },
  {
    step: "04",
    title: "Activer des opportunités",
    text: "Le profil validé alimente la readiness, les opportunités, les missions ou une affectation plus crédible.",
  },
];

export default function TrajectoirePage() {
  return (
    <main className="grid gap-8">
      <section className="relative overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,247,255,0.98))] px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_62%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Trajectoire
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                métiers IA • progression • validation
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                Montez en compétence sur les métiers IA avec un système piloté et prouvable.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Trajectoire n'est pas une simple page de formation. C'est un moteur d'orientation, de matching
                formateur, de progression, de preuves, de validation et d'activation vers des opportunités réelles.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/trajectoire/demarrer" className="btn-primary w-full justify-center sm:w-auto">
                Commencer le diagnostic
              </Link>
              <Link href="/formateurs" className="btn-secondary w-full justify-center sm:w-auto">
                Voir les formateurs partenaires
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Système Trajectoire</p>
            <div className="mt-5 grid gap-3">
              {SYSTEM_BLOCKS.map((block) => (
                <div key={block} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200">
                  {block}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {TRAJECTORIES.map((trajectory) => (
          <article key={trajectory.title} className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Parcours</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{trajectory.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{trajectory.text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[34px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Comment ça fonctionne</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Une chaîne de progression pilotée</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            Le produit doit relier le diagnostic, le matching, les preuves et l'activation d'opportunités au sein d'une seule logique.
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {FLOW.map((item) => (
            <article key={item.step} className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-700">
                {item.step}
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

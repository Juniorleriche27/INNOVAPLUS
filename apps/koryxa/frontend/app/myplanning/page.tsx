import Link from "next/link";

export const revalidate = 3600;

const WORKFLOW_STEPS = [
  {
    title: "Définir un cap clair",
    text: "Un objectif sur 1 à 4 semaines, mesurable et priorisé.",
  },
  {
    title: "Exécuter 3 actions par jour",
    text: "Une liste courte, réaliste, alignée sur l’impact réel.",
  },
  {
    title: "Piloter la progression",
    text: "KPI, statut des tâches, présence équipe et alertes.",
  },
];

const PRODUCT_POINTS = ["Priorités Eisenhower", "Kanban opérationnel", "Matrice temps / tâches", "Stats & graphiques"];

export default function MyPlanningLandingPage() {
  return (
    <div className="w-full space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-sm sm:p-10">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Product Home</p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-5xl">Plan clair, exécution nette.</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-700">3 actions par jour. Priorités visibles. Progrès piloté en continu.</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/myplanning/app"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
              >
                Commencer
              </Link>
              <Link
                href="/myplanning/enterprise/demo"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Voir une démo
              </Link>
            </div>
          </div>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Aperçu produit</p>
              <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold text-sky-700">LIVE UI</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tâches actives</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">12</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Complétées</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">78%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Impact élevé</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">6</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Retards</p>
                <p className="mt-2 text-2xl font-semibold text-rose-600">2</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
              Planning du jour, présence équipe, alertes et reporting unifiés dans le même shell.
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Workflow en 3 étapes</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Étape {index + 1}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-900">Pourquoi ça marche</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_POINTS.map((point) => (
            <article key={point} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{point}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";

export const revalidate = 3600;

export default function MyPlanningLandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/40 p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Planifie. Exécute. Apprends.</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-700">
          MyPlanning est une application de planification universelle : tâches, priorités, Kanban, Pomodoro et coaching IA.
          Commence en 2 minutes.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/myplanning/app" className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
            Ouvrir l’app
          </Link>
          <Link href="/myplanning/pricing" className="inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            Voir les tarifs
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Organisation universelle</p>
            <p className="mt-1 text-sm text-slate-600">Perso, pro, études : un seul cockpit, une seule logique.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Priorités claires</p>
            <p className="mt-1 text-sm text-slate-600">Eisenhower, MoSCoW, focus du jour, blocs de temps.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Coaching IA</p>
            <p className="mt-1 text-sm text-slate-600">Suggestions de tâches et planification rapide (beta).</p>
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500">Optionnel : Powered by KORYXA.</p>
      </section>
    </div>
  );
}


import Link from "next/link";

export const revalidate = 3600;

export default function MyPlanningLandingPage() {
  return (
    <div className="w-full space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-indigo-50/50 p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-5xl">
          Tu travailles beaucoup, mais tu n&apos;avances pas vraiment.
        </h1>
        <h2 className="mt-4 max-w-4xl text-base font-medium text-slate-700">
          MyPlanningAI transforme un objectif flou en 3 actions claires par jour, mesurables et alignées avec ce qui compte vraiment.
        </h2>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
          >
            Créer mon planning en 2 minutes (gratuit)
          </Link>
          <Link
            href="#how"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Voir comment ça marche
          </Link>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">Aujourd&apos;hui, pas demain. Ta journée devient claire dès la première utilisation.</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Avant / Après MyPlanningAI</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-600">Avant (sans MyPlanningAI)</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>Trop de tâches</li>
              <li>Pas de priorité claire</li>
              <li>Journées remplies, impact faible</li>
              <li>Recommencer chaque semaine à zéro</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Après (avec MyPlanningAI)</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>1 objectif clair (1-4 semaines)</li>
              <li>3 actions maximum par jour</li>
              <li>Priorités liées à l&apos;objectif</li>
              <li>Progression visible</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Comment ça marche</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Tu définis ton objectif (1-4 semaines)</p>
            <p className="mt-2 text-sm text-slate-600">Un cap clair pour éviter la dispersion.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">MyPlanningAI te propose 3 actions max pour aujourd&apos;hui</p>
            <p className="mt-2 text-sm text-slate-600">Court, exécutable, aligné avec l&apos;objectif.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Tu vois noir sur blanc si tu avances vraiment</p>
            <p className="mt-2 text-sm text-slate-600">Ton progrès devient visible, jour après jour.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Une IA utile, pas décorative.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">L&apos;IA ne décide pas à ta place</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Elle réduit le bruit</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Elle te force à prioriser: pas plus de 3 tâches, même si tu en as 20 en tête</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Tu gardes toujours le contrôle</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Pourquoi ils paient MyPlanningAI</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Étudiants sérieux</p>
            <p className="mt-2 text-sm text-slate-600">Réviser beaucoup sans savoir si c&apos;est utile.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Freelancers</p>
            <p className="mt-2 text-sm text-slate-600">Être occupé toute la journée sans livrer plus vite.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Entrepreneurs solo</p>
            <p className="mt-2 text-sm text-slate-600">Toucher à tout sans avancer sur l&apos;essentiel.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Essaye maintenant</h2>
        <p className="mt-2 text-sm text-slate-700">
          La valeur de MyPlanningAI se joue au premier jour: clarté, priorités, exécution.
        </p>
        <div className="mt-5">
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
          >
            Créer mon planning d&apos;aujourd&apos;hui (gratuit)
          </Link>
        </div>
      </section>
    </div>
  );
}

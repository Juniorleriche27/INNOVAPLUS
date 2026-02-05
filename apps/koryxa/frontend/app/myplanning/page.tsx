import Link from "next/link";

export const revalidate = 3600;

export default function MyPlanningLandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      {/* 1) HERO */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-indigo-50/50 p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-5xl">
          Planifie. Exécute. Avance vraiment.
        </h1>
        <p className="mt-4 max-w-3xl text-base text-slate-700">
          MyPlanning est un cockpit intelligent pour organiser tes tâches, prioriser ce qui compte et exécuter chaque jour sans t’éparpiller.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="/myplanning/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* 2) PROBLÈME */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-xl font-semibold text-slate-900">Tu n’as pas un problème de motivation.</h2>
        <p className="mt-2 text-sm text-slate-600">Tu as un problème de structure quotidienne.</p>
        <ul className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">Trop de tâches, pas de vraies priorités</li>
          <li className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">Journées chargées mais peu d’impact</li>
          <li className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">Difficulté à rester constant</li>
          <li className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">Planning abandonné après quelques jours</li>
        </ul>
        <p className="mt-5 text-sm text-slate-700">
          Le problème n’est pas le manque de motivation, mais le manque de structure quotidienne.
        </p>
      </section>

      {/* 3) SOLUTION */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Un seul cockpit pour décider et exécuter chaque jour</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          MyPlanning centralise les tâches, aide à prioriser, transforme les objectifs en actions quotidiennes, et accompagne avec l’IA.
        </p>
      </section>

      {/* 4) COMMENT ÇA MARCHE */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Comment ça marche</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-sm font-semibold text-slate-900">Clarifie tes priorités</p>
            <p className="mt-2 text-sm text-slate-600">(Eisenhower, Pareto, focus du jour)</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-sm font-semibold text-slate-900">Planifie ton temps</p>
            <p className="mt-2 text-sm text-slate-600">(jour, semaine, blocs de temps)</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-sm font-semibold text-slate-900">Exécute avec l’IA</p>
            <p className="mt-2 text-sm text-slate-600">(suggestions, ajustements, coaching)</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-sm font-semibold text-slate-900">Analyse ton impact</p>
            <p className="mt-2 text-sm text-slate-600">(statistiques, progression réelle)</p>
          </div>
        </div>
      </section>

      {/* 5) FONCTIONNALITÉS CLÉS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Fonctionnalités clés</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Priorités claires",
            "Planning quotidien & hebdomadaire",
            "Pomodoro & focus",
            "Statistiques & graphiques",
            "Coaching IA (beta)",
          ].map((label) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-sm font-semibold text-slate-900">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6) POUR QUI */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Pour qui ?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Étudiants", "Freelancers", "Entrepreneurs solo", "Professionnels"].map((label) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-sm font-semibold text-slate-900">
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* 7) DIFFÉRENCIATION */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Ce qui change vraiment</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">❌ To-do lists classiques</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">❌ Outils complexes</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">❌ Promesses vagues</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-sky-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">✅ Décision quotidienne</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">✅ Focus sur l’exécution</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">✅ IA utile, pas gadget</p>
          </div>
        </div>
      </section>

      {/* 8) LIEN KORYXA (discret) */}
      <section className="text-xs text-slate-500">
        Optionnel – Powered by KORYXA
        <br />
        Utilisé aussi comme planning d’apprentissage intelligent pour les parcours de formation.
      </section>

      {/* 9) CTA FINAL */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Reprends le contrôle de tes journées.</h2>
        <div className="mt-5">
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
          >
            Créer mon cockpit maintenant
          </Link>
        </div>
      </section>
    </div>
  );
}

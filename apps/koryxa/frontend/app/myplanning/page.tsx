import Link from "next/link";

export const revalidate = 3600;

export default function MyPlanningLandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      {/* HERO (above the fold) */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-indigo-50/50 p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 sm:text-5xl">
          Décide quoi faire. Exécute chaque jour. Vois ton impact.
        </h1>
        <h2 className="mt-4 max-w-3xl text-base font-medium text-slate-700">
          MyPlanning est un cockpit intelligent qui transforme tes objectifs en actions quotidiennes mesurables — avec ou sans IA.
        </h2>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/myplanning/app"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
          >
            Créer mon cockpit gratuitement
          </Link>
          <Link
            href="#how"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Voir comment ça marche
          </Link>
        </div>
      </section>

      {/* SECTION 2 — Problème réel (durci) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">
          Si tu travailles beaucoup mais avances peu, ce n’est pas un manque d’effort.
        </h2>
        <div className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            Tu fais trop de tâches sans savoir lesquelles comptent
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">Tu planifies mais tu n’exécutes pas</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">Tu exécutes mais tu ne mesures rien</div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">Tu recommences chaque semaine à zéro</div>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-700">MyPlanning existe pour casser ce cycle.</p>
      </section>

      {/* SECTION 3 — Différenciation produit (crucial) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Ce que MyPlanning fait que les autres ne font pas</h2>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[1fr_140px_140px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            <div>Fonction</div>
            <div className="text-center">MyPlanning</div>
            <div className="text-center">Autres outils</div>
          </div>

          {[
            "Décision quotidienne guidée",
            "Priorités réelles (impact)",
            "Mesure de l’exécution",
            "IA qui planifie concrètement",
            "Vue apprentissage / objectifs",
          ].map((label) => (
            <div
              key={label}
              className="grid grid-cols-[1fr_140px_140px] border-t border-slate-200 px-4 py-4 text-sm"
            >
              <div className="text-slate-800">{label}</div>
              <div className="text-center font-semibold text-emerald-700">✅</div>
              <div className="text-center font-semibold text-slate-400">❌</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — Comment ça marche (3 étapes) */}
      <section id="how" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Comment ça marche</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Tu définis ce qui compte</p>
            <p className="mt-2 text-sm text-slate-600">Objectifs, contraintes, temps réel disponible</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">MyPlanning structure ta journée</p>
            <p className="mt-2 text-sm text-slate-600">Priorités, blocs de temps, focus</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Tu vois ce qui avance vraiment</p>
            <p className="mt-2 text-sm text-slate-600">Statistiques, progression, décisions ajustées</p>
          </div>
        </div>
      </section>

      {/* SECTION 5 — IA */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Une IA utile, pas décorative.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Suggestions de priorités</p>
            <p className="mt-2 text-sm text-slate-600">Tu décides vite ce qui mérite ton énergie aujourd’hui.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Ajustement du planning</p>
            <p className="mt-2 text-sm text-slate-600">Le plan s’adapte à la réalité de ta journée.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Coaching léger</p>
            <p className="mt-2 text-sm text-slate-600">Des suggestions concrètes, sans discours.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Toujours sous contrôle</p>
            <p className="mt-2 text-sm text-slate-600">Tu acceptes, modifies, ou ignores.</p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — Cas d’usage (monétisation) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Pourquoi les gens paient pour MyPlanning</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Étudiants sérieux</p>
            <p className="mt-2 text-sm text-slate-600">Réussir sans s’éparpiller.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Freelancers</p>
            <p className="mt-2 text-sm text-slate-600">Livrer plus, mieux gérer le temps.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Entrepreneurs solo</p>
            <p className="mt-2 text-sm text-slate-600">Décider vite, exécuter mieux.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
            <p className="text-sm font-semibold text-slate-900">Professionnels</p>
            <p className="mt-2 text-sm text-slate-600">Structurer sans outil complexe.</p>
          </div>
        </div>
      </section>

      {/* Fonctionnalités (court, concret) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Fonctionnalités clés</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Décision quotidienne",
            "Priorités (impact)",
            "Planning jour & semaine",
            "Blocs de temps + focus",
            "Statistiques & progression",
            "Coaching IA (beta)",
          ].map((label) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-sm font-semibold text-slate-900">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lien KORYXA (discret) */}
      <section className="text-xs text-slate-500">
        Optionnel – Powered by KORYXA
        <br />
        Utilisé aussi comme planning d’apprentissage intelligent pour les parcours de formation.
      </section>

      {/* CTA final */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <h2 className="text-2xl font-semibold text-slate-900">Commence avec la version gratuite.</h2>
        <p className="mt-2 text-sm text-slate-700">Passe au niveau supérieur quand tu verras l’impact.</p>
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

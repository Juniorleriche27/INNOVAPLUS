import TrajectoryFlowClient from "./TrajectoryFlowClient";
import TrajectoryPartnersPanel from "./TrajectoryPartnersPanel";

const TRAJECTORY_SIGNAL_ITEMS = [
  "Onboarding intelligent",
  "Matching de trajectoire",
  "Ressources partenaires",
  "Progression suivie",
  "Score et validation",
];

const TRAJECTORY_STEPS = [
  {
    title: "Onboarding",
    text: "Le point de départ sert à comprendre le profil, le niveau actuel, les objectifs et le contexte.",
  },
  {
    title: "Diagnostic du profil",
    text: "KORYXA identifie les points d'appui, les écarts et les priorités à traiter en premier.",
  },
  {
    title: "Matching de trajectoire",
    text: "Le système recommande la bonne trajectoire, les étapes utiles et les ressources les plus pertinentes.",
  },
  {
    title: "Orientation vers partenaires et coachs",
    text: "La trajectoire peut pointer vers des organismes, des plateformes partenaires ou des coachs indépendants.",
  },
  {
    title: "Progression suivie",
    text: "L'avancement reste visible, avec des étapes, des preuves de progression et un pilotage plus clair.",
  },
  {
    title: "Score et validation",
    text: "KORYXA mesure la progression, attribue un score et qualifie le niveau de préparation.",
  },
  {
    title: "Orientation vers opportunités",
    text: "Une trajectoire validée ouvre ensuite vers une mission, un stage, une collaboration ou une opportunité qualifiée.",
  },
];

const KORYXA_VALUE = [
  {
    title: "Clarifier où commencer",
    text: "KORYXA aide à éviter la dispersion en donnant un point de départ plus lisible dès le diagnostic.",
  },
  {
    title: "Recommander quoi faire ensuite",
    text: "La plateforme indique les prochaines étapes, les bons partenaires et les ressources adaptées à chaque profil.",
  },
  {
    title: "Suivre la progression",
    text: "La progression n'est pas laissée au hasard : elle est pilotée, relue et structurée dans le temps.",
  },
  {
    title: "Relier cela à des opportunités",
    text: "Le but n'est pas seulement d'apprendre, mais d'arriver au bon niveau pour agir, contribuer et être visible.",
  },
];

const VALIDATION_ITEMS = [
  {
    title: "Score de progression",
    text: "Mesure l'avancement réel au fil des étapes et des validations.",
  },
  {
    title: "Score de readiness",
    text: "Aide à savoir quand un profil est prêt à passer à l'action ou à une opportunité.",
  },
  {
    title: "Preuves de progression",
    text: "Les preuves comptent : livrables, validations, étapes franchies et qualité des résultats.",
  },
  {
    title: "Niveau validé",
    text: "KORYXA ne se limite pas à recommander : la plateforme qualifie aussi le niveau atteint.",
  },
];

const OUTCOMES = [
  {
    title: "Mission",
    text: "Entrer sur une mission structurée avec un niveau de préparation plus crédible.",
  },
  {
    title: "Stage",
    text: "Accéder à un stage lorsque la trajectoire montre un niveau pertinent et validé.",
  },
  {
    title: "Collaboration",
    text: "Créer une collaboration ponctuelle ou suivie avec une organisation ou un partenaire.",
  },
  {
    title: "Besoin entreprise",
    text: "Être orienté vers des besoins déjà qualifiés dans l'espace Entreprise.",
  },
  {
    title: "Opportunité",
    text: "Passer d'une progression suivie à une opportunité utile, lisible et défendable.",
  },
];

export default function TrajectoirePage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_62%)]" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                  Trajectoire
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  diagnostic • validation • opportunités
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Trouvez la bonne trajectoire, pas juste une ressource de plus.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  KORYXA commence par un onboarding, analyse le profil, recommande une trajectoire, oriente vers les
                  bons partenaires, suit la progression, attribue un score et relie ensuite à des opportunités.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="#demarrer" className="btn-primary w-full justify-center sm:w-auto">
                  Commencer mon diagnostic
                </a>
                <a href="#logique" className="btn-secondary w-full justify-center sm:w-auto">
                  Comprendre la logique de trajectoire
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {TRAJECTORY_SIGNAL_ITEMS.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/80 bg-white/78 px-4 py-4 text-sm font-medium leading-6 text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_22px_54px_rgba(15,23,42,0.2)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Ce que KORYXA pilote</p>
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">La bonne direction</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    La trajectoire aide à savoir quoi apprendre, où progresser et avec qui avancer.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">Une progression démontrable</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    KORYXA ne se limite pas à recommander : la plateforme suit, score et valide.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="logique"
          className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mécanisme</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Comment fonctionne une trajectoire</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Une trajectoire n'est pas un catalogue. C'est un système d'orientation, de progression pilotée, de
              validation et de projection vers l'action.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TRAJECTORY_STEPS.map((item, index) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
              >
                <div className="absolute right-5 top-5 text-5xl font-semibold tracking-[-0.08em] text-slate-200">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="relative">
                  <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Valeur KORYXA</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Ce que KORYXA apporte vraiment</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              KORYXA n'est pas un catalogue de contenus. C'est une plateforme de trajectoire qui aide à savoir quoi
              renforcer, où progresser, comment prouver sa montée en compétence et quand passer à l'action.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {KORYXA_VALUE.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
              >
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Partenaires de montée en compétence</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Des partenaires visibles, mais une valeur centrale gardée par KORYXA</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Les organismes, plateformes et coachs peuvent être présents dans l'écosystème. Mais KORYXA reste le
              moteur de diagnostic, de matching, de suivi, de score et de validation.
            </p>
            <TrajectoryPartnersPanel />
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#0b2742)] p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Score et validation</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">Une trajectoire n'est utile que si elle peut être mesurée</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              KORYXA ne fait pas seulement de la recommandation. La plateforme suit, score, valide et qualifie le
              niveau de préparation avant l'ouverture vers des opportunités.
            </p>
            <div className="mt-6 grid gap-3">
              {VALIDATION_ITEMS.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Débouchés</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Une trajectoire doit mener quelque part</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Le but final reste l'action : mission, stage, collaboration, besoin entreprise ou opportunité mieux
              qualifiée.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {OUTCOMES.map((item) => (
              <article
                key={item.title}
                className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5"
              >
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="demarrer"
          className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#0b2742)] p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-8"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Passer à l'action</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Commencez votre trajectoire avec un diagnostic plus clair, puis avancez avec les bons repères.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              La logique KORYXA reste simple : diagnostiquer, recommander, suivre, valider puis ouvrir vers des
              opportunités plus crédibles.
            </p>
          </div>
          <div className="mt-8">
            <TrajectoryFlowClient />
          </div>
        </section>
      </div>
    </main>
  );
}

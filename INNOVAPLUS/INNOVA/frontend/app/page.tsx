// innova-frontend/app/page.tsx
import Link from "next/link";

const PROOFS = [
  {
    title: "D\u00E9tection des besoins (RAG)",
    description:
      "Ingestion automatique des signaux terrains et documents pour r\u00E9v\u00E9ler les besoins socio-\u00E9conomiques latents."
  },
  {
    title: "Matching IA + \u00E9quit\u00E9 pays",
    description:
      "Algorithmes de recommandation \u00E9quilibr\u00E9s par quotas NeedIndex pour garantir une distribution juste."
  },
  {
    title: "Impact mesurable en temps r\u00E9el",
    description:
      "Tableaux de bord continus sur les opportunit\u00E9s cr\u00E9\u00E9es, assign\u00E9es et l'impact sur l'emploi inclusif."
  }
];

const HOW_IT_WORKS = [
  { step: "01", title: "D\u00E9posez un besoin ou un document" },
  { step: "02", title: "L\u2019IA g\u00E9n\u00E8re une opportunit\u00E9 structur\u00E9e" },
  { step: "03", title: "Matching des talents + quotas pays (NeedIndex)" },
  { step: "04", title: "Attribution, suivi et am\u00E9lioration continue" }
];

const KPI_METRICS = [
  { label: "Opportunit\u00E9s ouvertes", value: "128" },
  { label: "Assignations cette semaine", value: "42" },
  { label: "Taux d\u2019acceptation", value: "87\u202F%" },
  { label: "R\u00E9partition par pays (\u00E9quit\u00E9)", value: "NeedIndex 0,41" },
  { label: "Temps m\u00E9dian de matching", value: "36 h" }
];

const SAMPLE_OPPORTUNITY = {
  title: "D\u00E9ploiement data pour coop\u00E9ratives agricoles",
  skills: ["Data engineering", "AgriTech", "Python"],
  country: "CI",
  status: "open",
  needIndex: "0,35"
};

const OPPORTUNITY_DETAILS = {
  context:
    "Analyse des ventes locales et recommandations de pricing pour 120 coop\u00E9ratives ivoiriennes. Donn\u00E9es issues du RAG terrain + rapports FAO.",
  skills: ["Analyse de donn\u00E9es", "Pricing dynamique", "Agriculture durable"],
  country: "C\u00F4te d\u2019Ivoire",
  equity: "Quota pays actif (min 15\u202F% / max 35\u202F%)"
};

const TALENT_SAMPLE = {
  name: "Mariam Koffi",
  country: "CI",
  skills: ["Data analyst", "Power BI", "SQL avanc\u00E9"],
  reputation: "0,92",
  availability: "Disponible 3 j / semaine"
};

const GLOBAL_ACTIONS = [
  "Cr\u00E9er une opportunit\u00E9",
  "Trouver une mission",
  "Voir le contexte",
  "Postuler",
  "Proposer",
  "Accepter",
  "Refuser",
  "Terminer"
];

const FILTERS = ["Pays", "Comp\u00E9tence", "Statut", "R\u00E9cents"];

const TOASTS = [
  "Opportunit\u00E9 cr\u00E9\u00E9e avec succ\u00E8s",
  "Candidature envoy\u00E9e",
  "Attribution r\u00E9alis\u00E9e",
  "Contexte insuffisant (ajoutez un document ou pr\u00E9cisez le besoin)"
];

const EMPTY_STATES = [
  "Aucune opportunit\u00E9 pour ces filtres. Essayez un autre pays ou une autre comp\u00E9tence.",
  "Aucun talent correspondant. Ajustez les comp\u00E9tences requises."
];

const SECTION_TITLE = "text-3xl font-semibold text-slate-900";
const SECTION_SUBTITLE = "text-base text-slate-500";
const KPI_CARD =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow";
const KPI_VALUE = "text-3xl font-semibold text-sky-600";
const CHIP_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700";
const BADGE_BASE = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold";
const EQUITY_BADGE = `${BADGE_BASE} border border-emerald-200 bg-emerald-50 text-emerald-700`;
const RAG_OK_BADGE = `${BADGE_BASE} border border-sky-200 bg-sky-50 text-sky-700`;
const RAG_LOW_BADGE = `${BADGE_BASE} border border-amber-200 bg-amber-50 text-amber-700`;
const ACTION_PILL =
  "rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-600";

export default function HomePage() {
  return (
    <div className="space-y-16 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-sky-900/10">
        <div className="absolute inset-y-0 -right-20 w-1/2 bg-sky-50/70 blur-3xl" aria-hidden />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-100 opacity-70 blur-3xl" aria-hidden />
        <div className="relative z-10 grid gap-10 px-8 py-12 lg:grid-cols-[1.6fr_1fr] lg:px-12 lg:py-16">
          <div className="space-y-8">
            <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
              Moteur IA INNOVA+
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                INNOVA+ : l\u2019IA qui transforme les besoins en emplois
              </h1>
              <p className="text-lg leading-relaxed text-slate-600">
                Notre moteur d\u2019IA d\u00E9tecte les besoins r\u00E9els, fait le matching des talents et r\u00E9partit \u00E9quitablement les
                opportunit\u00E9s par pays.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/opportunities/create" className="btn-primary">
                Cr\u00E9er une opportunit\u00E9
              </Link>
              <Link href="/chat-laya" className="btn-secondary">
                Essayer Chat-LAYA
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {PROOFS.map((proof) => (
                <div
                  key={proof.title}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-md shadow-slate-900/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <p className="text-sm font-semibold text-slate-900">{proof.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{proof.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-sky-100 bg-sky-50/80 p-6 shadow-lg shadow-sky-200/40 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">NeedIndex live</p>
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <p className="text-6xl font-black text-sky-600">0,82</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm shadow-sky-200">
                  \u00C9quit\u00E9 globale
                </span>
              </div>
              <p className="text-sm text-slate-600">
                R\u00E9partition \u00E9quitable active sur 24 pays. Mise \u00E0 jour chaque fois qu\u2019une opportunit\u00E9 est attribu\u00E9e.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm text-slate-600">
                  <span>CI \u00B7 C\u00F4te d\u2019Ivoire</span>
                  <span className="text-sky-600">+2 blocs</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm text-slate-600">
                  <span>SN \u00B7 S\u00E9n\u00E9gal</span>
                  <span className="text-sky-600">+1 bloc</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm text-slate-600">
                  <span>FR \u00B7 France</span>
                  <span className="text-slate-400">quota max atteint</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={SECTION_TITLE}>Comment \u00E7a marche</h2>
            <p className={SECTION_SUBTITLE}>
              Le cycle complet du besoin \u00E0 l\u2019impact, monitor\u00E9 par l\u2019IA et auditable \u00E0 chaque \u00E9tape.
            </p>
          </div>
            <Link href="/resources" className="btn-secondary">
            Voir la documentation
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">\u00C9tape {item.step}</span>
              <p className="mt-4 text-base font-semibold text-slate-900">{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:grid-cols-[1.3fr_1fr] sm:p-12">
        <div className="space-y-4">
          <h2 className={SECTION_TITLE}>Emploi infini par l\u2019IA, juste et mesurable</h2>
          <p className="text-lg text-slate-600">
            INNOVA+ convertit en continu les probl\u00E8mes locaux et les comp\u00E9tences disponibles en opportunit\u00E9s \u00E9conomiques,
            avec une r\u00E9partition \u00E9quitable entre pays.
          </p>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-6 py-4 text-sky-700 shadow-inner shadow-sky-200/40">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">\u00C9quation</p>
            <p className="mt-2 text-lg font-semibold text-sky-700">O = f(P, C, I, J)</p>
            <p className="mt-1 text-sm text-sky-600">
              Opportunit\u00E9s = f(Probl\u00E8mes, Comp\u00E9tences, Intelligence, Justice)
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner shadow-slate-200">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Transparence & \u00E9quit\u00E9</h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Chaque attribution d\u2019opportunit\u00E9 est audit\u00E9e par le moteur NeedIndex. Les quotas pays sont param\u00E9trables et
            visibles par chaque membre du collectif.
          </p>
          <Link href="/equity" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
            Voir comment l\u2019IA d\u00E9cide \u2192
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:p-12">
        <h2 className={SECTION_TITLE}>Indicateurs temps r\u00E9el</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {KPI_METRICS.map((kpi) => (
            <div key={kpi.label} className={KPI_CARD}>
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <p className={`${KPI_VALUE} mt-2`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 lg:grid-cols-[1.25fr_1fr] lg:p-12">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className={SECTION_TITLE}>Opportunit\u00E9s</h2>
              <p className={SECTION_SUBTITLE}>
                Gestion des opportunit\u00E9s ouvertes, assign\u00E9es et conclues par statut NeedIndex.
              </p>
            </div>
            <Link href="/opportunities" className="btn-secondary">
              Explorer les opportunit\u00E9s
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{SAMPLE_OPPORTUNITY.title}</h3>
              <span className={EQUITY_BADGE}>
                \u00C9quit\u00E9 active <span className="text-xs text-slate-500">NeedIndex {SAMPLE_OPPORTUNITY.needIndex}</span>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {SAMPLE_OPPORTUNITY.skills.map((skill) => (
                <span key={skill} className={CHIP_CLASS}>
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span>Pays : {SAMPLE_OPPORTUNITY.country}</span>
              <span>Statut : {SAMPLE_OPPORTUNITY.status}</span>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/opportunities/1" className="btn-secondary">
                Voir le contexte
              </Link>
              <Link href="/opportunities/1" className="btn-primary">
                Postuler
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recherche & filtres</h3>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">
              <input
                type="search"
                placeholder="Cherchez un besoin, une comp\u00E9tence ou un pays\u2026"
                className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm focus:border-sky-400 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                  <button key={filter} type="button" className={ACTION_PILL}>
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow shadow-slate-900/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              D\u00E9tail opportunit\u00E9
            </h3>
            <dl className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <dt className="font-semibold text-slate-800">Contexte RAG</dt>
                <dd className="mt-1">{OPPORTUNITY_DETAILS.context}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Comp\u00E9tences requises</dt>
                <dd className="mt-1">{OPPORTUNITY_DETAILS.skills.join(" \u00B7 ")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <dt className="font-semibold text-slate-800">Pays cible</dt>
                  <dd className="mt-1">{OPPORTUNITY_DETAILS.country}</dd>
                </div>
                <div className="text-xs font-semibold text-slate-500">R\u00E8gles d\u2019\u00E9quit\u00E9</div>
              </div>
              <div>
                <dd className="rounded-2xl bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-700">
                  {OPPORTUNITY_DETAILS.equity}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/opportunities/1/apply" className="btn-primary">
                Postuler
              </Link>
              <Link href="/opportunities/1/share" className="btn-secondary">
                Partager
              </Link>
              <button
                type="button"
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300"
              >
                Signaler un probl\u00E8me
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow shadow-slate-900/5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Carte talent
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="text-base font-semibold text-slate-900">{TALENT_SAMPLE.name}</p>
              <p>Pays : {TALENT_SAMPLE.country}</p>
              <p>Comp\u00E9tences : {TALENT_SAMPLE.skills.join(", ")}</p>
              <p>R\u00E9putation : {TALENT_SAMPLE.reputation}</p>
              <p>Disponibilit\u00E9 : {TALENT_SAMPLE.availability}</p>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-full border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Proposer une mission
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Badges & \u00E9tats RAG</h3>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <span className={RAG_OK_BADGE}>RAG \u2713 Contexte suffisant</span>
              <span className={`${RAG_LOW_BADGE} block max-w-max`}>RAG ! Contexte faible</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:p-12">
        <h2 className={SECTION_TITLE}>Actions globales</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {GLOBAL_ACTIONS.map((action) => (
            <button key={action} type="button" className={ACTION_PILL}>
              {action}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 lg:grid-cols-2 lg:p-12">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Messages</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {TOASTS.map((toast) => (
              <li
                key={toast}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm shadow-slate-900/5"
              >
                {toast}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">\u00C9tats vides</h3>
          <ul className="mt-4 space-y-3 text-sm text-amber-800">
            {EMPTY_STATES.map((state) => (
              <li key={state} className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-3">
                {state}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-10 text-center shadow-inner shadow-slate-200 sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">INNOVA+</p>
        <p className="mt-3 text-lg font-semibold text-slate-700">
          Moteur IA d\u2019opportunit\u00E9s. Transparence \u00B7 \u00C9quit\u00E9 \u00B7 Impact.
        </p>
      </section>
    </div>
  );
}


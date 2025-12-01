// innova-frontend/app/page.tsx
import Link from "next/link";
export const dynamic = "force-dynamic";

const PROOFS = [
  {
    title: "Détection intelligente des besoins",
    description: "L'IA analyse automatiquement les signaux terrains et documents pour identifier les opportunités socio-économiques latentes."
  },
  {
    title: "Matching équitable et transparent",
    description: "Algorithmes de recommandation équilibrés par quotas NeedIndex pour garantir une distribution juste des opportunités."
  },
  {
    title: "Impact mesurable en temps réel",
    description: "Tableaux de bord continus sur les opportunités créées, assignées et l'impact sur l'écosystème économique."
  }
];

const HOW_IT_WORKS = [
  { step: "01", title: "Déposez un besoin ou un document" },
  { step: "02", title: "L'IA génère une opportunité structurée" },
  { step: "03", title: "Matching des talents + quotas équitables" },
  { step: "04", title: "Attribution, suivi et amélioration continue" }
];

const KPI_METRICS = [
  { label: "Opportunités ouvertes", value: "128" },
  { label: "Assignations cette semaine", value: "42" },
  { label: "Taux d'acceptation", value: "87 %" },
  { label: "Répartition équitable", value: "NeedIndex 0,41" },
  { label: "Temps médian de matching", value: "36 h" }
];

const SAMPLE_OPPORTUNITY = {
  title: "Déploiement data pour coopératives agricoles",
  skills: ["Data engineering", "AgriTech", "Python"],
  country: "CI",
  status: "open",
  needIndex: "0,35"
};

const OPPORTUNITY_DETAILS = {
  context: "Analyse des ventes locales et recommandations de pricing pour 120 coopératives ivoiriennes. Données issues du RAG terrain + rapports FAO.",
  skills: ["Analyse de données", "Pricing dynamique", "Agriculture durable"],
  country: "Côte d'Ivoire",
  equity: "Quota pays actif (min 15 % / max 35 %)"
};

const TALENT_SAMPLE = {
  name: "Mariam Koffi",
  country: "CI",
  skills: ["Data analyst", "Power BI", "SQL avancé"],
  reputation: "0,92",
  availability: "Disponible 3 j / semaine"
};

const GLOBAL_ACTIONS = [
  "Créer une opportunité",
  "Trouver une mission",
  "Voir le contexte",
  "Postuler",
  "Proposer",
  "Accepter",
  "Refuser",
  "Terminer"
];

const FILTERS = ["Pays", "Compétence", "Statut", "Récents"];

const TOASTS = [
  "Opportunité créée avec succès",
  "Candidature envoyée",
  "Attribution réalisée",
  "Contexte insuffisant (ajoutez un document ou précisez le besoin)"
];

const EMPTY_STATES = [
  "Aucune opportunité pour ces filtres. Essayez un autre pays ou une autre compétence.",
  "Aucun talent correspondant. Ajustez les compétences requises."
];

const PARTNERS = ["GIZ", "BidLab", "AFD", "Agritech CI", "TPE locales"];

const HERO_HIGHLIGHTS = [
  { label: "Pays activés", value: "24", tone: "emerald" },
  { label: "Talents vérifiés", value: "12k", tone: "sky" },
  { label: "Temps médian de match", value: "36 h", tone: "amber" },
];

const SECTION_TITLE = "text-3xl font-semibold text-slate-900";
const SECTION_SUBTITLE = "text-base text-slate-500";
const KPI_CARD = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow";
const KPI_VALUE = "text-3xl font-semibold text-sky-600";
const CHIP_CLASS = "inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700";
const BADGE_BASE = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold";
const EQUITY_BADGE = `${BADGE_BASE} border border-emerald-200 bg-emerald-50 text-emerald-700`;
const RAG_OK_BADGE = `${BADGE_BASE} border border-sky-200 bg-sky-50 text-sky-700`;
const RAG_LOW_BADGE = `${BADGE_BASE} border border-amber-200 bg-amber-50 text-amber-700`;
const ACTION_PILL = "rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-600";

export default async function HomePage() {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/30 to-blue-50/50 shadow-xl shadow-sky-900/5">
        <div className="absolute inset-y-0 -right-20 w-1/2 bg-sky-50/70 blur-3xl" aria-hidden />
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sky-100 opacity-70 blur-3xl" aria-hidden />
        <div className="relative z-10 grid gap-10 px-6 py-14 lg:grid-cols-[1.6fr_1fr] lg:px-12 lg:py-18">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                Moteur IA KORYXA
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Équité active NeedIndex
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600">
                Données live + démonstration
              </span>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                L'IA qui transforme les besoins en
                <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"> opportunités</span>
              </h1>
              <p className="text-lg leading-relaxed text-slate-600 max-w-2xl">
                KORYXA détecte les signaux terrains, construit des opportunités et répartit équitablement les missions entre pays avec un NeedIndex auditable.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/opportunities/create" className="btn-primary">
                Créer une opportunité
              </Link>
              <Link href="/chatlaya" className="btn-secondary">
                CHATLAYA
              </Link>
              <Link href="/equity" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                Voir l'équité en détail →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_HIGHLIGHTS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-md shadow-slate-900/5 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <p className="text-3xl font-bold text-slate-900">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Partenaires & pilotes</span>
              <div className="flex flex-wrap items-center gap-2">
                {PARTNERS.map((p) => (
                  <span key={p} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-sky-100 bg-white/80 p-6 shadow-lg shadow-sky-200/40 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">NeedIndex live</p>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">Audit temps réel</span>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-100 bg-sky-50/60 p-4 shadow-inner shadow-sky-100/40">
                <div className="flex items-baseline justify-between">
                  <p className="text-5xl font-black text-sky-600">0,82</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm shadow-sky-200">
                    Équité globale
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Répartition active sur 24 pays. Mise à jour à chaque attribution.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { country: "CI · Côte d'Ivoire", delta: "+2 blocs", tone: "text-sky-600" },
                  { country: "SN · Sénégal", delta: "+1 bloc", tone: "text-sky-600" },
                  { country: "FR · France", delta: "quota max atteint", tone: "text-slate-400" },
                ].map((item) => (
                  <div key={item.country} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/90 px-3 py-2 text-sm text-slate-600">
                    <span>{item.country}</span>
                    <span className={item.tone}>{item.delta}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Données de démonstration. Les chiffres live reflètent la production dès connexion.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={SECTION_TITLE}>Comment ça marche</h2>
            <p className={SECTION_SUBTITLE}>
              Le cycle complet du besoin à l'impact, monitoré par l'IA et auditable à chaque étape.
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
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Étape {item.step}</span>
              <p className="mt-4 text-base font-semibold text-slate-900">{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="grid gap-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:grid-cols-[1.3fr_1fr] sm:p-12">
        <div className="space-y-4">
          <h2 className={SECTION_TITLE}>Opportunités intelligentes par l'IA</h2>
          <p className="text-lg text-slate-600">
            KORYXA convertit en continu les problèmes locaux et les compétences disponibles en opportunités économiques,
            avec une répartition équitable entre pays et une transparence totale.
          </p>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 px-6 py-4 text-sky-700 shadow-inner shadow-sky-200/40">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Équation</p>
            <p className="mt-2 text-lg font-semibold text-sky-700">O = f(P, C, I, J)</p>
            <p className="mt-1 text-sm text-sky-600">
              Opportunités = f(Problèmes, Compétences, Intelligence, Justice)
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner shadow-slate-200">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Transparence & équité</h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Chaque attribution d'opportunité est auditée par le moteur NeedIndex. Les quotas pays sont paramétrables et
            visibles par chaque membre du collectif.
          </p>
          <Link href="/equity" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
            Voir comment l'IA décide →
          </Link>
        </div>
      </section>

      {/* KPIs */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 sm:p-12">
        <h2 className={SECTION_TITLE}>Indicateurs temps réel</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {KPI_METRICS.map((kpi) => (
            <div key={kpi.label} className={KPI_CARD}>
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <p className={`${KPI_VALUE} mt-2`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Opportunities showcase */}
      <section className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 lg:grid-cols-[1.25fr_1fr] lg:p-12">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className={SECTION_TITLE}>Opportunités</h2>
              <p className={SECTION_SUBTITLE}>
                Gestion des opportunités ouvertes, assignées et conclues par statut NeedIndex.
              </p>
            </div>
            <Link href="/opportunities" className="btn-secondary">
              Explorer les opportunités
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{SAMPLE_OPPORTUNITY.title}</h3>
              <span className={EQUITY_BADGE}>
                Équité active <span className="text-xs text-slate-500">NeedIndex {SAMPLE_OPPORTUNITY.needIndex}</span>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {SAMPLE_OPPORTUNITY.skills.map((skill) => (
                <span key={skill} className={CHIP_CLASS}>{skill}</span>
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
              <Link href="/opportunities/1/apply" className="btn-primary">
                Postuler
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recherche & filtres</h3>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center">
              <input
                type="search"
                placeholder="Cherchez un besoin, une compétence ou un pays…"
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
              Détail opportunité
            </h3>
            <dl className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <dt className="font-semibold text-slate-800">Contexte RAG</dt>
                <dd className="mt-1">{OPPORTUNITY_DETAILS.context}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Compétences requises</dt>
                <dd className="mt-1">{OPPORTUNITY_DETAILS.skills.join(" · ")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <dt className="font-semibold text-slate-800">Pays cible</dt>
                  <dd className="mt-1">{OPPORTUNITY_DETAILS.country}</dd>
                </div>
                <div className="text-xs font-semibold text-slate-500">Règles d'équité</div>
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
                Signaler un problème
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
              <p>Compétences : {TALENT_SAMPLE.skills.join(", ")}</p>
              <p>Réputation : {TALENT_SAMPLE.reputation}</p>
              <p>Disponibilité : {TALENT_SAMPLE.availability}</p>
            </div>
            <Link
              href="/missions/new"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Proposer une mission
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Badges & états RAG</h3>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <span className={RAG_OK_BADGE}>RAG ✓ Contexte suffisant</span>
              <span className={`${RAG_LOW_BADGE} block max-w-max`}>RAG ! Contexte faible</span>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
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

      {/* Messages and states */}
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
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">États vides</h3>
          <ul className="mt-4 space-y-3 text-sm text-amber-800">
            {EMPTY_STATES.map((state) => (
              <li key={state} className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-3">
                {state}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 px-8 py-10 text-center shadow-inner shadow-slate-200 sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">KORYXA</p>
        <p className="mt-3 text-lg font-semibold text-slate-700">
          Moteur IA d'opportunités. Transparence · Équité · Impact.
        </p>
      </section>
    </div>
  );
}

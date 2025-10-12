// innova-frontend/app/about/page.tsx
import Link from "next/link";

type Pillar = {
  title: string;
  description: string;
  cta?: { label: string; href: string };
};

type Milestone = {
  label: string;
  description: string;
};

type ValueCard = {
  title: string;
  items: string[];
};

const PILLARS: Pillar[] = [
  {
    title: "Talents et reseau",
    description:
      "Cartographier les competences IA/tech, connecter talents, mentors et entreprises pour creer des opportunites concretes.",
    cta: { label: "Explorer les contributeurs", href: "/contributors" },
  },
  {
    title: "Connaissance et RAG",
    description:
      "Centraliser capital documentaire, rendre les retours accessibles via CHATLAYA et industrialiser le suivi des projets.",
    cta: { label: "Tester CHATLAYA", href: "/chatlaya" },
  },
  {
    title: "Impact economique",
    description:
      "Accompagner 10 000 emplois en Afrique et au-dela via formations, missions et programmes d acceleration base sur les donnees.",
    cta: { label: "Voir les projets", href: "/projects" },
  },
];

const VALUES: ValueCard[] = [
  {
    title: "Notre promesse",
    items: [
      "Plateforme ouverte, transparente et documentee",
      "Outils IA responsables et cites",
      "Accompagnement personalise par des experts terrain",
    ],
  },
  {
    title: "Ce qui nous anime",
    items: [
      "Favoriser la creation de valeur locale",
      "Soutenir les jeunes talents et la mixite",
      "Partager les bonnes pratiques entre regions et secteurs",
    ],
  },
];

const MILESTONES: Milestone[] = [
  {
    label: "MVP 1",
    description: "Profils talents, job board projets, copilote CHATLAYA, analytics d usage basiques.",
  },
  {
    label: "MVP 2",
    description: "Academy, mentorat et veille sectorielle, dashboards personnalises pour les membres.",
  },
  {
    label: "MVP 3",
    description: "Marketplace missions, API partenaires, programmes Women in AI et labs territoriaux.",
  },
  {
    label: "MVP 4",
    description: "Impact dashboard continental, gamification, app mobile et scenarios IA d orientation carriere.",
  },
];

const STATS = [
  { value: "10 000", label: "emplois a accompagner" },
  { value: "35+", label: "domaines d expertise cartographies" },
  { value: "50", label: "partenaires cibles d ici 2026" },
];

export default function AboutPage() {
  return (
    <main className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-sky-100 px-6 py-16 text-slate-900 shadow-xl shadow-sky-100 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,197,253,0.25),transparent_65%)]" />
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
              A propos
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              INNOVA+, une communaute IA pour construire 10 000 emplois durables
            </h1>
            <p className="text-sm text-slate-600 sm:text-base">
              Nous reunissons talents, organisations et institutions pour transformer la recherche et l adoption des technologies convergentes en impact economique. Notre ambition : creer un hub collaboratif qui rende visibles les expertises africaines et facilite leur rayonnement mondial.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700"
              >
                Rejoindre la coalition
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
              >
                Decouvrir nos chantiers
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-inner shadow-sky-100">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Objectif impact
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-sky-100 bg-white p-4 text-center shadow-sm shadow-sky-100">
                  <p className="text-xl font-semibold text-sky-700">{stat.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-600">
              Chaque trimestre, nous publions un rapport ouvert sur les projets, les personnes accompagnees et les resultats socio-economiques observes dans les territoires pilotes.
            </p>
          </div>
        </div>
  </section>

      <section className="mb-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Équation</h2>
          <p className="mt-2 text-sm text-slate-700">O = f(P, C, I, J)</p>
          <p className="mt-1 text-sm text-slate-600">
            Opportunités = f(Problèmes, Compétences, Intelligence, Justice). L’IA convertit des problèmes réels et des
            compétences disponibles en opportunités distributives, mesurées et auditées.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Comment ça marche</h2>
          <ul className="mt-2 space-y-2">
            <li className="rounded-2xl border border-slate-200 p-3"><p className="text-sm font-semibold">1. Besoin</p><p className="text-xs text-slate-600">Soumission d’un problème réel ou d’un document.</p></li>
            <li className="rounded-2xl border border-slate-200 p-3"><p className="text-sm font-semibold">2. Opportunité</p><p className="text-xs text-slate-600">Structuration IA (contexte, objectifs, périmètre).</p></li>
            <li className="rounded-2xl border border-slate-200 p-3"><p className="text-sm font-semibold">3. Matching + Équité</p><p className="text-xs text-slate-600">Compétences + NeedIndex (quotas min/max).</p></li>
            <li className="rounded-2xl border border-slate-200 p-3"><p className="text-sm font-semibold">4. Attribution & Feedback</p><p className="text-xs text-slate-600">Attribution transparente et amélioration continue.</p></li>
          </ul>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Modules</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <a href="/chatlaya" className="rounded-2xl border border-slate-200 p-4 transition hover:border-sky-200 hover:shadow"><p className="font-semibold">CHATLAYA</p><p className="text-sm text-slate-600">Copilote et RAG sur vos sources.</p></a>
          <a href="/meet" className="rounded-2xl border border-slate-200 p-4 transition hover:border-sky-200 hover:shadow"><p className="font-semibold">INNOVA-MEET</p><p className="text-sm text-slate-600">Fil d’opportunités et collaboration.</p></a>
          <a href="/marketplace" className="rounded-2xl border border-slate-200 p-4 transition hover:border-sky-200 hover:shadow"><p className="font-semibold">Marketplace</p><p className="text-sm text-slate-600">Offres, candidatures, attributions.</p></a>
        </div>
      </section>

      <section className="mb-8 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">Transparence</h2>
          <p className="mt-2 text-sm text-slate-600">Répartition NeedIndex + quotas min/max paramétrables. Décisions d’attribution auditées.<a href="/equity" className="ml-1 text-sky-600">En savoir plus</a>.</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Impact</h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Opportunités ouvertes</p><p className="text-base font-semibold text-sky-700">—</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Assignations</p><p className="text-base font-semibold text-sky-700">—</p></div>
            <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Répartition par pays</p><p className="text-base font-semibold text-sky-700">NeedIndex</p></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <article key={pillar.title} className="flex h-full flex-col rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h2 className="text-lg font-semibold text-slate-900">{pillar.title}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">{pillar.description}</p>
            {pillar.cta && (
              <Link
                href={pillar.cta.href}
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
              >
                {pillar.cta.label}
              </Link>
            )}
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {VALUES.map((card) => (
          <article key={card.title} className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
            <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {card.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-sky-500" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Notre feuille de route
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Un chemin par vagues pour structurer l ecosysteme</h2>
          <p className="mt-3 text-sm text-slate-600">
            Nous progressons par vagues successives, en combinant produits, programmes et partenariats pour derisquer l innovation et financer la creation d emplois.
          </p>
          <div className="mt-6 space-y-4">
            {MILESTONES.map((step) => (
              <div key={step.label} className="rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase text-sky-600">{step.label}</span>
                <p className="mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 p-6 text-slate-50 shadow-lg shadow-sky-500/25">
          <h3 className="text-lg font-semibold">Comment participer</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-100">
            <li>
              <strong className="font-semibold text-white">Talents :</strong> completer votre profil, rejoindre les cohortes de formation et proposer vos projets pilotes.
            </li>
            <li>
              <strong className="font-semibold text-white">Entreprises :</strong> publier vos besoins, parrainer des promotions et ouvrir vos donnees non sensibles pour l experimentation.
            </li>
            <li>
              <strong className="font-semibold text-white">Partenaires institutionnels :</strong> coconstruire des programmes territoriaux et mesurer avec nous les indicateurs d impact.
            </li>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              Proposer une collaboration
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Consulter la documentation
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/70 bg-white px-6 py-8 shadow-sm shadow-slate-900/5 sm:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Transparence et partage
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">Un capital commun documente et mesurable</h2>
            <p className="text-sm text-slate-600">
              INNOVA+ publie des tableaux de bord ouverts, documente les decisions produit et partage les bonnes pratiques RAG/LLM. Nous croyons a un modele ou chaque membre peut apprendre, contribuer et reutiliser les briques construites par le collectif.
            </p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-slate-50 p-5 text-sm text-slate-600">
            <p>
              Prochain livrable : <span className="font-semibold text-sky-600">rapport impact T1</span> avec les donnees de projets pilotes, la cartographie des experts et les besoins emergents par pays.
            </p>
            <p className="mt-3">
              Inscrivez-vous a la newsletter pour recevoir les comptes rendus mensuels, les appels a talents et les prochains evenements communautaires.
            </p>
            <Link
              href="/community"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-200 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              Rejoindre la newsletter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

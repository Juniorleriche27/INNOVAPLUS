// innova-frontend/app/page.tsx
import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

type FeatureCardProps = {
  badge: string;
  title: string;
  description: string;
  href: string;
};

type WorkflowItem = {
  title: string;
  description: string;
};

const STAT_ITEMS = [
  { value: "120+", label: "Projets accompagnes" },
  { value: "35", label: "Domaines expertises" },
  { value: "75", label: "Contributeurs actifs" },
];

const FEATURE_ITEMS: FeatureCardProps[] = [
  {
    badge: "Projets",
    title: "Piloter vos projets",
    description: "Centralisez feuilles de route, jalons et impacts pour garder vos equipes alignees.",
    href: "/projects",
  },
  {
    badge: "Chat",
    title: "Chat-LAYA, votre copilote",
    description: "Interrogez votre base documentaire et obtenez des reponses fiables en quelques secondes.",
    href: "/chat-laya",
  },
  {
    badge: "Analytics",
    title: "Analyser vos resultats",
    description: "Visualisez tendances, risques et opportunites avec des tableaux de bord instantanes.",
    href: "/projects/analytics",
  },
];

const WORKFLOW_ITEMS: WorkflowItem[] = [
  {
    title: "Recueillir vos besoins",
    description: "Capturez les demandes des equipes terrain et structurez-les dans un tableau de bord unique.",
  },
  {
    title: "Capitaliser sur vos domaines",
    description: "Reliez projets, domaines et technologies pour garder une vue claire de vos expertises.",
  },
  {
    title: "Acceder a la bonne ressource",
    description: "Mobilisez les bons contributeurs au bon moment grace a des profils a jour et des alertes contextuelles.",
  },
];

const QUICK_LINKS = [
  { href: "/projects/new", label: "Demarrer un projet" },
  { href: "/contributors", label: "Gerer les contributeurs" },
  { href: "/technologies", label: "Suivre les technologies" },
];

function PrimaryButton({ href, children, className = "" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 ${className}`.trim()}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ href, children, className = "" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50 ${className}`.trim()}
    >
      {children}
    </Link>
  );
}

function FeatureCard({ badge, title, description, href }: FeatureCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5 transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg">
      <span className="inline-flex w-fit items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
        {badge}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600">{description}</p>
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:gap-3"
      >
        Explorer
        <span
          aria-hidden="true"
          className="inline-block h-[1px] w-6 bg-sky-300 transition-[width] duration-200 ease-out group-hover:w-10"
        />
      </Link>
    </article>
  );
}

function WorkflowList({ items }: { items: WorkflowItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <li
          key={item.title}
          className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm shadow-slate-900/5"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <main className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-sky-100 px-6 py-14 text-slate-900 shadow-xl shadow-sky-100 sm:px-10 lg:px-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.35),transparent_65%)]"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Innova+
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              Un bureau de projet fluide pour toute votre communaute
            </h1>
            <p className="text-base text-slate-600 sm:text-lg">
              Pilotez vos initiatives, animez vos reseaux d experts et gardez une vision claire des resultats. INNOVA+ centralise connaissances, conversations et actions dans une experience souple.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/chat-laya">Essayer Chat-LAYA</PrimaryButton>
              <SecondaryButton href="/projects">Voir les projets</SecondaryButton>
            </div>
          </div>

          <div className="flex-1 rounded-3xl border border-sky-100 bg-white/80 p-6 shadow-inner shadow-sky-100 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Indicateurs temps reel
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {STAT_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-sky-100 bg-white p-4 text-center shadow-sm shadow-sky-100"
                >
                  <p className="text-2xl font-semibold text-sky-700">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  +18%
                </span>
                Croissance moyenne de la satisfaction projet sur 3 mois.
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                  4.8
                </span>
                Score d experience collaborateur sur les missions accompagnees.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {FEATURE_ITEMS.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Votre cadence
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            Une logique de travail centree sur la valeur
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Structurez vos cycles en trois etapes claires et gardez trace des apprentissages pour les projets suivants.
          </p>
          <div className="mt-6">
            <WorkflowList items={WORKFLOW_ITEMS} />
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 p-6 text-slate-50 shadow-lg shadow-sky-500/25">
            <h3 className="text-lg font-semibold">Activer votre intelligence collective</h3>
            <p className="mt-2 text-sm text-sky-100">
              Combinez les retours des experts, la memoire projet et les ressources externes directement dans Chat-LAYA.
            </p>
            <Link
              href="/chat-laya"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
            >
              Ouvrir Chat-LAYA
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm shadow-slate-900/5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Acces rapide
            </p>
            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-700">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between rounded-2xl border border-transparent px-3 py-2 transition hover:border-sky-100 hover:bg-sky-50"
                  >
                    {link.label}
                    <span aria-hidden="true" className="text-sky-400">&gt;</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

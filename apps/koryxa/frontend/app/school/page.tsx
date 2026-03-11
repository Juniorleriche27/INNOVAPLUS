import Link from "next/link";

const VALUE_POINTS = [
  "Parcours professionnalisants relies a des besoins concrets",
  "Modules, planning guide, projets et validations dans un meme flux",
  "Progression visible pour apprendre avec plus de cadre",
];

const SCHOOL_PILLARS = [
  {
    title: "Parcours structures",
    text: "Chaque specialisation avance par modules clairs, avec une logique de progression lisible et exploitable.",
  },
  {
    title: "Apprentissage guide",
    text: "Le planning aide a organiser les sessions, le rythme et les priorites au lieu de laisser l'apprenant seul.",
  },
  {
    title: "Projets et livrables",
    text: "Le travail ne s'arrete pas a la theorie: projets, rendus et validations donnent de la matiere reelle.",
  },
];

const TRACKS = [
  {
    title: "Fondamentaux",
    href: "/school/parcours/fondamental",
    summary: "Bases solides en donnees, python, SQL, visualisation et logique analytique.",
  },
  {
    title: "Data Analyst",
    href: "/school/data-analyst",
    summary: "Lecture metier, reporting, analyse et restitution utile pour une organisation.",
  },
  {
    title: "Data Engineer",
    href: "/school/data-engineer",
    summary: "Pipelines, structuration de donnees et logique d'infrastructure orientee production.",
  },
  {
    title: "Data Science",
    href: "/school/data-science",
    summary: "Analyse avancee, modelisation et experimentation appliquee a des cas concrets.",
  },
];

export default function SchoolHome() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
        <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_62%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                KORYXA School
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                parcours, planning, projets
              </span>
            </div>

            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Apprendre la data dans un cadre plus clair, plus concret et plus utile.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                KORYXA School relie progression, planning et projets. L'objectif n'est pas seulement de suivre des cours,
                mais de construire des competences defendables et visibles dans un environnement plus professionnel.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/school/planning" className="btn-primary">
                Ouvrir mon planning
              </Link>
              <Link href="/school/specialisations" className="btn-secondary">
                Voir les specialisations
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {VALUE_POINTS.map((item) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Ce que l'espace School apporte</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">Un parcours plus lisible</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Tu sais ou tu vas, quel module suivre et comment avancer sans te perdre dans l'interface.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">Un rythme plus soutenable</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Le planning transforme la formation en sequence de travail plus geree, pas en accumulation de contenu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Architecture School</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Comment progresser dans KORYXA School</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            L'interface doit te permettre de choisir un parcours, suivre un module et passer plus vite de l'apprentissage a l'action.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {SCHOOL_PILLARS.map((item, index) => (
            <article
              key={item.title}
              className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
            >
              <div className="absolute right-5 top-5 text-5xl font-semibold tracking-[-0.08em] text-slate-200">
                0{index + 1}
              </div>
              <div className="relative max-w-xs">
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {TRACKS.map((track) => (
          <article
            key={track.title}
            className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Parcours</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{track.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">{track.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={track.href} className="btn-primary">
                Ouvrir le parcours
              </Link>
              <Link href="/school/planning" className="btn-secondary">
                Planifier mon rythme
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#0b2742)] p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Passer a l'action</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Entre dans School avec un parcours, puis garde le cap avec le planning.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
              Si tu veux que la plateforme serve vraiment l'apprentissage, il faut que chaque entree soit claire:
              choisir, organiser, produire et valider.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[26px] border border-white/12 bg-white/8 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200">Demarrer</p>
              <p className="mt-3 text-2xl font-semibold text-white">Choisir un parcours</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/school/specialisations" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
                  Voir les specialisations
                </Link>
                <Link href="/school/planning" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                  Ouvrir le planning
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

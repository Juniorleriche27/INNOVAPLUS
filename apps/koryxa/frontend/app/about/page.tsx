import Link from "next/link";

const MISSION_PILLARS = [
  {
    title: "Relier apprentissage et execution",
    text: "KORYXA transforme des besoins reels en missions exploitables pour que la formation produise aussi de la valeur.",
  },
  {
    title: "Rendre l'IA plus utile",
    text: "L'IA sert ici a cadrer, accelerer et standardiser le travail, pas a produire un discours marketing vide.",
  },
  {
    title: "Organiser un impact concret",
    text: "Chaque mission doit aider une organisation, faire progresser un talent et renforcer un cadre plus juste.",
  },
];

const DIFFERENTIATORS = [
  "On apprend sur des cas utiles, pas seulement sur des exercices fictifs.",
  "Les entreprises avancent sur des besoins reels avec un cadre KORYXA.",
  "Les livrables et les preuves de travail comptent plus que la simple presence.",
  "L'IA est utilisee comme outil de clarification, de production et de qualite.",
];

const PRINCIPLES = ["Utilite", "Transparence", "Equite", "Impact reel"];

export default function AboutPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_62%)]" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                  A propos
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  mission, principes, cadre
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  KORYXA organise la rencontre entre besoins reels, competences et execution mieux cadree.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  La plateforme est construite autour d'une idee simple: convertir un probleme concret en mission
                  faisable, accompagner l'execution et produire des resultats utiles pour les organisations comme pour les apprenants.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/school" className="btn-primary">
                  Decouvrir School
                </Link>
                <Link href="/entreprise" className="btn-secondary">
                  Voir le cote Entreprise
                </Link>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_22px_54px_rgba(15,23,42,0.2)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Ce que KORYXA n'est pas</p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                  Ce n'est pas un simple site d'offres ou une promesse vague autour de l'IA.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                  Ce n'est pas une formation deconnectee du terrain ni une promesse d'embauche automatique.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                  Ce n'est pas de "l'IA magique" sans methode, sans donnees et sans validation.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mission</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Ce que KORYXA veut rendre possible</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Une plateforme utile doit aider les organisations a avancer et permettre aux talents d'apprendre sur du vrai travail.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {MISSION_PILLARS.map((item, index) => (
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

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Ce qui rend KORYXA different</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Une logique plus systemique que la simple mise en relation.</h3>
            <ul className="mt-6 grid gap-3 text-sm leading-7 text-slate-700">
              {DIFFERENTIATORS.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Principes</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Les points qui doivent rester visibles dans le produit.</h3>
            <div className="mt-6 flex flex-wrap gap-2">
              {PRINCIPLES.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-600">
              Si ces principes disparaissent du design ou du produit, KORYXA devient juste une vitrine. Le but est de garder
              une plateforme lisible, defendable et vraiment exploitable.
            </p>
          </article>
        </section>

        <section className="rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#0b2742)] p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Prochaine etape</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Comprendre KORYXA, puis entrer soit par School, soit par Entreprise.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                Le site doit rester simple a lire: mission, cadre, puis action. C'est cette logique qui guide la refonte en cours.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-[26px] border border-white/12 bg-white/8 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200">Choisir une entree</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/school" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
                    Aller sur School
                  </Link>
                  <Link href="/entreprise" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                    Aller sur Entreprise
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

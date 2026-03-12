import Link from "next/link";

const RESOURCE_BLOCKS = [
  {
    title: "Guides d'utilisation",
    text: "Comprendre les parcours, les outils et les logiques d'usage du produit.",
  },
  {
    title: "Bonnes pratiques",
    text: "Retrouver les principes de cadrage, d'execution et de restitution utilises par KORYXA.",
  },
  {
    title: "Documentation produit",
    text: "Structurer a terme les references frontend, backend, integrations et architecture.",
  },
];

export default function ResourcesPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Ressources</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Une base de ressources pour rendre KORYXA plus lisible et plus actionnable.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Cette section a vocation a reunir les guides d'usage, les bonnes pratiques et la documentation produit
            necessaires pour garder la plateforme claire dans la duree.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {RESOURCE_BLOCKS.map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
            >
              <p className="text-lg font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_22px_54px_rgba(15,23,42,0.2)] sm:p-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Ou continuer ?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Si tu veux comprendre la logique du produit avant la doc complete, les pages School, Entreprise et A propos
            sont les meilleures entrees.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/school" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
              Aller sur School
            </Link>
            <Link href="/entreprise" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Aller sur Entreprise
            </Link>
            <Link href="/about" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Aller sur A propos
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

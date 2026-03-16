"use client";

import Link from "next/link";

const PRODUCTS = [
  {
    name: "MyPlanningAI",
    href: "/myplanning",
    eyebrow: "Pilotage",
    summary:
      "MyPlanningAI aide a organiser les taches, suivre la progression, piloter les priorites et structurer l'execution, en individuel comme en equipe.",
    bullets: ["Progression visible", "Priorites plus claires", "Execution mieux structuree"],
    cta: "Ouvrir MyPlanningAI",
  },
  {
    name: "ChatLAYA",
    href: "/chatlaya",
    eyebrow: "Copilote",
    summary:
      "ChatLAYA sert de copilote conversationnel pour clarifier une demande, accelerer la production et soutenir l'execution dans un cadre plus lisible.",
    bullets: ["Clarification rapide", "Support conversationnel", "Execution assistee"],
    cta: "Ouvrir ChatLAYA",
  },
];

export default function ProductsLanding() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Produits KORYXA
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                Outils de structuration et d'execution
              </span>
            </div>
            <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Les outils visibles de l'ecosysteme KORYXA.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              KORYXA ne se limite pas a une page marketing. L'ecosysteme inclut deja des outils concrets pour piloter
              l'action, suivre la progression et mieux structurer l'execution.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article
              key={product.name}
              className="rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{product.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{product.name}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">{product.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {product.bullets.map((bullet) => (
                  <span
                    key={bullet}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {bullet}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={product.href} className="btn-primary">
                  {product.cta}
                </Link>
                <Link href="/about" className="btn-secondary">
                  Comprendre KORYXA
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

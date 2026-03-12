"use client";

import Link from "next/link";

const LEGAL_SECTIONS = [
  "Conditions d'utilisation generales",
  "Cadre de confidentialite detaille",
  "Informations legales sur l'edition et l'hebergement",
];

export default function TermsPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Mentions legales</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Le cadre legal sera detaille ici, dans une version plus complete et plus lisible.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Cette page n'est pas un simple placeholder. Elle annonce la structure legale qui doit accompagner le produit
            pour rester clair, defendable et exploitable par les utilisateurs comme par les partenaires.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {LEGAL_SECTIONS.map((item) => (
            <article
              key={item}
              className="rounded-[26px] border border-slate-200/80 bg-white/94 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.06)]"
            >
              <p className="text-sm font-semibold leading-6 text-slate-800">{item}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_22px_54px_rgba(15,23,42,0.2)] sm:p-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">En attendant la version detaillee</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Tu peux deja consulter la page de confidentialite et la presentation generale pour comprendre la logique du produit.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/privacy" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
              Voir Confidentialite
            </Link>
            <Link href="/about" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Voir A propos
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

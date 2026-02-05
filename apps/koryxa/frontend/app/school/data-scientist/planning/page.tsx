"use client";

import Link from "next/link";

export default function DataScientistLearningPlanningPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mon planning d’apprentissage</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Parcours Data Scientist</h1>
        <p className="mt-2 text-sm text-slate-700">Contenu en préparation.</p>
        <Link href="/school/data-scientist" className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:underline">
          Retour
        </Link>
      </section>
    </div>
  );
}


"use client";

import Link from "next/link";

export default function Module1MiniProjectPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Mini-projet — KORYXA School</h1>
        <p className="mt-2 text-sm text-slate-600">
          Contexte : “On veut augmenter la completion du Module 1.”
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Livrables a soumettre</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
          <li>Brief analytique (PDF ou Markdown) : probleme, stakeholders, objectifs SMART, KPIs, plan d'analyse.</li>
          <li>module1_kpi_results.json</li>
          <li>module1_kpi_dictionary.csv</li>
        </ul>
        <Link
          href="/school/data-analyst/module-1/submit"
          className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Soumettre les livrables →
        </Link>
      </section>
    </div>
  );
}

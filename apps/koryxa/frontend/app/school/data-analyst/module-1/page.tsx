"use client";

import Link from "next/link";
import { module1Overview } from "./content";

export default function Module1LandingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Certificat Data Analyst</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{module1Overview.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Objectif : transformer une demande floue en brief analytique executable, avec KPIs clairs et validation metier.
        </p>
        <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
          {module1Overview.outcomes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-slate-600">
          Choisis une leçon dans la sidebar (Sommaire du module) pour démarrer la lecture.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/school/data-analyst/module-1/theme-1/page/1" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
            Commencer la lecture
          </Link>
          <Link href="/school/data-analyst/module-1/notebooks" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
            Voir les notebooks
          </Link>
        </div>
      </section>
    </div>
  );
}

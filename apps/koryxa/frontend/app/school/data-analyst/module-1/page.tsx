"use client";

import Link from "next/link";
import { module1Overview, themes } from "./content";

export default function Module1LandingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Certificat Data Analyst</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{module1Overview.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Objectif : transformer une demande floue en brief analytique executable, avec KPIs clairs et validation metier.
        </p>
        <div className="mt-3 text-xs text-slate-500">
          Modules du certificat : 1) Cadrage & KPIs, 2) Collecte, 3) Nettoyage, 4) Preparation, 5) EDA,
          6) Reporting, 7) Recommandations + capstone.
        </div>
        <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
          {module1Overview.outcomes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/school/data-analyst/module-1/theme-1/page/1" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
            Commencer la lecture
          </Link>
          <Link href="/school/data-analyst/module-1/notebooks" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
            Voir les notebooks
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Themes du module</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {themes.map((theme) => {
            const href =
              theme.slug === "theme-1"
                ? "/school/data-analyst/module-1/theme-1/page/1"
                : theme.slug === "theme-2"
                  ? "/school/data-analyst/module-1/theme-2/page/1"
                  : `/school/data-analyst/module-1/${theme.slug}`;
            return (
            <div key={theme.slug} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-sm font-semibold text-slate-900">{theme.title}</p>
              <p className="mt-2 text-sm text-slate-600">{theme.objectives.join(" ")}</p>
              <Link
                href={href}
                className="mt-4 inline-flex text-sm font-semibold text-sky-700"
              >
                Ouvrir le cours →
              </Link>
            </div>
          )})}
        </div>
      </section>
    </div>
  );
}

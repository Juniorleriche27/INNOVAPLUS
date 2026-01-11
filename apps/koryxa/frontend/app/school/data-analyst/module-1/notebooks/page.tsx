"use client";

import { INNOVA_API_BASE } from "@/lib/env";

const notebooks = [
  {
    title: "KPI Baseline Calculator",
    file: "/notebooks/module-1/kpi_baseline_calculator.ipynb",
    outputs: ["module1_kpi_results.json", "module1_run_log.txt"],
  },
  {
    title: "KPI Dictionary Validator",
    file: "/notebooks/module-1/kpi_dictionary_validator.ipynb",
    outputs: ["module1_kpi_dictionary.csv"],
  },
];

export default function Module1NotebooksPage() {
  const datasetUrl = `${INNOVA_API_BASE}/school/data-analyst/module-1/dataset?seed=demo`;
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebooks obligatoires</h1>
        <p className="mt-2 text-sm text-slate-600">
          Chaque notebook genere des fichiers de preuve a soumettre pour debloquer le quiz.
        </p>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
          Dataset:{" "}
          <a className="text-sky-700 hover:underline" href={datasetUrl} target="_blank" rel="noreferrer">
            Telecharger le CSV (seed=demo)
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Liste des notebooks</h2>
        <div className="mt-4 space-y-4">
          {notebooks.map((nb) => (
            <div key={nb.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-sm font-semibold text-slate-900">{nb.title}</p>
              <p className="mt-2 text-sm text-slate-600">Sorties attendues : {nb.outputs.join(", ")}</p>
              <a className="mt-3 inline-flex text-sm font-semibold text-sky-700" href={nb.file} target="_blank" rel="noreferrer">
                Telecharger le notebook →
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

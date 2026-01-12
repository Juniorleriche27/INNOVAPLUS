import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-1/theme-3_kpi_dictionary.ipynb";
const datasetFile = "/datasets/data-analyst/module-1/koryxa_school_events_sample.csv";

export default function Theme3NotebookPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebook Thème 3</h1>
        <p className="mt-2 text-sm text-slate-600">
          Objectif : construire un dictionnaire KPI (6 lignes minimum), calculer au moins 2 KPI (principal + guardrail),
          puis exporter les preuves demandées.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href={notebookFile} download>
            Télécharger le notebook
          </a>
          <a className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href={datasetFile} download>
            Télécharger le dataset CSV (sample)
          </a>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href="/school/data-analyst/module-1/theme-3/submit"
          >
            Soumettre les exports
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Exports attendus</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
          <li>theme3_kpi_dictionary.csv</li>
          <li>theme3_kpi_values.json</li>
          <li>theme3_guardrail_analysis.md</li>
        </ul>
      </section>
    </div>
  );
}


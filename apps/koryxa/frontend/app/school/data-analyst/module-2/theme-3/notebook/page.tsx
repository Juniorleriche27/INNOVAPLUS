import Link from "next/link";

const datasetBase = "/datasets/data-analyst/module-2/theme-3";
const notebookFile = "/notebooks/data-analyst/module-2/theme-3_sql_extraction_lab.ipynb";

export default function Module2Theme3NotebookPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebook — Module 2 · Thème 3 (SQL extraction)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Télécharge les 5 CSV + le template SQL, exécute le notebook (SQLite), puis exporte les 3 datasets + le run report JSON.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Datasets (CSV)</p>
          <ul className="mt-2 list-disc pl-5">
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/events.csv`} download>
                events.csv
              </a>
            </li>
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/profiles.csv`} download>
                profiles.csv
              </a>
            </li>
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/marketing.csv`} download>
                marketing.csv
              </a>
            </li>
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/support_tickets.csv`} download>
                support_tickets.csv
              </a>
            </li>
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/validations.csv`} download>
                validations.csv
              </a>
            </li>
          </ul>

          <p className="mt-5 font-semibold text-slate-900">Template SQL</p>
          <ul className="mt-2 list-disc pl-5">
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/m2t3_queries_template.sql`} download>
                m2t3_queries_template.sql
              </a>
            </li>
          </ul>

          <p className="mt-5 font-semibold text-slate-900">Sorties à soumettre</p>
          <ul className="mt-2 list-disc pl-5">
            <li>m2t3_queries.sql</li>
            <li>m2t3_q1_funnel_by_theme.csv</li>
            <li>m2t3_q2_completion_by_country.csv</li>
            <li>m2t3_q3_notebook48h_vs_validation.csv</li>
            <li>m2t3_run_report.json</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href={notebookFile} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" download>
            Télécharger le notebook
          </a>
          <Link className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href="/school/data-analyst/module-2/theme-3/submit">
            Aller à la soumission
          </Link>
        </div>
      </section>
    </div>
  );
}


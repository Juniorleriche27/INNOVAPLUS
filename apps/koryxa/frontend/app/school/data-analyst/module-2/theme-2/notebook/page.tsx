import Link from "next/link";

const datasetBase = "/datasets/data-analyst/module-2/theme-2";
const notebookFile = "/notebooks/data-analyst/module-2/theme-2_csv_excel_powerquery_validation.ipynb";

export default function Module2Theme2NotebookPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebook — Module 2 · Thème 2</h1>
        <p className="mt-2 text-sm text-slate-600">
          Télécharge les datasets “messy”, exécute le notebook, puis exporte les livrables (CSV clean + JSON qualité +
          dictionnaire + script Power Query M + notes refresh).
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Datasets</p>
          <ul className="mt-2 list-disc pl-5">
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/raw_events_messy.csv`} download>
                raw_events_messy.csv
              </a>
            </li>
            <li>
              <a className="text-sky-700 hover:underline" href={`${datasetBase}/raw_profiles_messy.xlsx`} download>
                raw_profiles_messy.xlsx
              </a>
            </li>
          </ul>
          <p className="mt-4 font-semibold text-slate-900">Sorties à soumettre</p>
          <ul className="mt-2 list-disc pl-5">
            <li>m2t2_clean_learning_dataset.csv</li>
            <li>m2t2_quality_report.json</li>
            <li>m2t2_data_dictionary.md</li>
            <li>m2t2_powerquery.m</li>
            <li>m2t2_refresh_notes.md</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a
            href={notebookFile}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            download
          >
            Télécharger le notebook
          </a>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href="/school/data-analyst/module-2/theme-2/submit"
          >
            Aller à la soumission
          </Link>
        </div>
      </section>
    </div>
  );
}


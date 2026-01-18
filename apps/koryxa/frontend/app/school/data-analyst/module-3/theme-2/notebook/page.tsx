import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-3/theme-2_dedup_keys_uniqueness.ipynb";
const datasetFile = "/datasets/data-analyst/module-3/theme-2/users_identity_messy.csv";
const dictionaryFile = "/datasets/data-analyst/module-3/theme-2/data_dictionary.md";
const generatorFile = "/datasets/data-analyst/module-3/theme-2/generate_users_identity_messy.py";

export default function Module3Theme2Notebook() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Module 3 — Thème 2</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Dataset + notebook</h1>
      <p className="mt-2 text-sm text-slate-600">
        Télécharge le dataset “sale” reproductible, le data dictionary et le notebook. Le quiz est basé sur les exports
        générés.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={datasetFile} download>
          <p className="text-sm font-semibold text-slate-900">Dataset (.csv)</p>
          <p className="mt-1 text-xs text-slate-600">users_identity_messy.csv</p>
        </a>
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={dictionaryFile} download>
          <p className="text-sm font-semibold text-slate-900">Data dictionary (.md)</p>
          <p className="mt-1 text-xs text-slate-600">data_dictionary.md</p>
        </a>
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={notebookFile} download>
          <p className="text-sm font-semibold text-slate-900">Notebook (.ipynb)</p>
          <p className="mt-1 text-xs text-slate-600">theme-2_dedup_keys_uniqueness.ipynb</p>
        </a>
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={generatorFile} download>
          <p className="text-sm font-semibold text-slate-900">Générateur (optionnel)</p>
          <p className="mt-1 text-xs text-slate-600">generate_users_identity_messy.py</p>
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href="/school/data-analyst/module-3/theme-2/page/1"
        >
          Lire le cours
        </Link>
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href="/school/data-analyst/module-3/theme-2/submit"
        >
          Soumettre les preuves
        </Link>
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href="/school/data-analyst/module-3/theme-2/quiz">
          Aller au quiz
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Exports obligatoires à générer :
        <ul className="mt-2 list-disc pl-5">
          <li>`m3t2_key_audit.csv`</li>
          <li>`m3t2_duplicates_report.csv`</li>
          <li>`m3t2_dataset_dedup.csv`</li>
          <li>`m3t2_dedup_audit.csv`</li>
          <li>`m3t2_quality_report.json`</li>
          <li>`m3t2_dedup_rules.md`</li>
        </ul>
      </div>
    </section>
  );
}


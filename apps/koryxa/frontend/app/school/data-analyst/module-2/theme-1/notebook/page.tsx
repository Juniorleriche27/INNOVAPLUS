import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-2/theme-1_source_inventory.ipynb";
const inventoryTemplate = "/datasets/data-analyst/module-2/theme-1/source_inventory_template.csv";
const requirementsTemplate = "/datasets/data-analyst/module-2/theme-1/data_requirements_template.csv";

export default function Module2Theme1Notebook() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Module 2 — Thème 1</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Notebook + templates</h1>
      <p className="mt-2 text-sm text-slate-600">
        Télécharge le notebook et les 2 templates CSV. Place-les dans le même dossier avant exécution.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={notebookFile} download>
          <p className="text-sm font-semibold text-slate-900">Notebook (.ipynb)</p>
          <p className="mt-1 text-xs text-slate-600">theme-1_source_inventory.ipynb</p>
        </a>
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={inventoryTemplate} download>
          <p className="text-sm font-semibold text-slate-900">Template inventaire (CSV)</p>
          <p className="mt-1 text-xs text-slate-600">source_inventory_template.csv</p>
        </a>
        <a className="rounded-2xl border border-slate-200 p-4 hover:bg-slate-50" href={requirementsTemplate} download>
          <p className="text-sm font-semibold text-slate-900">Template data requirements (CSV)</p>
          <p className="mt-1 text-xs text-slate-600">data_requirements_template.csv</p>
        </a>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href="/school/data-analyst/module-2/theme-1"
        >
          Lire le cours
        </Link>
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          href="/school/data-analyst/module-2/theme-1/submit"
        >
          Soumettre les preuves
        </Link>
        <Link className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href="/school/data-analyst/module-2/theme-1/quiz">
          Aller au quiz
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Exports obligatoires à générer :
        <ul className="mt-2 list-disc pl-5">
          <li>`m2t1_inventory_filled.csv`</li>
          <li>`m2t1_data_mapping.md`</li>
          <li>`m2t1_collection_plan.md`</li>
          <li>`m2t1_quality_checks.json`</li>
        </ul>
      </div>
    </section>
  );
}

import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-1/theme-5_capstone_packager.ipynb";

export default function Theme5NotebookPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebook — Thème 5</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ce notebook génère automatiquement le Capstone Pack (ZIP) et un fichier de checklist.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Entrées attendues (dans le même dossier d’exécution)</p>
          <ul className="mt-2 list-disc pl-5">
            <li>theme2_baseline_metrics.json</li>
            <li>theme3_kpi_dictionary.csv</li>
            <li>theme4_analysis_plan.md</li>
            <li>theme4_data_requirements.csv</li>
            <li>theme4_acceptance_criteria.json</li>
          </ul>
          <p className="mt-4 font-semibold text-slate-900">Sorties générées</p>
          <ul className="mt-2 list-disc pl-5">
            <li>capstone_brief.md</li>
            <li>capstone_checklist.json</li>
            <li>README.md</li>
            <li>module1_capstone_submission.zip</li>
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
            href="/school/data-analyst/module-1/theme-5/submit"
          >
            Aller à la soumission
          </Link>
        </div>
      </section>
    </div>
  );
}


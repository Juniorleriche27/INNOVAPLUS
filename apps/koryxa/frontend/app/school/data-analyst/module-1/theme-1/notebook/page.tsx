import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-1/theme-1_stakeholder_grid.ipynb";
const datasetFile = "/datasets/data-analyst/module-1/stakeholders_input.csv";

export default function Theme1NotebookPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebook Theme 1</h1>
        <p className="mt-2 text-sm text-slate-600">
          Execute le notebook pour generer les preuves demandees. Le quiz reste verrouille tant que les fichiers ne sont
          pas soumis et valides cote serveur.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href={notebookFile} download>
            Telecharger le notebook
          </a>
          <a className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href={datasetFile} download>
            Telecharger le dataset CSV
          </a>
          <Link className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href="/school/data-analyst/module-1/theme-1/submit">
            Soumettre les preuves
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Fichiers a produire</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
          <li>theme1_stakeholder_register.csv</li>
          <li>theme1_engagement_plan.md</li>
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          Le CSV doit contenir les colonnes obligatoires et au moins 10 lignes.
        </p>
      </section>
    </div>
  );
}

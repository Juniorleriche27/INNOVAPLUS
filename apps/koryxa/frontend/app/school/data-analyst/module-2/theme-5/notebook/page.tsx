import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-2/theme-5_capstone_packager.ipynb";

export default function Module2Theme5NotebookPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebook — Module 2 · Thème 5 (Capstone collecte)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Exécute le packager pour générer un ZIP complet (structure capstone/ + scripts + preuves).
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Inputs attendus (à la racine avant exécution)</p>
          <ul className="mt-2 list-disc pl-5">
            <li>events_clean.csv</li>
            <li>profiles_by_user.csv</li>
            <li>transactions_clean.csv</li>
          </ul>

          <p className="mt-5 font-semibold text-slate-900">Sortie</p>
          <ul className="mt-2 list-disc pl-5">
            <li>module2_capstone_collection_pack.zip</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href={notebookFile} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" download>
            Télécharger le notebook packager
          </a>
          <Link className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700" href="/school/data-analyst/module-2/theme-5/submit">
            Aller à la soumission
          </Link>
        </div>
      </section>
    </div>
  );
}


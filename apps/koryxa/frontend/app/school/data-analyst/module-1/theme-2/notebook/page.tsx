import Link from "next/link";

const notebookFile = "/notebooks/data-analyst/module-1/theme-2_smart_objectives.ipynb";

export default function Theme2NotebookPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notebook Theme 2</h1>
        <p className="mt-2 text-sm text-slate-600">
          Ce notebook te guide pour formuler un objectif SMART et produire un baseline simple. Tu peux l’utiliser comme
          support de travail pendant la lecture.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white" href={notebookFile} download>
            Télécharger le notebook
          </a>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href="/school/data-analyst/module-1/theme-2/page/1"
          >
            Revenir au cours
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Sorties conseillées</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
          <li>Un objectif SMART (baseline, cible, délai, périmètre, garde-fou)</li>
          <li>3 à 6 questions d’analyse (descriptive, diagnostic, segmentation, parcours, leviers)</li>
          <li>2 hypothèses testables</li>
        </ul>
      </section>
    </div>
  );
}


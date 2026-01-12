import Link from "next/link";

export default function Theme2SubmitPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Soumettre — Theme 2</h1>
        <p className="mt-2 text-sm text-slate-600">
          La soumission du Theme 2 sera activée après validation du format des livrables. Pour l’instant, garde tes
          notes (objectif SMART + questions d’analyse) : elles te serviront au mini-projet de fin de module.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href="/school/data-analyst/module-1/theme-2/page/1"
          >
            Revenir au cours
          </Link>
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            href="/school/data-analyst/module-1/theme-2/notebook"
          >
            Ouvrir le notebook
          </Link>
        </div>
      </section>
    </div>
  );
}


import Link from "next/link";
export default function DataAnalystModule2() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Certificat Data Analyst</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Module 2 — Collecte</h1>
        <p className="mt-2 text-sm text-slate-600">
          Objectif : identifier les sources, produire un inventaire, un data mapping minimal et un plan de collecte reproductible.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Choisis une leçon dans la sidebar (Sommaire du module) pour démarrer la lecture.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            href="/school/data-analyst/module-2/theme-1/page/1"
          >
            Commencer la lecture
          </Link>
        </div>
      </section>
    </div>
  );
}

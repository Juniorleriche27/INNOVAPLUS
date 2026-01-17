import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DataAnalystModule3() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Module 3 — Nettoyage</h1>
      <p className="mt-2 text-sm text-slate-600">
        Choisis une leçon dans la sidebar (dropdown Module + sommaire). Le centre ne reliste pas les thèmes.
      </p>
      <div className="mt-6">
        <Link className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white" href="/school/data-analyst/module-3/theme-1/page/1">
          Commencer : Thème 1 →
        </Link>
      </div>
    </section>
  );
}

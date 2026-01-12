import Link from "next/link";

export default function Theme3QuizPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Quiz — Thème 3</h1>
        <p className="mt-2 text-sm text-slate-600">
          Le quiz Thème 3 sera déverrouillé après branchement de la validation serveur des exports du notebook
          (dictionnaire KPI + valeurs + analyse guardrail).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            href="/school/data-analyst/module-1/quiz"
          >
            Ouvrir le quiz du Module 1
          </Link>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href="/school/data-analyst/module-1/theme-3/submit"
          >
            Aller à Soumettre
          </Link>
        </div>
      </section>
    </div>
  );
}


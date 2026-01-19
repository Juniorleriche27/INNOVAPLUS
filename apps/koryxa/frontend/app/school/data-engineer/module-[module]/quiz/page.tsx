export default function DataEngineerModuleQuiz({ params }: { params: { module: string } }) {
  const moduleNumber = Number.parseInt(params.module, 10);
  const n = Number.isFinite(moduleNumber) ? moduleNumber : 1;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Examen — Module {n}</h1>
      <button disabled className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
        Bientôt disponible
      </button>
      <p className="mt-4 text-sm text-slate-600">Le quiz de ce module n’est pas encore disponible.</p>
    </section>
  );
}


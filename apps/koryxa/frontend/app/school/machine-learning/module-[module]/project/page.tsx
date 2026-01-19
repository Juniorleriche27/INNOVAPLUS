export default function MachineLearningModuleProject({ params }: { params: { module: string } }) {
  const moduleNumber = Number.parseInt(params.module, 10);
  const n = Number.isFinite(moduleNumber) ? moduleNumber : 1;
  const helper = "Format accepté : PDF, PPTX, ZIP (selon consigne du mentor).";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Projet de validation — Module {n}</h1>
      <p className="mt-2 text-sm text-slate-600">Ce projet valide tes compétences du module.</p>

      <div className="mt-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Objectif du projet</h2>
          <p className="mt-2 text-sm text-slate-600">—</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Livrables attendus</h2>
          <p className="mt-2 text-sm text-slate-600">—</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Critères de validation</h2>
          <p className="mt-2 text-sm text-slate-600">—</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Soumettre</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {["Livrable 1", "Livrable 2", "Livrable 3", "Livrable 4"].map((label) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <label className="text-sm font-semibold text-slate-900">{label}</label>
                <input type="file" className="mt-2 block w-full text-sm text-slate-700" />
                <p className="mt-2 text-xs text-slate-500">{helper}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


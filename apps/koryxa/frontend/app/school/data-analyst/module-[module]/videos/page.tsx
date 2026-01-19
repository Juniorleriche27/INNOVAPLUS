import { getModuleMeta } from "@/app/school/components/moduleMeta";

export default function DataAnalystModuleVideos({ params }: { params: { module: string } }) {
  const moduleNumber = Number.parseInt(params.module, 10);
  const meta = getModuleMeta("data-analyst", Number.isFinite(moduleNumber) ? moduleNumber : 1);
  const themes = Array.from({ length: meta.themesCount }, (_, i) => `Thème ${i + 1}`);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{meta.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{meta.objectiveShort}</p>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-slate-900">Thèmes :</div>
          <div className="flex flex-wrap gap-2">
            <button disabled className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
              Tous
            </button>
            {themes.map((t) => (
              <button key={t} disabled className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Langue :</div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              {["Tous", "FR", "EN"].map((l) => (
                <button key={l} disabled className="rounded-lg px-3 py-1 text-sm text-slate-700">
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Trier par :</div>
            <select
              disabled
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              defaultValue="Recommandé"
            >
              {["Recommandé", "Durée ↑", "Durée ↓", "Plus récent"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* empty on purpose */}
        </div>
        <div className="mt-6 text-sm text-slate-600">Aucune vidéo pour le moment pour ce module.</div>
        <button disabled className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
          Charger plus
        </button>
      </div>
    </section>
  );
}


import ModulePageShell from "@/app/school/components/ModulePageShell";
import { getTrack, type TrackId } from "@/data/school/catalog";

export default function VideosTab({ trackId, moduleId }: { trackId: TrackId; moduleId: string }) {
  const track = getTrack(trackId);
  const mod = track?.modules.find((m) => m.id === moduleId);

  return (
    <ModulePageShell trackId={trackId} moduleId={moduleId}>
      <h1 className="text-2xl font-semibold text-slate-900">{mod?.title ?? "Module"}</h1>
      <p className="mt-2 text-sm text-slate-600">Objectif du module (court)</p>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-slate-900">Thèmes :</div>
          <div className="flex flex-wrap gap-2">
            <button disabled className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
              Tous
            </button>
            <button disabled className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              Thème 1
            </button>
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
            <select disabled className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" />
        <div className="mt-6 text-sm text-slate-600">Aucune vidéo pour le moment pour ce module.</div>
        <button disabled className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
          Charger plus
        </button>
      </div>
    </ModulePageShell>
  );
}


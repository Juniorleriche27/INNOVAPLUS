"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getTrack, type TrackId } from "@/data/school/catalog";
import { normalizeInlineSpacing } from "@/app/school/components/moduleHelpers";

const TRACK_OPTIONS = [
  { id: "fundamental", label: "Fondamental", description: "Base data, Python, SQL, visualisation." },
  { id: "data-analyst", label: "Data Analyst", description: "KPIs, analyse, reporting et restitution." },
  { id: "data-engineer", label: "Data Engineer", description: "Pipelines, flux et structuration." },
  { id: "data-science", label: "Data Scientist", description: "Analyse avancee et modelisation." },
  { id: "machine-learning", label: "Machine Learning", description: "Modeles, experimentation et mise en pratique." },
] as const;

function parseSelection(pathname: string): { track: TrackId; moduleId: string | null } {
  const match = pathname.match(/^\/school\/(data-analyst|data-engineer|data-science|machine-learning)\/(module-\d+)(?:\/|$)/);
  if (match) {
    return { track: match[1] as TrackId, moduleId: match[2] };
  }
  const fundamentalMatch = pathname.match(/^\/school\/parcours\/fondamental\/([^/]+)(?:\/|$)/);
  if (fundamentalMatch) {
    const moduleSlug = decodeURIComponent(fundamentalMatch[1]);
    const track = getTrack("fundamental");
    const mod = track?.modules.find((m) => m.href.endsWith(`/school/parcours/fondamental/${moduleSlug}`));
    return { track: "fundamental", moduleId: mod?.id ?? "module-1" };
  }
  return { track: "data-analyst", moduleId: null };
}

function defaultHrefFor(trackId: TrackId, moduleId: string) {
  const track = getTrack(trackId);
  const mod = track?.modules.find((m) => m.id === moduleId) ?? track?.modules[0];
  return mod?.href ?? "/school";
}

export default function SchoolSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const selection = useMemo(() => parseSelection(pathname), [pathname]);
  const trackId = selection.track;
  const track = getTrack(trackId);
  const modules = track?.modules ?? [];
  const selectedModuleId = selection.moduleId ?? modules[0]?.id ?? null;
  const selectedModuleIndex = modules.findIndex((module) => module.id === selectedModuleId);
  const activeTrackMeta = TRACK_OPTIONS.find((item) => item.id === trackId);
  const currentModule = selectedModuleIndex >= 0 ? modules[selectedModuleIndex] : modules[0];
  const previousModule = selectedModuleIndex > 0 ? modules[selectedModuleIndex - 1] : null;
  const nextModule = selectedModuleIndex >= 0 && selectedModuleIndex < modules.length - 1 ? modules[selectedModuleIndex + 1] : null;

  return (
    <div className="h-full">
      <div className="flex h-full flex-col rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">KORYXA School</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Navigation</h2>

        <div className="mt-5 rounded-[24px] border border-sky-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(224,242,254,0.66))] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sky-700">Parcours actif</p>
          <p className="mt-2 text-base font-semibold text-slate-950">{track?.label ?? "Parcours"}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {activeTrackMeta?.description ?? "Choisir un parcours, puis naviguer rapidement entre les modules."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700">
              {modules.length} module{modules.length > 1 ? "s" : ""}
            </span>
            {currentModule ? (
              <span className="inline-flex items-center rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700">
                Actif: {selectedModuleIndex >= 0 ? selectedModuleIndex + 1 : 1}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-900">Parcours</label>
            <p className="mt-1 text-xs leading-5 text-slate-500">Change de specialisation sans quitter la navigation School.</p>
            <select
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={trackId}
              onChange={(e) => {
                const nextTrackId = e.target.value as TrackId;
                const nextTrack = getTrack(nextTrackId);
                const nextModuleId = nextTrack?.modules[0]?.id ?? "module-1";
                router.push(defaultHrefFor(nextTrackId, nextModuleId));
              }}
            >
              {TRACK_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Acces rapides</p>
              {currentModule ? (
                <Link
                  href={currentModule.href}
                  className="text-[11px] font-semibold text-sky-700 transition hover:text-sky-800"
                >
                  Reprendre
                </Link>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2">
              <Link
                href="/school/planning"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/40"
              >
                Mon planning d’apprentissage
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/school/specialisations"
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/40"
              >
                Voir les specialisations
                <span className="text-slate-400">→</span>
              </Link>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-slate-900">Modules</label>
              <span className="text-[11px] font-medium text-slate-500">
                {selectedModuleIndex >= 0 ? `${selectedModuleIndex + 1}/${modules.length}` : `${modules.length}`}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Navigue directement entre les modules sans repasser par un select.</p>

            {modules.length === 0 ? (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Aucun module pour le moment.
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!previousModule}
                    onClick={() => previousModule && router.push(previousModule.href)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Module precedent
                  </button>
                  <button
                    type="button"
                    disabled={!nextModule}
                    onClick={() => nextModule && router.push(nextModule.href)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-right text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Module suivant →
                  </button>
                </div>

                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {modules
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((module) => {
                      const active = module.id === selectedModuleId;
                      const title = normalizeInlineSpacing(
                        module.title.startsWith("Module") ? module.title : `Module ${module.order}`,
                      );

                      return (
                        <Link
                          key={module.id}
                          href={module.href}
                          className={`block rounded-[22px] border px-4 py-3 transition ${
                            active
                              ? "border-sky-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(224,242,254,0.92))] shadow-[0_12px_24px_rgba(14,165,233,0.12)]"
                              : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${active ? "text-sky-700" : "text-slate-400"}`}>
                                Module {module.order}
                              </p>
                              <p className={`mt-1 text-sm font-semibold leading-6 ${active ? "text-slate-950" : "text-slate-800"}`}>
                                {title.replace(/^Module \d+\s+—\s+/, "")}
                              </p>
                            </div>
                            <span
                              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[11px] font-bold ${
                                active ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {module.order}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-6 text-xs leading-5 text-slate-500">
          Navigation School optimisee pour changer de parcours, reprendre un module ou avancer sans friction.
        </div>
      </div>
    </div>
  );
}

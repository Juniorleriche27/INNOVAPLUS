"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getTrack, type TrackId } from "@/data/school/catalog";
import { normalizeInlineSpacing } from "@/app/school/components/moduleHelpers";

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

  return (
    <div className="h-full">
      <div className="flex h-full flex-col rounded-none border-r border-slate-200 bg-white px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">KORYXA School</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Navigation</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-900">Parcours</label>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              value={trackId}
              onChange={(e) => {
                const nextTrackId = e.target.value as TrackId;
                const nextTrack = getTrack(nextTrackId);
                const nextModuleId = nextTrack?.modules[0]?.id ?? "module-1";
                router.push(defaultHrefFor(nextTrackId, nextModuleId));
              }}
            >
              {(
                [
                  { id: "fundamental", label: "Fondamental" },
                  { id: "data-analyst", label: "Data Analyst" },
                  { id: "data-engineer", label: "Data Engineer" },
                  { id: "data-science", label: "Data Scientist" },
                  { id: "machine-learning", label: "Machine Learning" },
                ] as const
              ).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">Outils</p>
            <div className="mt-2">
              <Link
                href="/school/planning"
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Mon planning d’apprentissage
                <span className="text-slate-400">→</span>
              </Link>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-900">Modules</label>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-500"
              value={selectedModuleId ?? ""}
              disabled={modules.length === 0}
              onChange={(e) => {
                const nextModuleId = e.target.value;
                router.push(defaultHrefFor(trackId, nextModuleId));
              }}
            >
              {modules.length === 0 ? (
                <option value="">Aucun module pour le moment</option>
              ) : (
                modules
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {normalizeInlineSpacing(m.title.startsWith("Module") ? m.title : `Module ${m.order}`)}
                    </option>
                  ))
              )}
            </select>
          </div>
        </div>

        <div className="mt-auto pt-6 text-xs text-slate-500">Body et sidebar scrollent indépendamment.</div>
      </div>
    </div>
  );
}

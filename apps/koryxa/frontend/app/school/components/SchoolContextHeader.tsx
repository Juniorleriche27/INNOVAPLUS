"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getTrack, type TrackId } from "@/data/school/catalog";
import { normalizeInlineSpacing } from "@/app/school/components/moduleHelpers";

function parseSelection(pathname: string): { track: TrackId | null; moduleTitle: string | null; moduleId: string | null } {
  const match = pathname.match(/^\/school\/(data-analyst|data-engineer|data-science|machine-learning)\/(module-\d+)(?:\/|$)/);
  if (match) {
    const track = match[1] as TrackId;
    const moduleId = match[2];
    const mod = getTrack(track)?.modules.find((m) => m.id === moduleId);
    return { track, moduleTitle: mod?.title ?? moduleId, moduleId };
  }
  const fundamental = pathname.match(/^\/school\/parcours\/fondamental\/([^/]+)(?:\/|$)/);
  if (fundamental) {
    const slug = decodeURIComponent(fundamental[1]);
    const track = getTrack("fundamental");
    const mod = track?.modules.find((m) => m.href.endsWith(`/school/parcours/fondamental/${slug}`));
    return { track: "fundamental", moduleTitle: mod?.title ?? "Fondamental", moduleId: mod?.id ?? null };
  }
  return { track: null, moduleTitle: null, moduleId: null };
}

export default function SchoolContextHeader() {
  const pathname = usePathname();
  const selection = useMemo(() => parseSelection(pathname), [pathname]);

  if (!selection.track || !selection.moduleTitle) return null;
  const trackLabel = getTrack(selection.track)?.label ?? selection.track;
  const modules = getTrack(selection.track)?.modules ?? [];
  const selectedModuleIndex = modules.findIndex((module) => module.id === selection.moduleId);
  const previousModule = selectedModuleIndex > 0 ? modules[selectedModuleIndex - 1] : null;
  const nextModule = selectedModuleIndex >= 0 && selectedModuleIndex < modules.length - 1 ? modules[selectedModuleIndex + 1] : null;
  const moduleTitle = normalizeInlineSpacing(selection.moduleTitle);

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/96 px-5 py-4 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
          <div>
            <span className="font-semibold text-slate-900">Parcours :</span> {trackLabel}
          </div>
          <div>
            <span className="font-semibold text-slate-900">Module :</span> {moduleTitle}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {previousModule ? (
            <Link
              href={previousModule.href}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/50 hover:text-sky-700"
            >
              ← Module precedent
            </Link>
          ) : null}
          {nextModule ? (
            <Link
              href={nextModule.href}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50/50 hover:text-sky-700"
            >
              Module suivant →
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

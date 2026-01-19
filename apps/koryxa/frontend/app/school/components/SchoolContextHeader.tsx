"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { getTrack, type TrackId } from "@/data/school/catalog";

function parseSelection(pathname: string): { track: TrackId | null; moduleTitle: string | null } {
  const match = pathname.match(/^\/school\/(data-analyst|data-engineer|data-science|machine-learning)\/(module-\d+)(?:\/|$)/);
  if (match) {
    const track = match[1] as TrackId;
    const moduleId = match[2];
    const mod = getTrack(track)?.modules.find((m) => m.id === moduleId);
    return { track, moduleTitle: mod?.title ?? moduleId };
  }
  const fundamental = pathname.match(/^\/school\/parcours\/fondamental\/([^/]+)(?:\/|$)/);
  if (fundamental) {
    const slug = decodeURIComponent(fundamental[1]);
    const track = getTrack("fundamental");
    const mod = track?.modules.find((m) => m.href.endsWith(`/school/parcours/fondamental/${slug}`));
    return { track: "fundamental", moduleTitle: mod?.title ?? "Fondamental" };
  }
  return { track: null, moduleTitle: null };
}

export default function SchoolContextHeader() {
  const pathname = usePathname();
  const selection = useMemo(() => parseSelection(pathname), [pathname]);

  if (!selection.track || !selection.moduleTitle) return null;
  const trackLabel = getTrack(selection.track)?.label ?? selection.track;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
        <div>
          <span className="font-semibold text-slate-900">Parcours :</span> {trackLabel}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Module :</span> {selection.moduleTitle}
        </div>
      </div>
    </div>
  );
}

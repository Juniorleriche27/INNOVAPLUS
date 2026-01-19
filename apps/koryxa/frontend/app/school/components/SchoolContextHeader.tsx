"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

type TrackKey = "fondamental" | "data-analyst" | "data-engineer" | "data-science" | "machine-learning";

const TRACK_LABEL: Record<TrackKey, string> = {
  fondamental: "Fondamental",
  "data-analyst": "Data Analyst",
  "data-engineer": "Data Engineer",
  "data-science": "Data Science",
  "machine-learning": "Machine Learning",
};

const FUNDAMENTAL_MODULE_IDS = [
  "intro-metiers",
  "python-data",
  "manip-donnees",
  "sql-bases",
  "visualisation",
  "projet-synthese",
];

function parseSelection(pathname: string): { track: TrackKey | null; moduleLabel: string | null } {
  const match = pathname.match(/^\/school\/(data-analyst|data-engineer|data-science|machine-learning)\/module-(\d+)(?:\/|$)/);
  if (match) {
    const n = Number.parseInt(match[2], 10);
    return { track: match[1] as TrackKey, moduleLabel: Number.isFinite(n) ? `Module ${n}` : null };
  }
  const fundamental = pathname.match(/^\/school\/parcours\/fondamental\/([^/]+)(?:\/|$)/);
  if (fundamental) {
    const id = decodeURIComponent(fundamental[1]);
    const idx = FUNDAMENTAL_MODULE_IDS.indexOf(id);
    return { track: "fondamental", moduleLabel: idx === -1 ? null : `Module ${idx + 1}` };
  }
  return { track: null, moduleLabel: null };
}

export default function SchoolContextHeader() {
  const pathname = usePathname();
  const selection = useMemo(() => parseSelection(pathname), [pathname]);

  if (!selection.track || !selection.moduleLabel) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
        <div>
          <span className="font-semibold text-slate-900">Parcours :</span> {TRACK_LABEL[selection.track]}
        </div>
        <div>
          <span className="font-semibold text-slate-900">Module :</span> {selection.moduleLabel}
        </div>
      </div>
    </div>
  );
}


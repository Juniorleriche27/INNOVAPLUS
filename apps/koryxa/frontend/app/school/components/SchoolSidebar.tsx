"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

type TrackKey = "fondamental" | "data-analyst" | "data-engineer" | "data-science" | "machine-learning";

const TRACKS: Array<{ key: TrackKey; label: string; maxModules: number }> = [
  { key: "fondamental", label: "Fondamental", maxModules: 6 },
  { key: "data-analyst", label: "Data Analyst", maxModules: 7 },
  { key: "data-engineer", label: "Data Engineer", maxModules: 2 },
  { key: "data-science", label: "Data Science", maxModules: 1 },
  { key: "machine-learning", label: "Machine Learning", maxModules: 1 },
];

const FUNDAMENTAL_MODULE_IDS = [
  "intro-metiers",
  "python-data",
  "manip-donnees",
  "sql-bases",
  "visualisation",
  "projet-synthese",
];

function parseSelection(pathname: string): { track: TrackKey; moduleNumber: number | null } {
  const match = pathname.match(/^\/school\/(data-analyst|data-engineer|data-science|machine-learning)\/module-(\d+)(?:\/|$)/);
  if (match) {
    const track = match[1] as TrackKey;
    const moduleNumber = Number.parseInt(match[2], 10);
    return { track, moduleNumber: Number.isFinite(moduleNumber) ? moduleNumber : 1 };
  }
  const fundamental = pathname.match(/^\/school\/parcours\/fondamental\/([^/]+)(?:\/|$)/);
  if (fundamental) {
    const id = decodeURIComponent(fundamental[1]);
    const idx = FUNDAMENTAL_MODULE_IDS.indexOf(id);
    return { track: "fondamental", moduleNumber: idx === -1 ? 1 : idx + 1 };
  }
  return { track: "fondamental", moduleNumber: null };
}

function routeFor(track: TrackKey, moduleNumber: number) {
  if (track === "fondamental") {
    const safeIdx = Math.min(Math.max(moduleNumber, 1), FUNDAMENTAL_MODULE_IDS.length) - 1;
    return `/school/parcours/fondamental/${FUNDAMENTAL_MODULE_IDS[safeIdx]}`;
  }
  return `/school/${track}/module-${moduleNumber}`;
}

export default function SchoolSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const selection = useMemo(() => parseSelection(pathname), [pathname]);
  const track = selection.track;
  const trackMeta = TRACKS.find((t) => t.key === track) ?? TRACKS[0];
  const moduleNumber = selection.moduleNumber ?? 1;
  const moduleOptions = Array.from({ length: trackMeta.maxModules }, (_, i) => i + 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">KORYXA School</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">Navigation</h2>

      <div className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-semibold text-slate-900">Parcours</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={track}
            onChange={(e) => {
              const nextTrack = e.target.value as TrackKey;
              router.push(routeFor(nextTrack, 1));
            }}
          >
            {TRACKS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-900">Modules</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            value={moduleNumber}
            onChange={(e) => {
              const nextModule = Number.parseInt(e.target.value, 10);
              router.push(routeFor(track, nextModule));
            }}
          >
            {moduleOptions.map((n) => (
              <option key={n} value={n}>
                Module {n}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}


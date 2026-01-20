"use client";

import { useMemo, useState } from "react";
import type { SeedVideo } from "@/app/school/lib/getModuleSeedContent";

type LanguageFilter = "Tous" | "FR" | "EN";

function normalizeLang(lang: SeedVideo["lang"]): Exclude<LanguageFilter, "Tous"> {
  return lang.toUpperCase() as Exclude<LanguageFilter, "Tous">;
}

function getVideoHref(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`;
}

function getThumbnailSrc(youtubeId: string) {
  return `https://img.youtube.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`;
}

export default function SeedVideosView({ videos }: { videos: SeedVideo[] }) {
  const [themeFilter, setThemeFilter] = useState<number | "all">("all");
  const [langFilter, setLangFilter] = useState<LanguageFilter>("Tous");
  const [sortBy, setSortBy] = useState<"Recommandé">("Recommandé");
  const [visibleCount, setVisibleCount] = useState(12);

  const themes = useMemo(() => {
    const uniq = new Map<number, string>();
    for (const video of videos) {
      uniq.set(video.theme, video.themeTitle);
    }
    return [...uniq.entries()].sort((a, b) => a[0] - b[0]);
  }, [videos]);

  const filtered = useMemo(() => {
    let out = videos;
    if (themeFilter !== "all") {
      out = out.filter((v) => v.theme === themeFilter);
    }
    if (langFilter !== "Tous") {
      out = out.filter((v) => normalizeLang(v.lang) === langFilter);
    }

    if (sortBy === "Recommandé") {
      const hasRank = out.some((v) => typeof v.rank === "number");
      const hasOrder = out.some((v) => typeof v.order === "number");
      out = [...out].sort((a, b) => {
        const aRec = a.recommended ? 1 : 0;
        const bRec = b.recommended ? 1 : 0;
        if (aRec !== bRec) return bRec - aRec;
        if (hasRank) return (b.rank ?? 0) - (a.rank ?? 0);
        if (hasOrder) return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
        return 0;
      });
    }

    return out;
  }, [langFilter, sortBy, themeFilter, videos]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-slate-900">Thèmes :</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setThemeFilter("all");
                setVisibleCount(12);
              }}
              className={`rounded-full border px-3 py-1 text-sm ${
                themeFilter === "all"
                  ? "border-slate-200 bg-slate-50 text-slate-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              aria-pressed={themeFilter === "all"}
            >
              Tous
            </button>
            {themes.map(([theme]) => (
              <button
                key={theme}
                type="button"
                onClick={() => {
                  setThemeFilter(theme);
                  setVisibleCount(12);
                }}
                className={`rounded-full border px-3 py-1 text-sm ${
                  themeFilter === theme
                    ? "border-slate-200 bg-slate-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-pressed={themeFilter === theme}
              >
                Thème {theme}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Langue :</div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              {(["Tous", "FR", "EN"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLangFilter(l);
                    setVisibleCount(12);
                  }}
                  className={`rounded-lg px-3 py-1 text-sm ${
                    langFilter === l ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-pressed={langFilter === l}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Trier par :</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "Recommandé")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              <option value="Recommandé">Recommandé</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        {visible.length === 0 ? (
          <div className="text-sm text-slate-600">Aucune vidéo pour le moment pour ce module.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((v) => {
              const lang = normalizeLang(v.lang);
              return (
                <a
                  key={`${v.youtubeId}-${v.lang}`}
                  href={getVideoHref(v.youtubeId)}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-video bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getThumbnailSrc(v.youtubeId)} alt="" className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-800">
                        {lang}
                      </span>
                      {v.recommended ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Recommandé
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-3 p-5">
                    <p className="text-sm font-semibold text-slate-900 group-hover:underline">{v.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full border border-slate-200 px-2 py-1">
                        Thème {v.theme} — {v.themeTitle}
                      </span>
                      <span className="rounded-full border border-slate-200 px-2 py-1">Durée —</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-600">À la fin, tu sauras cadrer ce thème et choisir tes KPIs.</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {canLoadMore ? (
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + 12)}
            className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Charger plus
          </button>
        ) : null}
      </div>
    </div>
  );
}

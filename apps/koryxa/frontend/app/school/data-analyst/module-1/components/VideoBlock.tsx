"use client";

import { useEffect, useMemo, useState } from "react";
import type { ThemeVideo } from "../content";

type Props = { videos: ThemeVideo[] };

function toUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export default function VideoBlock({ videos }: Props) {
  const [availability, setAvailability] = useState<Record<string, boolean | undefined>>({});
  const urls = useMemo(() => Array.from(new Set(videos.map((v) => toUrl(v.youtubeId)))), [videos]);

  useEffect(() => {
    let active = true;
    async function checkVideo(url: string) {
      try {
        const resp = await fetch(`/api/video/check?url=${encodeURIComponent(url)}`);
        const data = await resp.json().catch(() => ({}));
        if (!active) return;
        setAvailability((prev) => ({ ...prev, [url]: Boolean(data?.ok) }));
      } catch {
        if (!active) return;
        setAvailability((prev) => ({ ...prev, [url]: false }));
      }
    }
    urls.forEach((url) => {
      if (availability[url] === undefined) checkVideo(url);
    });
    return () => {
      active = false;
    };
  }, [urls, availability]);

  const fr = videos.filter((v) => v.lang === "fr");
  const en = videos.filter((v) => v.lang === "en");

  function renderList(list: ThemeVideo[], label: string) {
    if (list.length === 0) return null;
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {list.map((video) => {
          const id = video.youtubeId;
          const url = toUrl(id);
          const state = availability[url];
          return (
            <div key={video.youtubeId} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{video.title}</p>
                {state === false ? (
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                    Indisponible
                  </span>
                ) : null}
              </div>
              {state === undefined ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
                  Verification de la video en cours...
                </div>
              ) : state ? (
                <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${id}`}
                    title={video.title}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
                  Video indisponible — utilisez le lien externe ou choisissez une autre ressource.
                </div>
              )}
              <a className="inline-flex text-sm font-semibold text-sky-700" href={url} target="_blank" rel="noreferrer">
                Ouvrir sur YouTube
              </a>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderList(fr, "Ressources — Français")}
      {renderList(en, "Ressources — English")}
    </div>
  );
}

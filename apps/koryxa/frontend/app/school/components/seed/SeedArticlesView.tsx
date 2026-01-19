"use client";

import { useMemo, useState } from "react";
import ArticleRow from "@/app/school/components/ArticleRow";
import type { SeedArticle } from "@/app/school/lib/getModuleSeedContent";

type LanguageFilter = "Tous" | "FR" | "EN";

function getLangFromUrl(url: string): Exclude<LanguageFilter, "Tous"> {
  return url.includes("/fr-fr/") ? "FR" : "EN";
}

function getSourceName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

export default function SeedArticlesView({ articles }: { articles: SeedArticle[] }) {
  const [themeFilter, setThemeFilter] = useState<number | "all">("all");
  const [langFilter, setLangFilter] = useState<LanguageFilter>("Tous");
  const [sortBy, setSortBy] = useState<"Recommandé">("Recommandé");

  const themes = useMemo(() => {
    const uniq = new Map<number, string>();
    for (const article of articles) {
      uniq.set(article.theme, article.themeTitle);
    }
    return [...uniq.entries()].sort((a, b) => a[0] - b[0]);
  }, [articles]);

  const filtered = useMemo(() => {
    let out = articles.map((a, idx) => ({ ...a, __idx: idx }));

    if (themeFilter !== "all") {
      out = out.filter((a) => a.theme === themeFilter);
    }
    if (langFilter !== "Tous") {
      out = out.filter((a) => getLangFromUrl(a.url) === langFilter);
    }

    if (sortBy === "Recommandé") {
      out = [...out].sort((a, b) => a.__idx - b.__idx);
    }

    return out;
  }, [articles, langFilter, sortBy, themeFilter]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-slate-900">Thèmes :</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setThemeFilter("all")}
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
                onClick={() => setThemeFilter(theme)}
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
                  onClick={() => setLangFilter(l)}
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

      {filtered.length === 0 ? (
        <div className="text-sm text-slate-600">Aucun article pour le moment pour ce module.</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((a) => (
            <ArticleRow
              key={`${a.theme}-${a.url}`}
              title={a.title}
              source={getSourceName(a.url)}
              language={getLangFromUrl(a.url)}
              readingTimeLabel="Lecture"
              themeLabel={`Thème ${a.theme} — ${a.themeTitle}`}
              descriptionShort={`À lire pour approfondir : ${a.themeTitle}.`}
              href={a.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}


import Link from "next/link";
import VideoBlock from "./VideoBlock";
import type { ThemeArticle, ThemeVideo } from "../content";

export type ThemePageSection = {
  heading: string;
  body: string[];
};

export type ThemePage = {
  title: string;
  sections: ThemePageSection[];
};

export type ThemeMeta = {
  title: string;
  module: string;
  readingTime: string;
};

function clampPage(raw: unknown, total: number): number {
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(Math.floor(n), total);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PagedThemeLayout(props: {
  meta: ThemeMeta;
  pages: ThemePage[];
  videos: ThemeVideo[];
  articles: ThemeArticle[];
  currentPage: number;
  hrefForPage: (page: number) => string;
  actions?: { label: string; href: string }[];
}) {
  const { meta, pages, videos, articles, hrefForPage, actions } = props;
  const total = pages.length;
  const pageNumber = clampPage(props.currentPage, total);
  const pageIndex = pageNumber - 1;
  const page = pages[pageIndex];
  const prevPage = Math.max(1, pageNumber - 1);
  const nextPage = Math.min(total, pageNumber + 1);
  const progressPct = Math.round((pageNumber / total) * 100);
  const hasResources = videos.length > 0 || articles.length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-6" key={pageNumber}>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{meta.module}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{meta.title}</h1>
            <p className="mt-2 text-sm text-slate-600">{page.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Page {pageNumber}/{total}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{progressPct}%</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{meta.readingTime}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-sky-600 transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          {pageNumber === 1 ? (
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
              ← Page précédente
            </span>
          ) : (
            <a
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              href={hrefForPage(prevPage)}
            >
              ← Page précédente
            </a>
          )}

          {pageNumber === total ? (
            <span className="inline-flex min-w-36 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-400">
              Page suivante →
            </span>
          ) : (
            <a
              className="inline-flex min-w-36 items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
              href={hrefForPage(nextPage)}
            >
              Page suivante →
            </a>
          )}

          {actions && actions.length > 0 ? (
            <div className="ml-auto flex flex-wrap gap-3 text-xs">
              {actions.map((a) => (
                <Link key={a.href} className="text-sky-700 hover:underline" href={a.href}>
                  {a.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:text-xl prose-h3:text-base prose-h3:font-semibold prose-p:text-[15px] prose-p:leading-7">
            {page.sections.map((section, sectionIndex) => {
              const id = `section-${pageNumber}-${slugify(section.heading)}`;
              return (
                <section key={`${pageIndex}-${sectionIndex}`} className="space-y-3">
                  <h3 id={id}>{section.heading}</h3>
                  {section.body.map((paragraph, paragraphIndex) => (
                    <p key={`${pageIndex}-${sectionIndex}-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </section>
              );
            })}
          </div>

        </section>
      {hasResources ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Ressources du theme</h2>
          {videos.length > 0 ? (
            <div className="mt-4">
              <VideoBlock videos={videos} />
            </div>
          ) : null}
          {articles.length > 0 ? (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-900">Lectures complementaires</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {articles.map((article) => (
                  <li key={article.url}>
                    <a className="text-sky-700 hover:underline" href={article.url} target="_blank" rel="noreferrer">
                      {article.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

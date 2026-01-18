import Link from "next/link";
import VideoBlock from "./VideoBlock";
import type { ThemeArticle, ThemeVideo } from "../content";

export type { ThemeArticle, ThemeVideo };

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
        <div className="mx-auto max-w-[820px]">
          <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:mb-3 prose-h2:mt-12 prose-h2:text-2xl prose-h2:font-semibold prose-h3:mb-2 prose-h3:mt-8 prose-h3:text-xl prose-h3:font-semibold prose-h4:mt-6 prose-h4:text-base prose-h4:font-semibold prose-p:my-5 prose-p:text-[17px] prose-p:leading-[1.85] prose-hr:my-10 prose-ul:my-6 prose-ol:my-6 prose-li:my-1 prose-table:my-6 prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-table:rounded-xl prose-table:border prose-table:border-slate-200 prose-thead:bg-slate-50 prose-th:border-b prose-th:border-slate-200 prose-th:px-3 prose-th:py-2 prose-td:border-b prose-td:border-slate-100 prose-td:px-3 prose-td:py-2 prose-tr:even:bg-slate-50/40 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-medium prose-pre:my-6 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-50 prose-pre:p-4">
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
        </div>
      </section>
      {hasResources ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">Ressources</h2>
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

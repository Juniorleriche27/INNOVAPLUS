import type { ReactNode } from "react";
import Link from "next/link";
import VideoBlock from "./VideoBlock";
import type { ThemeMeta, ThemeVideo } from "./PagedThemeLayout";

type TocItem = { id?: string; href?: string; label: string };
type SidebarSection = { title: string; content: ReactNode };

type Props = {
  meta: ThemeMeta;
  description?: string;
  actions?: { label: string; href: string }[];
  videos?: ThemeVideo[];
  articles?: Array<{ title?: string; label?: string; url: string }>;
  toc?: TocItem[];
  sidebarSections?: SidebarSection[];
  children: ReactNode;
};

export default function SingleThemeLayout({
  meta,
  description,
  actions,
  videos = [],
  articles = [],
  toc = [],
  sidebarSections = [],
  children,
}: Props) {
  const chips = [meta.readingTime].filter(Boolean) as string[];

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{meta.module}</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{meta.title}</h1>
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
          </div>
          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {actions && actions.length > 0 ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            {actions.map((a) => (
              <Link key={a.href} className="text-sky-700 hover:underline" href={a.href}>
                {a.label}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {toc.length > 0 ? (
          <nav className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sommaire</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {toc
                .map((item) => {
                  const href = item.href || (item.id ? `#${item.id}` : undefined);
                  if (!href) return null;
                  return (
                    <a
                      key={href}
                      href={href}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                    >
                      {item.label}
                    </a>
                  );
                })
                .filter(Boolean)}
            </div>
          </nav>
        ) : null}
        <div className="mx-auto max-w-[820px]">
          <div
            className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:mb-3 prose-h2:mt-10 prose-h2:text-2xl prose-h2:font-semibold prose-h3:mb-2 prose-h3:mt-7 prose-h3:text-xl prose-h3:font-semibold prose-h4:text-base prose-h4:font-semibold prose-p:text-[17px] prose-p:leading-[1.8] prose-ul:my-5 prose-ol:my-5 prose-li:my-1 prose-table:block prose-table:w-full prose-table:overflow-x-auto prose-table:rounded-xl prose-table:border prose-table:border-slate-200 prose-thead:bg-slate-50 prose-th:border-b prose-th:border-slate-200 prose-th:px-3 prose-th:py-2 prose-td:border-b prose-td:border-slate-100 prose-td:px-3 prose-td:py-2 prose-tr:even:bg-slate-50/40 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-medium prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:border prose-pre:border-slate-200 prose-pre:bg-slate-50 prose-pre:p-4"
          >
            {children}
          </div>
        </div>
      </section>

      {sidebarSections.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-5 text-sm text-slate-600">
            {sidebarSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
                <div>{section.content}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {(videos.length > 0 || articles.length > 0) && (
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
                      {article.title || article.label || article.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}

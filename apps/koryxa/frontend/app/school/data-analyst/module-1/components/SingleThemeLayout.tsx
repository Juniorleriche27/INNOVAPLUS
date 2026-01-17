import type { ReactNode } from "react";
import Link from "next/link";
import VideoBlock from "./VideoBlock";
import type { ThemeArticle, ThemeMeta, ThemeVideo } from "./PagedThemeLayout";

type TocItem = { id: string; label: string };
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

  const showToc = toc.length > 0;

  return (
    <div className="flex min-h-0 flex-col gap-6 overflow-hidden">
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

      <div className="grid h-[calc(100dvh-320px)] min-h-[420px] gap-6 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <article className="order-1 overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:text-xl prose-h3:text-base prose-h3:font-semibold prose-p:text-[15px] prose-p:leading-7">
            {children}
          </div>
        </article>

        <aside className="order-2 space-y-6 overflow-y-auto overscroll-contain">
          {showToc ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Sommaire du thème</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a className="hover:text-slate-900 hover:underline" href={`#${item.id}`}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(videos.length > 0 || articles.length > 0) && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Ressources</h2>
              {videos.length > 0 ? (
                <div className="mt-4">
                  <VideoBlock videos={videos} />
                </div>
              ) : null}
              {articles.length > 0 ? (
                <ul className="mt-5 space-y-2 text-sm text-slate-600">
                  {articles.map((article) => (
                    <li key={article.url}>
                      <a className="text-sky-700 hover:underline" href={article.url} target="_blank" rel="noreferrer">
                        {article.title || article.label || article.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          )}

          {sidebarSections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">{section.title}</h2>
              <div className="mt-3 text-sm text-slate-600">{section.content}</div>
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}

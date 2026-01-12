import Link from "next/link";
import VideoBlock from "../../../components/VideoBlock";
import { theme1Articles, theme1Meta, theme1Pages, theme1Videos } from "../../content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ page: string }>;
};

function clampPage(raw: unknown, total: number): number {
  const n = typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(Math.floor(n), total);
}

export default async function Theme1Paged({ params }: Props) {
  const { page: pageParam } = await params;
  const total = theme1Pages.length;
  const pageNumber = clampPage(pageParam, total);
  const pageIndex = pageNumber - 1;
  const page = theme1Pages[pageIndex];

  const prevPage = Math.max(1, pageNumber - 1);
  const nextPage = Math.min(total, pageNumber + 1);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{theme1Meta.module}</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{theme1Meta.title}</h1>
        <p className="mt-2 text-sm text-slate-600">Temps estime : {theme1Meta.readingTime}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-full border border-slate-200 px-3 py-1">
            Page {pageNumber} / {total}
          </span>
          <Link className="text-sky-700" href="/school/data-analyst/module-1/theme-1/notebook">
            Notebook obligatoire
          </Link>
          <Link className="text-sky-700" href="/school/data-analyst/module-1/theme-1/submit">
            Soumettre
          </Link>
          <Link className="text-sky-700" href="/school/data-analyst/module-1/theme-1/quiz">
            Quiz
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{page.title}</h2>
        <div className="mt-4 space-y-6 text-sm text-slate-700">
          {page.sections.map((section, sectionIndex) => (
            <div key={`${pageIndex}-${sectionIndex}`} className="space-y-2">
              <h3 className="text-base font-semibold text-slate-900">{section.heading}</h3>
              {section.body.map((paragraph, paragraphIndex) => (
                <p key={`${pageIndex}-${sectionIndex}-${paragraphIndex}`}>{paragraph}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Navigation</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href={`/school/data-analyst/module-1/theme-1/page/${prevPage}`}
          >
            ← Page precedente
          </Link>
          <Link
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            href={`/school/data-analyst/module-1/theme-1/page/${nextPage}`}
          >
            Page suivante →
          </Link>
        </div>
        <div className="mt-6 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          {theme1Pages.map((entry, idx) => (
            <Link
              key={`${idx}-${entry.title}`}
              className="rounded-2xl border border-slate-200 px-3 py-2 hover:border-slate-300"
              href={`/school/data-analyst/module-1/theme-1/page/${idx + 1}`}
            >
              {idx + 1}. {entry.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ressources du theme</h2>
        <div className="mt-4">
          <VideoBlock videos={theme1Videos} />
        </div>
        <ul className="mt-6 space-y-2 text-sm text-slate-600">
          {theme1Articles.map((article) => (
            <li key={article.url}>
              <a className="text-sky-700 hover:underline" href={article.url} target="_blank" rel="noreferrer">
                {article.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

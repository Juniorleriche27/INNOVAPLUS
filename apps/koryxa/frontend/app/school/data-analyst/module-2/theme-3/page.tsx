import Link from "next/link";
import ThemeContent from "@/content/data-analyst/module-2/theme-3.mdx";
import resources from "@/content/data-analyst/module-2/theme-3.resources.json";
import VideoBlock from "../../module-1/components/VideoBlock";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResourceSchema = {
  videos?: Array<{ lang: "fr" | "en"; youtubeId: string; title: string }>;
  articles?: Array<{ title: string; url: string }>;
};

const typedResources = resources as ResourceSchema;

export default function Module2Theme3Page() {
  const videos = typedResources.videos || [];
  const articles = typedResources.articles || [];

  return (
    <div className="flex min-h-0 flex-col gap-6 overflow-hidden">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Module 2 — Collecte des données
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Thème 3 — SQL extraction</h1>
            <p className="mt-2 text-sm text-slate-600">SELECT · JOIN · GROUP BY · HAVING · exports</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Lecture</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Notebook</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Quiz</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
          <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-2/theme-3/notebook">
            Notebook
          </Link>
          <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-2/theme-3/submit">
            Soumettre
          </Link>
          <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-2/theme-3/quiz">
            Quiz
          </Link>
        </div>
      </section>

      <div className="grid h-[calc(100dvh-340px)] min-h-[420px] gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <article className="order-1 overflow-y-auto overscroll-contain rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-h2:text-xl prose-h3:text-base prose-h3:font-semibold prose-p:text-[15px] prose-p:leading-7">
            <ThemeContent />
          </div>
        </article>

        <aside className="order-2 space-y-6 overflow-y-auto overscroll-contain">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Ressources</h2>
            <div className="mt-4">
              <VideoBlock videos={videos} />
            </div>
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {articles.map((article) => (
                <li key={article.url}>
                  <a className="text-sky-700 hover:underline" href={article.url} target="_blank" rel="noreferrer">
                    {article.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            <p className="font-semibold text-slate-900">Livrables attendus</p>
            <ul className="mt-2 list-disc pl-5">
              <li>m2t3_queries.sql</li>
              <li>m2t3_q1_funnel_by_theme.csv</li>
              <li>m2t3_q2_completion_by_country.csv</li>
              <li>m2t3_q3_notebook48h_vs_validation.csv</li>
              <li>m2t3_run_report.json</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

"use client";
import { themes } from "../content";
import VideoBlock from "../components/VideoBlock";

type Props = { params: { theme: string } };

export default function ThemePage({ params }: Props) {
  const theme = themes.find((t) => t.slug === params.theme);
  if (!theme) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Theme introuvable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{theme.title}</h1>
        <div className="mt-3 space-y-4 text-sm text-slate-700">
          {theme.text.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Objectifs</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
          {theme.objectives.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Exemples</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
          {theme.examples.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
          {theme.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Videos</h2>
        <div className="mt-4">
          <VideoBlock videos={theme.videos} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Articles</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {theme.articles.map((article) => (
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

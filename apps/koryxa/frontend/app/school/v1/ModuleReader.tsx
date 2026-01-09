"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ModuleContent, ModuleSection, SectionVideo } from "@/app/school/v1/content";
import { MIN_PASS_PERCENT } from "@/app/school/v1/content";

type Props = {
  module: ModuleContent;
  programTitle: string;
  moduleIndex: number;
  moduleCount: number;
  prevHref?: string;
  nextHref?: string;
  isLast?: boolean;
};

export default function ModuleReader({
  module,
  programTitle,
  moduleIndex,
  moduleCount,
  prevHref,
  nextHref,
  isLast,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [validated, setValidated] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const totalQuestions = module.quiz.length;
  const canValidate = Object.keys(answers).length === totalQuestions;

  const percent = useMemo(() => {
    if (score === null) return 0;
    return Math.round((score / totalQuestions) * 100);
  }, [score, totalQuestions]);

  function handleValidate() {
    const correct = module.quiz.reduce((acc, q, idx) => {
      return acc + (answers[idx] === q.answerIndex ? 1 : 0);
    }, 0);
    setScore(correct);
    setValidated(correct / totalQuestions >= MIN_PASS_PERCENT / 100);
  }

  function getYoutubeId(url: string): string | null {
    const match = url.match(/v=([a-zA-Z0-9_-]+)/);
    if (match?.[1]) return match[1];
    const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (short?.[1]) return short[1];
    return null;
  }

  function renderVideo(video?: SectionVideo) {
    if (!video) return null;
    const id = getYoutubeId(video.url);
    if (!id) return null;
    return (
      <div className="mt-4 space-y-3">
        <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${id}`}
            title={video.label}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <a className="inline-flex text-sm font-semibold text-sky-700" href={video.url} target="_blank" rel="noreferrer">
          Voir sur YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{programTitle}</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{module.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Module {moduleIndex + 1} sur {moduleCount}
        </p>
        {module.sections && module.sections.length > 0 ? (
          <div className="mt-4 space-y-6 text-sm text-slate-700">
            {module.sections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                <div className="space-y-3">
                  {section.text.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {renderVideo(section.video)}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {module.text.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
        <button
          type="button"
          className="mt-5 inline-flex text-sm font-semibold text-sky-700"
          onClick={() => setShowHelp((v) => !v)}
        >
          Besoin d'aide ?
        </button>
        {showHelp && (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            Relis le texte principal, puis consulte les ressources. Si un passage reste flou, note ta question et reviens
            dessus apres le mini-test.
          </div>
        )}
      </section>

      {module.resources.videos.length > 0 || module.resources.articles.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ressources externes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">Videos</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {module.resources.videos.map((video) => (
                  <li key={video.url}>
                    <a className="text-sky-700 hover:underline" href={video.url} target="_blank" rel="noreferrer">
                      {video.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">Articles</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
                {module.resources.articles.map((article) => (
                  <li key={article.url}>
                    <a className="text-sky-700 hover:underline" href={article.url} target="_blank" rel="noreferrer">
                      {article.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {module.notebook && (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notebook</h2>
          <p className="mt-2 text-sm text-slate-600">{module.notebook.description}</p>
          <pre className="mt-4 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-100 overflow-x-auto">
            {module.notebook.code}
          </pre>
          {module.notebook.download && (
            <a className="mt-4 inline-flex text-sm font-semibold text-sky-700" href={module.notebook.download}>
              Telecharger le notebook
            </a>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Mini-test de validation</h2>
        <p className="mt-2 text-sm text-slate-600">
          Minimum requis : {MIN_PASS_PERCENT}%. Sans reussite, pas de module suivant.
        </p>
        <div className="mt-4 space-y-4">
          {module.quiz.map((question, idx) => (
            <div key={question.prompt} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{idx + 1}. {question.prompt}</p>
              <div className="mt-3 space-y-2">
                {question.options.map((opt, optIdx) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={answers[idx] === optIdx}
                      onChange={() => setAnswers((prev) => ({ ...prev, [idx]: optIdx }))}
                    />
                    {opt}
                  </label>
                ))}
              </div>
              {score !== null && (
                <p className="mt-2 text-xs text-slate-500">{question.explanation}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={handleValidate}
            disabled={!canValidate}
          >
            Valider le module
          </button>
          {score !== null && (
            <span className={`text-sm font-semibold ${validated ? "text-emerald-600" : "text-rose-600"}`}>
              Score {percent}% {validated ? "— Module valide" : "— Reessaie"}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          {prevHref ? (
            <Link href={prevHref} className="text-slate-700 hover:text-sky-700">
              ← Module precedent
            </Link>
          ) : (
            <span className="text-slate-400">← Module precedent</span>
          )}

          {nextHref ? (
            validated ? (
              <Link href={nextHref} className="text-slate-700 hover:text-sky-700">
                Module suivant →
              </Link>
            ) : (
              <span className="text-slate-400">Module suivant →</span>
            )
          ) : (
            <span className="text-slate-700">
              {isLast && validated ? "Parcours complete ✅" : "Module suivant →"}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

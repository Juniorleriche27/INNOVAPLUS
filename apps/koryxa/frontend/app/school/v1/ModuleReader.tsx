"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [readingConfirmed, setReadingConfirmed] = useState(false);
  const [notebookConfirmed, setNotebookConfirmed] = useState(false);
  const [videoAvailability, setVideoAvailability] = useState<Record<string, boolean | undefined>>({});
  const storageKey = `koryxa.module.${module.id}.quiz`;

  const totalQuestions = module.quiz.length;
  const requiresReading = Boolean(module.requireReadingConfirmation);
  const requiresNotebook = Boolean(module.requireNotebookConfirmation);
  const confirmationsOk = (!requiresReading || readingConfirmed) && (!requiresNotebook || notebookConfirmed);
  const canValidate = Object.keys(answers).length === totalQuestions && confirmationsOk;
  const answeredCount = Object.keys(answers).length;
  const incorrectQuestions = module.quiz
    .map((question, idx) => ({
      idx,
      question,
      isCorrect: answers[idx] === question.answerIndex,
    }))
    .filter((item) => score !== null && !item.isCorrect);

  const percent = useMemo(() => {
    if (score === null) return 0;
    return Math.round((score / totalQuestions) * 100);
  }, [score, totalQuestions]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        answers?: Record<number, number>;
        validated?: boolean;
        score?: number | null;
        readingConfirmed?: boolean;
        notebookConfirmed?: boolean;
      };
      if (saved.answers) setAnswers(saved.answers);
      if (typeof saved.validated === "boolean") setValidated(saved.validated);
      if (typeof saved.score === "number") setScore(saved.score);
      if (typeof saved.readingConfirmed === "boolean") setReadingConfirmed(saved.readingConfirmed);
      if (typeof saved.notebookConfirmed === "boolean") setNotebookConfirmed(saved.notebookConfirmed);
    } catch {
      // Ignore corrupted local storage.
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers,
          validated,
          score,
          readingConfirmed,
          notebookConfirmed,
        })
      );
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  }, [answers, validated, score, readingConfirmed, notebookConfirmed, storageKey]);

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

  const allVideoUrls = useMemo(() => {
    const urls: string[] = [];
    module.sections?.forEach((section) => {
      if (section.video?.url) urls.push(section.video.url);
      section.videos?.forEach((vid) => urls.push(vid.url));
    });
    module.resources.videos.forEach((video) => urls.push(video.url));
    return Array.from(new Set(urls));
  }, [module.sections, module.resources.videos]);

  useEffect(() => {
    let active = true;
    async function checkVideo(url: string) {
      try {
        const resp = await fetch(`/api/video/check?url=${encodeURIComponent(url)}`);
        const data = await resp.json().catch(() => ({}));
        if (!active) return;
        setVideoAvailability((prev) => ({ ...prev, [url]: Boolean(data?.ok) }));
      } catch {
        if (!active) return;
        setVideoAvailability((prev) => ({ ...prev, [url]: false }));
      }
    }
    allVideoUrls.forEach((url) => {
      if (videoAvailability[url] === undefined) {
        checkVideo(url);
      }
    });
    return () => {
      active = false;
    };
  }, [allVideoUrls, videoAvailability]);

  function renderVideo(video?: SectionVideo) {
    if (!video) return null;
    const availability = videoAvailability[video.url];
    const id = getYoutubeId(video.url);
    if (!id) return null;
    const label = video.title || video.label || video.url;
    return (
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {video.tag ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {video.tag}
            </span>
          ) : null}
          {video.lang ? (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-500">
              {video.lang}
            </span>
          ) : null}
        </div>
        {availability === undefined ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            Verification de la video en cours...
          </div>
        ) : availability ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${id}`}
              title={label}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            Video indisponible — utilisez le lien externe ou choisissez une autre ressource.
          </div>
        )}
        <a className="inline-flex text-sm font-semibold text-sky-700" href={video.url} target="_blank" rel="noreferrer">
          Ouvrir sur YouTube
        </a>
      </div>
    );
  }

  function renderResourceVideo(video: { label: string; url: string }) {
    const availability = videoAvailability[video.url];
    const id = getYoutubeId(video.url);
    if (!id) return null;
    return (
      <div key={video.url} className="space-y-3">
        {availability === undefined ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
            Verification de la video en cours...
          </div>
        ) : availability ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${id}`}
              title={video.label}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            Video indisponible — utilisez le lien externe ou choisissez une autre ressource.
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">{video.label}</p>
          <a className="inline-flex text-sm font-semibold text-sky-700" href={video.url} target="_blank" rel="noreferrer">
            Ouvrir sur YouTube
          </a>
        </div>
      </div>
    );
  }

  function hashString(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function shuffleOptions(question: ModuleContent["quiz"][number]) {
    const indexed = question.options.map((label, idx) => ({ label, originalIndex: idx }));
    let seed = hashString(question.prompt);
    for (let i = indexed.length - 1; i > 0; i -= 1) {
      seed = (seed * 9301 + 49297) % 233280;
      const j = seed % (i + 1);
      [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
    }
    return indexed;
  }

  const shuffledOptions = useMemo(
    () => module.quiz.map((question) => shuffleOptions(question)),
    [module.quiz]
  );

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
                {(section.videos ?? (section.video ? [section.video] : [])).map((video) => (
                  <div key={video.url}>{renderVideo(video)}</div>
                ))}
                {section.articles && section.articles.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <p className="text-sm font-semibold text-slate-900">Pour aller plus loin</p>
                    <ul className="mt-2 space-y-3 text-sm text-slate-600">
                      {section.articles.map((article) => (
                        <li key={article.url}>
                          <div className="font-semibold text-slate-800">{article.label}</div>
                          {article.description ? (
                            <p className="mt-1 text-xs text-slate-500">{article.description}</p>
                          ) : null}
                          <a
                            className="mt-2 inline-flex rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            href={article.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Lire l'article
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
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
        {requiresReading ? (
          <label className="mt-5 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={readingConfirmed}
              onChange={(event) => setReadingConfirmed(event.target.checked)}
            />
            J'ai lu le texte du module
          </label>
        ) : null}
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
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-900">Videos</p>
              <div className="space-y-5">
                {module.resources.videos.map((video) => renderResourceVideo(video)).filter(Boolean)}
              </div>
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
          {requiresNotebook ? (
            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={notebookConfirmed}
                onChange={(event) => setNotebookConfirmed(event.target.checked)}
              />
              J'ai consulte le notebook
            </label>
          ) : null}
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Mini-test de validation</h2>
        <p className="mt-2 text-sm text-slate-600">
          Minimum requis : {MIN_PASS_PERCENT}%. Sans reussite, pas de module suivant.
        </p>
        {(requiresReading || requiresNotebook) && (
          <p className="mt-2 text-xs text-slate-500">
            Validation complete si texte lu, notebook consulte et mini-test reussi.
          </p>
        )}
        {(requiresReading || requiresNotebook) && (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {requiresReading && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={readingConfirmed}
                  onChange={(event) => setReadingConfirmed(event.target.checked)}
                />
                J'ai lu le texte du module
              </label>
            )}
            {requiresNotebook && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notebookConfirmed}
                  onChange={(event) => setNotebookConfirmed(event.target.checked)}
                />
                J'ai consulte le notebook
              </label>
            )}
          </div>
        )}
        <div className="mt-4 space-y-4">
          {module.quiz.map((question, idx) => (
            <div key={question.prompt} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{idx + 1}. {question.prompt}</p>
              <div className="mt-3 space-y-2">
                {shuffledOptions[idx].map((opt) => (
                  <label key={`${question.prompt}-${opt.originalIndex}`} className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={answers[idx] === opt.originalIndex}
                      onChange={() => setAnswers((prev) => ({ ...prev, [idx]: opt.originalIndex }))}
                    />
                    {opt.label}
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
          {!canValidate && (
            <span className="text-xs text-slate-500">
              {answeredCount < totalQuestions
                ? `Reponds a toutes les questions (${answeredCount}/${totalQuestions}).`
                : "Coche le texte lu et le notebook consulte pour valider."}
            </span>
          )}
          {score !== null && (
            <span className={`text-sm font-semibold ${validated ? "text-emerald-600" : "text-rose-600"}`}>
              Score {percent}% {validated ? "— Module valide" : "— Reessaie"}
            </span>
          )}
        </div>
        {score !== null && incorrectQuestions.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
            <p className="font-semibold">Questions ratees</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              {incorrectQuestions.map(({ idx, question }) => (
                <li key={question.prompt}>
                  <span className="font-semibold">{idx + 1}.</span> {question.prompt}
                  <div className="text-xs text-amber-800">
                    Bonne reponse : {question.options[question.answerIndex]}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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

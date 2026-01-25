"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type QuizQuestion = {
  id: string;
  type: "single_choice";
  prompt: string;
  choices: string[];
  answer_index: number;
  explanation?: string;
};

export type QuizConfig = {
  module: string;
  version: string;
  pass_threshold: number;
  grading: { points_per_question: number; negative_marking: boolean };
  delivery: { shuffle_questions: boolean; shuffle_choices: boolean; time_limit_minutes: number };
  questions: QuizQuestion[];
};

type ShuffledQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

type AttemptState = {
  startedAtMs: number;
  questions: ShuffledQuestion[];
  answers: Array<number | null>;
  submitted: boolean;
  score: number;
};

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildAttempt(quiz: QuizConfig): AttemptState {
  const questions = quiz.delivery.shuffle_questions ? shuffleArray(quiz.questions) : [...quiz.questions];
  const shuffledQuestions: ShuffledQuestion[] = questions.map((q) => {
    const originalChoices = q.choices.map((c, idx) => ({ c, idx }));
    const shuffled = quiz.delivery.shuffle_choices ? shuffleArray(originalChoices) : originalChoices;
    const correctIndex = shuffled.findIndex((x) => x.idx === q.answer_index);
    return {
      id: q.id,
      prompt: q.prompt,
      choices: shuffled.map((x) => x.c),
      correctIndex,
      explanation: q.explanation,
    };
  });

  return {
    startedAtMs: Date.now(),
    questions: shuffledQuestions,
    answers: shuffledQuestions.map(() => null),
    submitted: false,
    score: 0,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(seconds: number) {
  const s = Math.max(0, seconds);
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function QuizRunner({
  quiz,
  attemptLimit = 3,
  storageKey,
}: {
  quiz: QuizConfig;
  attemptLimit?: number;
  storageKey: string;
}) {
  const totalQuestions = quiz.questions.length;
  const passScore = Math.ceil(totalQuestions * quiz.pass_threshold);
  const totalSeconds = Math.max(1, Math.round((quiz.delivery.time_limit_minutes ?? 0) * 60));

  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);

  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { attemptsUsed?: number; bestScore?: number; passed?: boolean };
      setAttemptsUsed(parsed.attemptsUsed ?? 0);
      setBestScore(typeof parsed.bestScore === "number" ? parsed.bestScore : null);
      setPassed(Boolean(parsed.passed));
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ attemptsUsed, bestScore, passed }));
    } catch {
      // ignore
    }
  }, [attemptsUsed, bestScore, passed, storageKey]);

  useEffect(() => {
    if (!attempt || attempt.submitted) return;

    const tick = () => {
      const elapsedSec = Math.floor((Date.now() - attempt.startedAtMs) / 1000);
      const left = totalSeconds - elapsedSec;
      setSecondsLeft(left);
      if (left <= 0) {
        submitAttempt();
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 1000);
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, totalSeconds]);

  const canStart = useMemo(() => !passed && attemptsUsed < attemptLimit, [attemptLimit, attemptsUsed, passed]);

  const startAttempt = () => {
    if (!canStart) return;
    setAttempt(buildAttempt(quiz));
    setActiveIndex(0);
    setSecondsLeft(totalSeconds);
  };

  const updateAnswer = (choiceIndex: number) => {
    setAttempt((prev) => {
      if (!prev || prev.submitted) return prev;
      const next = { ...prev, answers: [...prev.answers] };
      next.answers[activeIndex] = choiceIndex;
      return next;
    });
  };

  const submitAttempt = () => {
    setAttempt((prev) => {
      if (!prev || prev.submitted) return prev;
      const score = prev.questions.reduce((acc, q, i) => {
        const a = prev.answers[i];
        if (a === null) return acc;
        return acc + (a === q.correctIndex ? quiz.grading.points_per_question : 0);
      }, 0);

      const next = { ...prev, submitted: true, score };
      const isPassed = score >= passScore;

      setAttemptsUsed((n) => n + 1);
      setBestScore((b) => (b === null ? score : Math.max(b, score)));
      if (isPassed) setPassed(true);

      return next;
    });
  };

  const restart = () => {
    if (!canStart) return;
    setAttempt(null);
    setActiveIndex(0);
    setSecondsLeft(totalSeconds);
  };

  const current = attempt?.questions[activeIndex];
  const currentAnswer = attempt?.answers[activeIndex] ?? null;
  const answeredCount = attempt ? attempt.answers.filter((a) => a !== null).length : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{quiz.module}</p>
            <p className="mt-1 text-sm text-slate-600">
              Seuil : <span className="font-semibold text-slate-900">{passScore}</span>/{totalQuestions} · Temps :{" "}
              <span className="font-semibold text-slate-900">{quiz.delivery.time_limit_minutes}</span> min · Tentatives :{" "}
              <span className="font-semibold text-slate-900">
                {attemptsUsed}/{attemptLimit}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {bestScore !== null ? (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Meilleur score : {bestScore}/{totalQuestions}
              </span>
            ) : null}
            {passed ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Validé
              </span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Non validé
              </span>
            )}
          </div>
        </div>
      </div>

      {!attempt ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-700">
            Le quiz mélange les questions et les choix. Réponds sérieusement : 1 question par page, chrono actif.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startAttempt}
              disabled={!canStart}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Commencer le quiz
            </button>
            {!canStart ? (
              <span className="text-sm text-slate-500">Aucune tentative restante.</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">
              Question {activeIndex + 1}/{attempt.questions.length}
              <span className="ml-2 text-sm font-normal text-slate-600">({answeredCount} réponses)</span>
            </div>
            <div
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                secondsLeft <= 60 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-700"
              }`}
              aria-live="polite"
            >
              Temps restant : {formatTime(secondsLeft)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold text-slate-900">{current?.prompt}</p>
            <div className="mt-4 space-y-2">
              {current?.choices.map((choice, idx) => (
                <label
                  key={`${current.id}-${idx}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                    currentAnswer === idx ? "border-sky-200 bg-sky-50" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    className="mt-1"
                    checked={currentAnswer === idx}
                    onChange={() => updateAnswer(idx)}
                    disabled={attempt.submitted}
                  />
                  <span className="text-sm text-slate-800">{choice}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setActiveIndex((i) => clamp(i - 1, 0, attempt.questions.length - 1))}
                disabled={attempt.submitted || activeIndex === 0}
              >
                Précédent
              </button>

              <div className="flex flex-wrap items-center gap-3">
                {!attempt.submitted ? (
                  <>
                    {activeIndex < attempt.questions.length - 1 ? (
                      <button
                        type="button"
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        onClick={() => setActiveIndex((i) => clamp(i + 1, 0, attempt.questions.length - 1))}
                        disabled={currentAnswer === null}
                      >
                        Suivant
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        onClick={submitAttempt}
                        disabled={currentAnswer === null}
                      >
                        Terminer
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={restart}
                    disabled={!canStart}
                  >
                    Nouvelle tentative
                  </button>
                )}
              </div>
            </div>
          </div>

          {attempt.submitted ? (
            <ResultPanel
              attempt={attempt}
              passScore={passScore}
              totalQuestions={totalQuestions}
              canRetry={!passed && attemptsUsed < attemptLimit}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function ResultPanel({
  attempt,
  passScore,
  totalQuestions,
  canRetry,
}: {
  attempt: AttemptState;
  passScore: number;
  totalQuestions: number;
  canRetry: boolean;
}) {
  const passed = attempt.score >= passScore;
  const pct = Math.round((attempt.score / totalQuestions) * 100);
  const [showCorrections, setShowCorrections] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Résultat</p>
          <p className="mt-1 text-sm text-slate-600">
            Score : <span className="font-semibold text-slate-900">{attempt.score}</span>/{totalQuestions} ({pct}%)
            · Seuil : <span className="font-semibold text-slate-900">{passScore}</span>
          </p>
          <p className="mt-2 text-sm">
            {passed ? (
              <span className="font-semibold text-emerald-700">✅ Quiz validé</span>
            ) : (
              <span className="font-semibold text-rose-700">❌ Quiz non validé</span>
            )}
            {!passed && !canRetry ? <span className="ml-2 text-slate-600">(plus de tentative)</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCorrections((v) => !v)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          {showCorrections ? "Masquer les corrections" : "Voir les corrections"}
        </button>
      </div>

      {showCorrections ? (
        <div className="mt-6 space-y-4">
          {attempt.questions.map((q, idx) => {
            const user = attempt.answers[idx];
            const ok = user === q.correctIndex;
            return (
              <div key={q.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {idx + 1}. {q.prompt}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {ok ? "Correct" : "Faux"}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Réponse attendue :</span> {q.choices[q.correctIndex]}
                  </p>
                  <p>
                    <span className="font-semibold">Ta réponse :</span> {user === null ? "—" : q.choices[user]}
                  </p>
                  {q.explanation ? (
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{q.explanation}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}


"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Question = { id: string; prompt: string; options: string[] };
type Status = { validated?: boolean };

export default function Module2Theme4Quiz() {
  const [status, setStatus] = useState<Status>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ percent?: number; passed?: boolean; correct?: number; total?: number } | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);

  const validated = useMemo(() => Boolean(status?.validated), [status]);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-4/status`, { credentials: "include" });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) setStatus(data);
      } catch {
        setStateError("État indisponible.");
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadQuiz() {
      if (!validated) return;
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-4/quiz`, { credentials: "include" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setStateError(data?.detail || "Quiz indisponible.");
          return;
        }
        setQuestions(Array.isArray(data?.questions) ? data.questions : []);
        setStateError(null);
      } catch {
        setStateError("Quiz indisponible.");
      }
    }
    loadQuiz();
  }, [validated]);

  const canSubmit = useMemo(() => {
    if (!validated) return false;
    if (!questions.length) return false;
    return questions.every((q) => typeof answers[q.id] === "number" && answers[q.id] >= 0);
  }, [validated, questions, answers]);

  async function submit() {
    setResult(null);
    setStateError(null);
    try {
      const payload = {
        answers: questions.map((q) => ({ question_id: q.id, answer_index: answers[q.id] ?? -1 })),
      };
      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-2/theme-4/quiz/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setStateError(data?.detail || "Soumission impossible.");
        return;
      }
      setResult({ percent: data?.percent, passed: data?.passed, correct: data?.correct, total: data?.total });
    } catch {
      setStateError("Erreur réseau.");
    }
  }

  if (!validated) {
    return (
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-900">
        Quiz verrouillé. Soumets d'abord les preuves du Thème 4.
        <div className="mt-4">
          <Link className="font-semibold text-sky-700" href="/school/data-analyst/module-2/theme-4/submit">
            Aller à la soumission →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Quiz Thème 4</h1>
      <p className="mt-2 text-sm text-slate-600">Questions basées sur ton `run_report.json` + ton dataset clean.</p>

      {stateError ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{stateError}</div>
      ) : null}

      <div className="mt-6 space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl border border-slate-200 p-5">
            <p className="text-sm font-semibold text-slate-900">
              {idx + 1}. {q.prompt}
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {q.options.map((opt, optIndex) => (
                <label key={`${q.id}-${optIndex}`} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name={q.id}
                    value={optIndex}
                    checked={answers[q.id] === optIndex}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIndex }))}
                    className="mt-1"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          onClick={submit}
          disabled={!canSubmit}
        >
          Valider le quiz
        </button>
        {result ? (
          <span className="text-sm text-slate-700">
            Score {result.percent}% — {result.passed ? "Thème validé" : "À retenter"}
          </span>
        ) : null}
      </div>

      <div className="mt-6 text-sm">
        <Link className="text-sky-700 hover:underline" href="/school/data-analyst/module-2/theme-4/page/1">
          Revenir au cours
        </Link>
      </div>
    </section>
  );
}


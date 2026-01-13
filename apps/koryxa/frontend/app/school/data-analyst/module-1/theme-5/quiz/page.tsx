"use client";

import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type QuizQuestion = { id: string; prompt: string; options: string[] };

export default function Theme5QuizPage() {
  const [locked, setLocked] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setMessage(null);
      try {
        const statusResp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/theme-5/status`, {
          credentials: "include",
        });
        const statusData = await statusResp.json().catch(() => ({}));
        const ok = Boolean(statusData?.validated);
        setLocked(!ok);
        if (!ok) return;

        const quizResp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/theme-5/quiz`, {
          credentials: "include",
        });
        const quizData = await quizResp.json().catch(() => ({}));
        if (!quizResp.ok) {
          const detail = typeof quizData?.detail === "string" ? quizData.detail : "Quiz indisponible.";
          throw new Error(detail);
        }
        setQuestions(Array.isArray(quizData?.questions) ? quizData.questions : []);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
      }
    }
    load();
  }, []);

  const canSubmit = useMemo(() => {
    if (locked) return false;
    if (!questions.length) return false;
    return questions.every((q) => typeof answers[q.id] === "number");
  }, [locked, questions, answers]);

  async function submit() {
    if (!canSubmit) {
      setMessage("Réponds à toutes les questions.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        answers: questions.map((q) => ({ question_id: q.id, answer_index: answers[q.id] })),
      };
      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/theme-5/quiz/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setMessage(`Score: ${data?.percent ?? 0}% · ${data?.passed ? "Validé" : "Non validé"}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (locked) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Quiz — Thème 5</h1>
        <p className="mt-2 text-sm text-slate-600">Quiz verrouillé : soumets d’abord le ZIP et attends la validation.</p>
        {message && (
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </p>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Quiz — Thème 5</h1>
        <p className="mt-2 text-sm text-slate-600">Les réponses sont dérivées des fichiers du ZIP validé.</p>
        <div className="mt-6 space-y-5">
          {questions.map((q, idx) => (
            <div key={q.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {idx + 1}. {q.prompt}
              </p>
              <div className="mt-3 grid gap-2">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={`${q.id}-${optIdx}`}
                    className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === optIdx}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                      className="mt-1"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !canSubmit}
          className="mt-6 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "Correction..." : "Valider le quiz"}
        </button>
        {message && (
          <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}


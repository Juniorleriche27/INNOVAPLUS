"use client";

import { useEffect, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Question = { id: string; prompt: string; options: string[] };

export default function Module1QuizPage() {
  const [status, setStatus] = useState<"loading" | "locked" | "ready" | "submitting" | "done" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/status`, { credentials: "include" });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error("Etat indisponible.");
        if (!data?.notebooks_validated) {
          setStatus("locked");
          return;
        }
        const quizResp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/quiz`, { credentials: "include" });
        const quizData = await quizResp.json().catch(() => ({}));
        if (!quizResp.ok) {
          const detail = typeof quizData?.detail === "string" ? quizData.detail : "Quiz indisponible.";
          throw new Error(detail);
        }
        setQuestions(quizData?.questions || []);
        setStatus("ready");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    setStatus("submitting");
    setMessage(null);
    try {
      const payload = {
        answers: Object.entries(answers).map(([question_id, answer_index]) => ({
          question_id,
          answer_index,
        })),
      };
      const resp = await fetch(`${INNOVA_API_BASE}/school/data-analyst/module-1/quiz/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setScore(data?.percent ?? null);
      setPassed(Boolean(data?.passed));
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Quiz Module 1</h1>
        <p className="mt-2 text-sm text-slate-600">10 questions · seuil 70%</p>
      </section>

      {status === "locked" && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Quiz verrouille. Valide d'abord les notebooks dans la page Soumettre.
        </section>
      )}

      {status === "error" && message && (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {message}
        </section>
      )}

      {status === "ready" && (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {idx + 1}. {q.prompt}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <label key={`${q.id}-${optIdx}`} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === optIdx}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== questions.length}
            className="mt-6 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Valider le quiz
          </button>
        </section>
      )}

      {status === "done" && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700">
          Score: {score}% · {passed ? "Quiz valide" : "Quiz non valide"}
        </section>
      )}
    </div>
  );
}

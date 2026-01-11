"use client";

import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

type Question = {
  id: string;
  prompt: string;
  options: string[];
};

export default function Module6TestPage() {
  const [testId, setTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "submitting" | "done" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [validated, setValidated] = useState<boolean | null>(null);

  const total = questions.length;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    async function loadQuestions() {
      setStatus("loading");
      try {
        const resp = await fetch(`${INNOVA_API_BASE}/tests/module/6?mode=advanced`, {
          credentials: "include",
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          const detail = typeof data?.detail === "string" ? data.detail : "Impossible de charger le test.";
          throw new Error(detail);
        }
        setTestId(data?.test_id || null);
        setQuestions(data?.questions || []);
        setStatus("ready");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
      }
    }
    loadQuestions();
  }, []);

  async function handleSubmit() {
    if (!testId) return;
    setStatus("submitting");
    setMessage(null);
    try {
      const resp = await fetch(`${INNOVA_API_BASE}/tests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          test_id: testId,
          answers: Object.entries(answers).map(([question_id, answer_index]) => ({
            question_id,
            answer_index,
          })),
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Soumission impossible.";
        throw new Error(detail);
      }
      setScore(data?.percent ?? null);
      setPassed(Boolean(data?.passed));
      setValidated(Boolean(data?.module_validated));
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Test final — Module 6</h1>
        <p className="mt-2 text-sm text-slate-600">50 questions · seuil 70%</p>

        {status === "loading" && <p className="mt-6 text-sm text-slate-500">Chargement du test...</p>}
        {status === "error" && message && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {message}
          </div>
        )}

        {status !== "loading" && questions.length > 0 && (
          <div className="mt-6 space-y-6">
            <div className="text-sm text-slate-500">
              {answeredCount}/{total} reponses
            </div>

            {questions.map((question, idx) => (
              <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {idx + 1}. {question.prompt}
                </p>
                <div className="mt-3 space-y-2">
                  {question.options.map((opt, optIdx) => (
                    <label key={`${question.id}-${optIdx}`} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === optIdx}
                        onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optIdx }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {status === "ready" && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={answeredCount !== total}
                className="w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 disabled:opacity-60"
              >
                Valider le test
              </button>
            )}
          </div>
        )}

        {status === "done" && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Score: {score}% · {passed ? "Test reussi" : "Test non valide"}
            <div className="mt-2 text-xs">
              Module {validated ? "valide ✅" : "non valide (soumission requise ou score insuffisant)"}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

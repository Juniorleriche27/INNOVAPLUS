"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { PUBLIC_ROUTES } from "@/config/routes";
import { CLIENT_INNOVA_API_BASE } from "@/lib/env";
import { ENTERPRISE_STORAGE_KEY, type EnterpriseSubmissionResponse } from "./flow";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { value: string; label: string; hint?: string; emoji?: string };

type DynamicQuestion = {
  id: string;
  text: string;
  hint?: string;
  type: "options" | "textarea" | "text";
  options?: Option[];
  phase: "identification" | "contexte" | "validation";
  isLast?: boolean;
  optional?: boolean;
};

type ApiNextQuestion = {
  question_id: string;
  question_text: string;
  hint?: string;
  type: string;
  options?: Option[];
  phase: string;
  is_last: boolean;
};

// ─── Static initial questions ─────────────────────────────────────────────────

const STATIC_QUESTIONS: DynamicQuestion[] = [
  {
    id: "company_name",
    text: "Quel est le nom de votre entreprise ?",
    hint: "Le nom exact ancre le cadrage et évite un diagnostic trop générique.",
    type: "text",
    phase: "identification",
  },
  {
    id: "primary_goal",
    text: "Dans quel domaine voulez-vous qu'une solution IA intervienne ?",
    hint: "Votre réponse oriente toutes les questions suivantes. KORYXA règle uniquement les besoins IA des entreprises.",
    type: "options",
    phase: "identification",
    options: [
      { value: "ia_data_reporting",    label: "Data & Reporting IA",       hint: "Tableaux de bord automatisés, KPIs en temps réel, analyse prédictive.", emoji: "📊" },
      { value: "ia_automatisation",    label: "Automatisation IA",         hint: "Suppression des tâches répétitives, workflows intelligents, scripts.", emoji: "🤖" },
      { value: "ia_marketing_content", label: "Marketing & Contenu IA",    hint: "Génération de contenu, personnalisation, acquisition assistée par IA.", emoji: "📣" },
      { value: "ia_sales_crm",         label: "Sales & CRM IA",            hint: "Scoring de leads, relances automatiques, pipeline intelligent.", emoji: "🤝" },
      { value: "ia_ops_process",       label: "Ops & Process IA",          hint: "Optimisation des processus, détection d'anomalies, coordination IA.", emoji: "⚙️" },
      { value: "ia_rh_talent",         label: "RH & Talent IA",            hint: "Recrutement IA, matching RH, analyse des compétences.", emoji: "🤲" },
      { value: "ia_finance_pilotage",  label: "Finance & Pilotage IA",     hint: "Prévisions financières IA, détection de fraude, contrôle de gestion.", emoji: "💳" },
      { value: "ia_produit_tech",      label: "Produit & Tech IA",         hint: "Intégration IA dans un produit, APIs IA, LLMs, no-code IA.", emoji: "💻" },
      { value: "ia_service_client",    label: "Service Client IA",         hint: "Chatbots, réponses automatisées, analyse sentiment, tickets IA.", emoji: "💬" },
      { value: "ia_strategie",         label: "Stratégie & Décision IA",   hint: "Aide à la décision, diagnostic IA, veille et intelligence compétitive.", emoji: "🎯" },
    ],
  },
];

// ─── Phase strip config ───────────────────────────────────────────────────────

const PHASES = [
  { id: "identification", number: "01", label: "Identification" },
  { id: "contexte",       number: "02", label: "Contexte" },
  { id: "validation",     number: "03", label: "Validation" },
] as const;

type PhaseId = (typeof PHASES)[number]["id"];

// Pas de limite fixe — l'IA décide quand elle a compris le besoin à 100%
const MAX_QUESTIONS = 50;

// ─── UI atoms (same style as Blueprint) ───────────────────────────────────────

function OptionCard({ option, active, onClick }: { option: Option; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-checked={active}
      role="radio"
      className={`group relative w-full rounded-[18px] border px-4 py-3.5 text-left transition-all duration-150 sm:rounded-[20px] sm:px-5 sm:py-4 ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-[0_20px_40px_rgba(15,23,42,0.15)]"
          : "border-slate-200 bg-white text-slate-900 hover:border-slate-400 hover:shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
      }`}
    >
      <div className="flex items-start gap-3 pr-8 sm:pr-9">
        {option.emoji ? <span className="mt-0.5 text-base leading-none sm:text-lg">{option.emoji}</span> : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-6 sm:text-[13.5px]">{option.label}</p>
          {option.hint ? (
            <p className={`mt-1 text-xs leading-5 sm:text-[11.5px] ${active ? "text-slate-300" : "text-slate-500"}`}>
              {option.hint}
            </p>
          ) : null}
        </div>
      </div>
      <span
        className={`absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full border transition ${
          active ? "border-white bg-white text-slate-900" : "border-slate-200 bg-white text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function PhaseStrip({ currentPhase }: { currentPhase: PhaseId }) {
  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <div className="flex min-w-max gap-1.5 sm:gap-2">
        {PHASES.map((phase, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <div
              key={phase.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 transition-all sm:gap-2.5 sm:px-4 sm:py-2.5 ${
                isCurrent
                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.12)]"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                  isCurrent
                    ? "bg-white text-slate-900"
                    : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : phase.number}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] sm:text-[11px]">{phase.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function isAnswered(q: DynamicQuestion, answers: Record<string, string>): boolean {
  if (q.optional) return true;
  const val = answers[q.id] ?? "";
  if (q.type === "text") return val.trim().length >= 2;
  if (q.type === "textarea") return true;
  return val.trim().length > 0;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EnterpriseFlowClient() {
  const router = useRouter();
  const [questions, setQuestions] = useState<DynamicQuestion[]>(STATIC_QUESTIONS);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loadingNext, setLoadingNext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[questionIndex];
  const currentPhase = currentQuestion.phase;
  // Progression : base 12 questions (2 statiques + 10 par domaine), extensible par l'IA
  const PROGRESS_BASE = Math.max(questions.length + 1, 12);
  const progressPct = Math.min(Math.round(((questionIndex + 1) / PROGRESS_BASE) * 100), 99);
  const canContinue = isAnswered(currentQuestion, answers);
  const isCurrentLast = currentQuestion.isLast ?? false;

  function updateAnswer(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError(null);
  }

  function handleBack() {
    if (submitting || loadingNext) return;
    if (questionIndex === 0) { router.push(PUBLIC_ROUTES.entreprise); return; }
    setQuestionIndex((i) => i - 1);
  }

  function buildAnswersPayload() {
    return questions.slice(0, questionIndex + 1).map((q) => ({
      question_id: q.id,
      question_text: q.text,
      answer: answers[q.id] ?? "",
    }));
  }

  async function fetchNextQuestion() {
    setLoadingNext(true);
    setError(null);
    try {
      const res = await fetch(`${CLIENT_INNOVA_API_BASE}/enterprise/needs/next-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answers: buildAnswersPayload() }),
      });
      if (!res.ok) throw new Error("Impossible de charger la prochaine question.");
      const data: ApiNextQuestion = await res.json();

      if (data.is_last && !data.question_text) {
        await handleSubmit();
        return;
      }

      const phase: PhaseId =
        data.phase === "validation" ? "validation" : data.phase === "contexte" ? "contexte" : "identification";

      const newQ: DynamicQuestion = {
        id: data.question_id,
        text: data.question_text,
        hint: data.hint,
        type: data.type === "textarea" || data.type === "text" ? data.type : "options",
        options: data.options,
        phase,
        isLast: data.is_last,
      };

      setQuestions((prev) => [...prev, newQ]);
      setQuestionIndex((i) => i + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoadingNext(false);
    }
  }

  async function handleNext() {
    if (!canContinue && !currentQuestion.optional) return;

    // Already have next question loaded → just navigate forward
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      return;
    }

    // Marked as last question → submit
    if (isCurrentLast) {
      await handleSubmit();
      return;
    }

    // Sécurité absolue : jamais plus de 50 questions (ne devrait jamais arriver)
    if (questionIndex >= MAX_QUESTIONS - 1) {
      await handleSubmit();
      return;
    }

    // Fetch next adaptive question from AI
    await fetchNextQuestion();
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const fullAnswers = questions.map((q) => ({
        question_id: q.id,
        question_text: q.text,
        answer: answers[q.id] ?? "",
      }));

      const res = await fetch(`${CLIENT_INNOVA_API_BASE}/enterprise/needs/adaptive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adaptive_answers: fullAnswers }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { detail?: string })?.detail || "Qualification impossible pour le moment.");
      }

      const payload: EnterpriseSubmissionResponse = await res.json();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ENTERPRISE_STORAGE_KEY, payload.need.id);
      }
      router.push(`/entreprise/resultat/${encodeURIComponent(payload.need.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setSubmitting(false);
    }
  }

  const showSubmit = isCurrentLast;

  return (
    <section className="mx-auto w-full max-w-5xl rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.06)] sm:rounded-[36px] sm:p-6">
      <PhaseStrip currentPhase={currentPhase} />
      <div className="mt-4 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-slate-900 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white sm:rounded-[28px]">
        {/* Header */}
        <div className="border-b border-slate-100 px-4 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Question {questionIndex + 1}
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {progressPct}% complété
            </p>
          </div>
          <h2 className="mt-4 max-w-3xl text-[1.45rem] font-semibold leading-[1.2] tracking-[-0.04em] text-slate-950 sm:mt-5 sm:text-[1.75rem] lg:text-[2.1rem]">
            {currentQuestion.text}
          </h2>
          {currentQuestion.hint ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:leading-7">{currentQuestion.hint}</p>
          ) : null}
        </div>

        {/* Body */}
        <div className="px-4 py-5 sm:px-8 sm:py-7">
          {loadingNext ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm font-medium text-slate-400">L'IA prépare la prochaine question…</p>
            </div>
          ) : (
            <>
              {currentQuestion.type === "options" && currentQuestion.options ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {currentQuestion.options.map((opt) => (
                    <OptionCard
                      key={opt.value}
                      option={opt}
                      active={answers[currentQuestion.id] === opt.value}
                      onClick={() => updateAnswer(currentQuestion.id, opt.value)}
                    />
                  ))}
                </div>
              ) : null}

              {currentQuestion.type === "text" ? (
                <input
                  type="text"
                  value={answers[currentQuestion.id] ?? ""}
                  onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                  maxLength={120}
                  placeholder="Ex: KORYXA, Acme SARL, Studio Atlas..."
                  className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white placeholder:text-slate-400 sm:rounded-[20px] sm:px-5 sm:py-4"
                />
              ) : null}

              {currentQuestion.type === "textarea" ? (
                <div>
                  <textarea
                    value={answers[currentQuestion.id] ?? ""}
                    onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                    rows={5}
                    maxLength={400}
                    placeholder="Décrivez votre besoin en quelques lignes..."
                    className="w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white placeholder:text-slate-400 sm:rounded-[20px] sm:px-5 sm:py-4"
                  />
                  <p className="mt-1.5 text-right text-[11px] text-slate-400">
                    {(answers[currentQuestion.id] ?? "").length} / 400
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5">
          <button
            type="button"
            onClick={handleBack}
            disabled={submitting || loadingNext}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:opacity-50 sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4" />
            {questionIndex === 0 ? "Retour" : "Précédent"}
          </button>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            {error ? <p className="text-sm font-medium text-rose-600 sm:text-right">{error}</p> : null}
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={(!canContinue && !currentQuestion.optional) || submitting || loadingNext}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analyse en cours…
                </>
              ) : showSubmit ? (
                <>
                  Voir le résultat
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continuer
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

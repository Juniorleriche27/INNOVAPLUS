"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

import { FLOW_STORAGE_KEY, type TrajectoryFlowResponse } from "./flow";

type AnswerState = {
  primary_intent: string;
  domain: string;
  domain_other: string;
  current_level: string;
  priority_outcome: string;
  weekly_rhythm: string;
  main_blocker: string;
  support_style: string;
  orientation_preference: string;
  one_sentence_goal: string;
};

type Option = {
  value: string;
  label: string;
};

type Question = {
  key:
    | "primary_intent"
    | "domain"
    | "current_level"
    | "priority_outcome"
    | "weekly_rhythm"
    | "main_blocker"
    | "support_style"
    | "orientation_preference";
  title: string;
  description: string;
  options: Option[];
  optional?: boolean;
};

const QUESTIONS: Question[] = [
  {
    key: "primary_intent",
    title: "Tu es ici pour quoi aujourd’hui ?",
    description: "Choisis ce qui ressemble le plus à ton besoin du moment.",
    options: [
      { value: "Trouver une direction claire", label: "Trouver une direction claire" },
      { value: "Monter en compétence", label: "Monter en compétence" },
      { value: "Me préparer à une opportunité", label: "Me préparer à une opportunité" },
      { value: "Structurer mon projet", label: "Structurer mon projet" },
      { value: "Lancer mon activité", label: "Lancer mon activité" },
      { value: "Explorer ce qui me correspond", label: "Explorer ce qui me correspond" },
    ],
  },
  {
    key: "domain",
    title: "Dans quel domaine veux-tu avancer en priorité ?",
    description: "On s’en sert pour recommander une trajectoire utile dès le départ.",
    options: [
      { value: "Data / IA", label: "Data / IA" },
      { value: "Gestion / Finance", label: "Gestion / Finance" },
      { value: "Entrepreneuriat", label: "Entrepreneuriat" },
      { value: "Productivité / Organisation", label: "Productivité / Organisation" },
      { value: "Marketing / Communication", label: "Marketing / Communication" },
      { value: "Informatique / Développement", label: "Informatique / Développement" },
      { value: "Autre", label: "Autre" },
    ],
  },
  {
    key: "current_level",
    title: "Aujourd’hui, tu te situes à quel niveau ?",
    description: "L’idée n’est pas d’être parfait, juste de partir du bon point.",
    options: [
      { value: "Je débute complètement", label: "Je débute complètement" },
      { value: "J’ai quelques bases", label: "J’ai quelques bases" },
      { value: "Je me débrouille déjà", label: "Je me débrouille déjà" },
      { value: "J’ai déjà une expérience concrète", label: "J’ai déjà une expérience concrète" },
    ],
  },
  {
    key: "priority_outcome",
    title: "Qu’est-ce que tu veux obtenir en priorité ?",
    description: "Choisis le résultat qui te semble le plus important maintenant.",
    options: [
      { value: "Savoir par où commencer", label: "Savoir par où commencer" },
      { value: "Construire un plan clair", label: "Construire un plan clair" },
      { value: "Progresser avec méthode", label: "Progresser avec méthode" },
      { value: "Avoir un profil plus crédible", label: "Avoir un profil plus crédible" },
      { value: "Accéder à des opportunités", label: "Accéder à des opportunités" },
      { value: "Structurer mes actions", label: "Structurer mes actions" },
    ],
  },
  {
    key: "weekly_rhythm",
    title: "Chaque semaine, tu peux consacrer combien de temps à ta progression ?",
    description: "Un bon rythme réaliste vaut mieux qu’un objectif trop lourd.",
    options: [
      { value: "Moins de 2 heures", label: "Moins de 2 heures" },
      { value: "2 à 5 heures", label: "2 à 5 heures" },
      { value: "5 à 10 heures", label: "5 à 10 heures" },
      { value: "Plus de 10 heures", label: "Plus de 10 heures" },
    ],
  },
  {
    key: "main_blocker",
    title: "Qu’est-ce qui te bloque le plus aujourd’hui ?",
    description: "Le but est d’identifier le vrai point de friction, pas de te faire passer un test.",
    options: [
      { value: "Je ne sais pas quoi faire en premier", label: "Je ne sais pas quoi faire en premier" },
      { value: "Je manque de cadre", label: "Je manque de cadre" },
      { value: "Je manque de temps", label: "Je manque de temps" },
      { value: "Je commence puis j’abandonne", label: "Je commence puis j’abandonne" },
      { value: "Je n’ai pas assez de preuves de ce que je sais faire", label: "Je n’ai pas assez de preuves de ce que je sais faire" },
      { value: "Je ne sais pas comment passer à l’action", label: "Je ne sais pas comment passer à l’action" },
    ],
  },
  {
    key: "support_style",
    title: "Tu préfères avancer comment ?",
    description: "On cherche le style d’accompagnement qui te correspond le mieux.",
    options: [
      { value: "En autonomie", label: "En autonomie" },
      { value: "Avec un cadre guidé", label: "Avec un cadre guidé" },
      { value: "Avec un coach", label: "Avec un coach" },
      { value: "Avec des missions concrètes", label: "Avec des missions concrètes" },
      { value: "Avec un mélange de tout ça", label: "Avec un mélange de tout ça" },
    ],
  },
  {
    key: "orientation_preference",
    title: "Tu voudrais être orienté plutôt vers quoi au départ ?",
    description: "Cette question est optionnelle. Tu peux la passer si tu veux.",
    options: [
      { value: "Des ressources de progression", label: "Des ressources de progression" },
      { value: "Des partenaires ou coachs", label: "Des partenaires ou coachs" },
      { value: "Des missions concrètes", label: "Des missions concrètes" },
      { value: "Des opportunités", label: "Des opportunités" },
      { value: "Un mélange de plusieurs options", label: "Un mélange de plusieurs options" },
    ],
    optional: true,
  },
];

const INITIAL_ANSWERS: AnswerState = {
  primary_intent: "",
  domain: "",
  domain_other: "",
  current_level: "",
  priority_outcome: "",
  weekly_rhythm: "",
  main_blocker: "",
  support_style: "",
  orientation_preference: "",
  one_sentence_goal: "",
};

function optionGridClass(optionCount: number): string {
  if (optionCount <= 4) return "sm:grid-cols-2";
  if (optionCount <= 6) return "sm:grid-cols-2 xl:grid-cols-3";
  return "sm:grid-cols-2 xl:grid-cols-4";
}

function shouldAskOrientationPreference(answers: AnswerState): boolean {
  if (answers.primary_intent === "Me préparer à une opportunité") return true;
  if (answers.priority_outcome === "Accéder à des opportunités") return true;
  return ["Avec un coach", "Avec des missions concrètes", "Avec un mélange de tout ça"].includes(answers.support_style);
}

function buildPayload(answers: AnswerState) {
  const domain = answers.domain === "Autre" ? answers.domain_other.trim() || "Autre" : answers.domain;
  const optionalSentence = answers.one_sentence_goal.trim();
  const objectiveParts = [
    answers.primary_intent,
    answers.priority_outcome ? `avec pour priorité ${answers.priority_outcome.toLowerCase()}` : "",
    domain ? `dans le domaine ${domain}` : "",
  ].filter(Boolean);

  const contextParts = [
    answers.main_blocker ? `Blocage principal : ${answers.main_blocker}.` : "",
    answers.support_style ? `Préférence d'avancée : ${answers.support_style}.` : "",
    answers.orientation_preference ? `Orientation souhaitée au départ : ${answers.orientation_preference}.` : "",
    optionalSentence ? `Objectif formulé : ${optionalSentence}.` : "",
  ].filter(Boolean);

  return {
    objective: objectiveParts.join(" "),
    current_level: answers.current_level,
    domain_interest: domain,
    weekly_rhythm: answers.weekly_rhythm,
    target_outcome: answers.priority_outcome || undefined,
    context: contextParts.join(" "),
    constraints: answers.main_blocker ? [answers.main_blocker] : [],
    preferences: [answers.support_style, answers.orientation_preference].filter(Boolean),
  };
}

export default function TrajectoryFlowClient() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>(INITIAL_ANSWERS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlowId, setSavedFlowId] = useState<string | null>(null);

  const visibleQuestions = useMemo(
    () => QUESTIONS.filter((question) => question.key !== "orientation_preference" || shouldAskOrientationPreference(answers)),
    [answers],
  );

  useEffect(() => {
    setStepIndex((current) => Math.min(current, Math.max(visibleQuestions.length - 1, 0)));
  }, [visibleQuestions.length]);

  const currentQuestion = visibleQuestions[Math.min(stepIndex, visibleQuestions.length - 1)]!;
  const isLastQuestion = stepIndex === visibleQuestions.length - 1;
  const progress = Math.round(((stepIndex + 1) / visibleQuestions.length) * 100);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSavedFlowId(window.localStorage.getItem(FLOW_STORAGE_KEY));
    }
  }, []);

  const currentValue = answers[currentQuestion.key];
  const canContinue = useMemo(() => {
    if (currentQuestion.key === "domain" && currentValue === "Autre") {
      return answers.domain_other.trim().length >= 2;
    }
    if (currentQuestion.optional) return true;
    return currentValue.trim().length > 0;
  }, [answers.domain_other, currentQuestion, currentValue]);

  function updateAnswer(key: keyof AnswerState, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleNext() {
    if (!canContinue) return;
    setStepIndex((current) => Math.min(current + 1, visibleQuestions.length - 1));
  }

  function handleBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const onboardingRes = await fetch(`${INNOVA_API_BASE}/trajectoire/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildPayload(answers)),
      });
      if (!onboardingRes.ok) {
        const data = await onboardingRes.json().catch(() => ({}));
        throw new Error(data?.detail || "Enregistrement du diagnostic impossible.");
      }
      const onboardingData: TrajectoryFlowResponse = await onboardingRes.json();

      const diagnosticRes = await fetch(`${INNOVA_API_BASE}/trajectoire/diagnostic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ flow_id: onboardingData.flow_id }),
      });
      if (!diagnosticRes.ok) {
        const data = await diagnosticRes.json().catch(() => ({}));
        throw new Error(data?.detail || "Diagnostic impossible pour le moment.");
      }

      const diagnosticData: TrajectoryFlowResponse = await diagnosticRes.json();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(FLOW_STORAGE_KEY, diagnosticData.flow_id);
      }
      router.push(`/trajectoire/resultat/${encodeURIComponent(diagnosticData.flow_id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[28px] border border-slate-200/80 bg-white/94 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">Diagnostic KORYXA</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Réponds à quelques questions pour obtenir une trajectoire claire
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              L’objectif est simple : comprendre assez de choses pour recommander une bonne trajectoire et t’ouvrir le bon cockpit.
            </p>
          </div>
          {savedFlowId ? (
            <Link
              href={`/trajectoire/resultat/${encodeURIComponent(savedFlowId)}`}
              className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
            >
              Reprendre mon dernier résultat
            </Link>
          ) : null}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span>
              Étape {stepIndex + 1} sur {visibleQuestions.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-[linear-gradient(90deg,#0284c7,#38bdf8)] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700">
              {currentQuestion.optional ? "Question optionnelle" : "Question essentielle"}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">{currentQuestion.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{currentQuestion.description}</p>
        </div>

        <div className={`mt-6 grid gap-3 ${optionGridClass(currentQuestion.options.length)}`}>
          {currentQuestion.options.map((option) => {
            const active = currentValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateAnswer(currentQuestion.key, option.value)}
                aria-pressed={active}
                className={`group relative overflow-hidden rounded-[24px] border px-5 py-4 text-left transition-all duration-200 ${
                  active
                    ? "border-sky-300 bg-[linear-gradient(180deg,rgba(240,249,255,0.96),rgba(255,255,255,1))] shadow-[0_18px_36px_rgba(14,165,233,0.14)] ring-2 ring-sky-100"
                    : "border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,1))] shadow-[0_10px_22px_rgba(148,163,184,0.08)] hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_16px_30px_rgba(148,163,184,0.12)]"
                }`}
              >
                <span
                  className={`absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition ${
                    active
                      ? "border-sky-200 bg-sky-600 text-white"
                      : "border-slate-200 bg-white text-slate-300 group-hover:border-sky-200 group-hover:text-sky-300"
                  }`}
                >
                  {active ? "✓" : ""}
                </span>
                <span className={`block pr-8 text-[15px] font-semibold leading-6 ${active ? "text-sky-800" : "text-slate-950"}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {currentQuestion.key === "domain" && answers.domain === "Autre" ? (
          <div className="mt-4 max-w-lg">
            <label className="text-sm font-medium text-slate-700">
              Précise le domaine qui t’intéresse
              <input
                value={answers.domain_other}
                onChange={(event) => updateAnswer("domain_other", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>
        ) : null}

        {isLastQuestion ? (
          <div className="mt-5 max-w-2xl rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] px-5 py-4">
            <label className="text-sm font-medium text-slate-700">
              En une phrase, qu’aimerais-tu réussir ?
              <textarea
                value={answers.one_sentence_goal}
                onChange={(event) => updateAnswer("one_sentence_goal", event.target.value)}
                rows={3}
                maxLength={220}
                placeholder="Facultatif. Une phrase suffit."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Ce champ est facultatif. Il aide seulement à enrichir le premier diagnostic.
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0 || submitting}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 disabled:opacity-40"
          >
            Retour
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            {currentQuestion.optional && !currentValue ? (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 disabled:opacity-60"
              >
                {submitting ? "Analyse en cours..." : "Passer cette précision"}
              </button>
            ) : null}

            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting || !canContinue}
                className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60"
              >
                {submitting ? "Analyse en cours..." : "Lancer mon diagnostic"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canContinue}
                className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60"
              >
                Suivant
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

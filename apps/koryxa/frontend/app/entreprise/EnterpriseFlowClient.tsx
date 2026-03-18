"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

import { ENTERPRISE_STORAGE_KEY, type EnterpriseSubmissionResponse } from "./flow";

type Answers = {
  primary_goal: string;
  need_type: string;
  expected_result: string;
  urgency: string;
  treatment_preference: string;
  team_context: string;
  support_preference: string;
  short_brief: string;
};

type Option = {
  value: string;
  label: string;
};

type Question = {
  key:
    | "primary_goal"
    | "need_type"
    | "expected_result"
    | "urgency"
    | "treatment_preference"
    | "team_context"
    | "support_preference";
  title: string;
  description: string;
  options: Option[];
};

const QUESTIONS: Question[] = [
  {
    key: "primary_goal",
    title: "Qu’est-ce que vous cherchez à améliorer en priorité ?",
    description: "Choisissez l'objectif business ou opérationnel qui compte le plus maintenant.",
    options: [
      { value: "Notre visibilité", label: "Notre visibilité" },
      { value: "Notre chiffre d’affaires", label: "Notre chiffre d’affaires" },
      { value: "Notre organisation interne", label: "Notre organisation interne" },
      { value: "Le suivi de notre activité", label: "Le suivi de notre activité" },
      { value: "L’automatisation de certaines tâches", label: "L’automatisation de certaines tâches" },
      { value: "La structuration de nos données", label: "La structuration de nos données" },
      { value: "Le pilotage de nos équipes", label: "Le pilotage de nos équipes" },
      { value: "Un projet précis à lancer ou cadrer", label: "Un projet précis à lancer ou cadrer" },
    ],
  },
  {
    key: "need_type",
    title: "Quel type de besoin avez-vous aujourd’hui ?",
    description: "Le but est de qualifier le besoin, pas encore de remplir un dossier administratif.",
    options: [
      { value: "Analyse / aide à la décision", label: "Analyse / aide à la décision" },
      { value: "Dashboard / reporting", label: "Dashboard / reporting" },
      { value: "Automatisation", label: "Automatisation" },
      { value: "Organisation / structuration", label: "Organisation / structuration" },
      { value: "Données / base de données", label: "Données / base de données" },
      { value: "Exécution d’un projet", label: "Exécution d’un projet" },
      { value: "Besoin de mission / appui externe", label: "Besoin de mission / appui externe" },
      { value: "Autre", label: "Autre" },
    ],
  },
  {
    key: "expected_result",
    title: "Quel résultat attendez-vous concrètement ?",
    description: "Choisissez le résultat qui vous ferait dire que ce besoin avance vraiment.",
    options: [
      { value: "Mieux comprendre notre activité", label: "Mieux comprendre notre activité" },
      { value: "Gagner du temps", label: "Gagner du temps" },
      { value: "Suivre nos performances", label: "Suivre nos performances" },
      { value: "Améliorer notre visibilité", label: "Améliorer notre visibilité" },
      { value: "Augmenter nos ventes", label: "Augmenter nos ventes" },
      { value: "Structurer une mission claire", label: "Structurer une mission claire" },
      { value: "Obtenir un livrable précis", label: "Obtenir un livrable précis" },
      { value: "Faire avancer un projet", label: "Faire avancer un projet" },
    ],
  },
  {
    key: "urgency",
    title: "À quel niveau est l’urgence ?",
    description: "On cherche le bon rythme d’exécution, pas à dramatiser la demande.",
    options: [
      { value: "Ce n’est pas urgent", label: "Ce n’est pas urgent" },
      { value: "À traiter bientôt", label: "À traiter bientôt" },
      { value: "Priorité forte", label: "Priorité forte" },
      { value: "Très urgent", label: "Très urgent" },
    ],
  },
  {
    key: "treatment_preference",
    title: "Comment voulez-vous traiter ce besoin ?",
    description: "Ce choix aide KORYXA à recommander le bon mode d’entrée dans l’exécution.",
    options: [
      { value: "Le garder privé", label: "Le garder privé" },
      { value: "Être accompagné pour le structurer", label: "Être accompagné pour le structurer" },
      { value: "Le transformer en mission", label: "Le transformer en mission" },
      { value: "Le publier comme opportunité si pertinent", label: "Le publier comme opportunité si pertinent" },
      { value: "Je veux d’abord une recommandation", label: "Je veux d’abord une recommandation" },
    ],
  },
  {
    key: "team_context",
    title: "Dans quel cadre travaillez-vous aujourd’hui ?",
    description: "On adapte la structuration du besoin au bon niveau d’organisation.",
    options: [
      { value: "Je travaille seul", label: "Je travaille seul" },
      { value: "Petite équipe", label: "Petite équipe" },
      { value: "PME / organisation structurée", label: "PME / organisation structurée" },
      { value: "ONG / association", label: "ONG / association" },
      { value: "Institution / structure plus grande", label: "Institution / structure plus grande" },
    ],
  },
  {
    key: "support_preference",
    title: "Quel type d’accompagnement vous conviendrait le mieux ?",
    description: "Le but est de recommander un cadre d’action vraiment utile, pas un parcours standard.",
    options: [
      { value: "Un cadrage rapide", label: "Un cadrage rapide" },
      { value: "Un suivi pas à pas", label: "Un suivi pas à pas" },
      { value: "Un cockpit pour piloter l’exécution", label: "Un cockpit pour piloter l’exécution" },
      { value: "Une mise en relation utile", label: "Une mise en relation utile" },
      { value: "Un mélange de plusieurs options", label: "Un mélange de plusieurs options" },
    ],
  },
];

const INITIAL_ANSWERS: Answers = {
  primary_goal: "",
  need_type: "",
  expected_result: "",
  urgency: "",
  treatment_preference: "",
  team_context: "",
  support_preference: "",
  short_brief: "",
};

function optionGridClass(optionCount: number): string {
  if (optionCount <= 4) return "sm:grid-cols-2";
  if (optionCount <= 6) return "sm:grid-cols-2 xl:grid-cols-3";
  return "sm:grid-cols-2 xl:grid-cols-4";
}

export default function EnterpriseFlowClient() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(INITIAL_ANSWERS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNeedId, setSavedNeedId] = useState<string | null>(null);

  const currentQuestion = QUESTIONS[stepIndex];
  const isLastQuestion = stepIndex === QUESTIONS.length - 1;
  const progress = Math.round(((stepIndex + 1) / QUESTIONS.length) * 100);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSavedNeedId(window.localStorage.getItem(ENTERPRISE_STORAGE_KEY));
    }
  }, []);

  const currentValue = answers[currentQuestion.key];
  const canContinue = useMemo(() => currentValue.trim().length > 0, [currentValue]);

  function updateAnswer(key: keyof Answers, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleNext() {
    if (!canContinue) return;
    setStepIndex((current) => Math.min(current + 1, QUESTIONS.length - 1));
  }

  function handleBack() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${INNOVA_API_BASE}/enterprise/needs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...answers,
          short_brief: answers.short_brief.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Qualification impossible pour le moment.");
      }
      const payload: EnterpriseSubmissionResponse = await response.json();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ENTERPRISE_STORAGE_KEY, payload.need.id);
      }
      router.push(`/entreprise/resultat/${encodeURIComponent(payload.need.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Qualification entreprise</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              Quelques réponses claires pour structurer le bon besoin
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Le but n’est pas de vous faire remplir un dossier. Le but est de produire un besoin structuré, une
              première mission utile et une vraie entrée dans le cockpit d’exécution.
            </p>
          </div>
          {savedNeedId ? (
            <Link
              href={`/entreprise/resultat/${encodeURIComponent(savedNeedId)}`}
              className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
            >
              Reprendre mon dernier résultat
            </Link>
          ) : null}
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span>
              Étape {stepIndex + 1} sur {QUESTIONS.length}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-sky-600 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200/80 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{currentQuestion.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{currentQuestion.description}</p>
        </div>

        <div className={`mt-8 grid gap-3 ${optionGridClass(currentQuestion.options.length)}`}>
          {currentQuestion.options.map((option) => {
            const active = currentValue === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateAnswer(currentQuestion.key, option.value)}
                className={`rounded-[24px] border px-5 py-5 text-left transition ${
                  active
                    ? "border-sky-300 bg-sky-50 shadow-[0_12px_26px_rgba(14,165,233,0.12)]"
                    : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                }`}
              >
                <span className={`block text-base font-semibold ${active ? "text-sky-700" : "text-slate-950"}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {isLastQuestion ? (
          <div className="mt-6 max-w-2xl rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5">
            <label className="text-sm font-medium text-slate-700">
              En quelques lignes, que cherchez-vous à résoudre ou obtenir ?
              <textarea
                value={answers.short_brief}
                onChange={(event) => updateAnswer("short_brief", event.target.value)}
                rows={3}
                maxLength={320}
                placeholder="Facultatif. Quelques lignes suffisent."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              />
            </label>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Ce champ reste facultatif. Il sert seulement à enrichir la qualification initiale.
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-5 text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0 || submitting}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 disabled:opacity-40"
          >
            Retour
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !canContinue}
              className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60"
            >
              {submitting ? "Qualification en cours..." : "Lancer la qualification"}
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
      </section>
    </div>
  );
}

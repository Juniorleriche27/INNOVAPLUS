"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

const FLOW_STORAGE_KEY = "koryxa.trajectory.flowId";

const LEVEL_OPTIONS = ["Débutant", "Intermédiaire", "Avancé"];
const RHYTHM_OPTIONS = ["1-3h / semaine", "4-6h / semaine", "7-10h / semaine", "10h+ / semaine"];
const PREFERENCE_OPTIONS = [
  "Cas réels",
  "Ressources asynchrones",
  "Coaching individuel",
  "Feedback régulier",
  "Progression intensive",
];

type StepStatus = "todo" | "in_progress" | "done";

type FlowResponse = {
  flow_id: string;
  guest_id: string;
  status: string;
  onboarding: {
    name?: string | null;
    objective: string;
    current_level: string;
    domain_interest: string;
    weekly_rhythm: string;
    target_outcome?: string | null;
    context?: string | null;
    constraints: string[];
    preferences: string[];
  };
  diagnostic: {
    profile_summary: string;
    recommended_trajectory: {
      title: string;
      rationale: string;
      mission_focus: string;
    };
    recommended_resources: Array<{
      type: string;
      label: string;
      reason: string;
    }>;
    next_steps: string[];
    readiness: {
      score: number;
      label: string;
      validation_status: string;
    };
    target_opportunities: string[];
    progress_steps: Array<{
      key: string;
      title: string;
      status: StepStatus;
      detail: string;
      proof?: string | null;
    }>;
  } | null;
};

function splitLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function readinessTone(score: number): string {
  if (score >= 75) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 58) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-sky-700 bg-sky-50 border-sky-200";
}

function statusLabel(status: StepStatus): string {
  if (status === "done") return "Validé";
  if (status === "in_progress") return "En cours";
  return "À lancer";
}

function statusTone(status: StepStatus): string {
  if (status === "done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "in_progress") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function TrajectoryFlowClient() {
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [currentLevel, setCurrentLevel] = useState(LEVEL_OPTIONS[0]);
  const [domainInterest, setDomainInterest] = useState("");
  const [weeklyRhythm, setWeeklyRhythm] = useState(RHYTHM_OPTIONS[1]);
  const [targetOutcome, setTargetOutcome] = useState("");
  const [context, setContext] = useState("");
  const [constraintsText, setConstraintsText] = useState("");
  const [preferences, setPreferences] = useState<string[]>(["Cas réels"]);
  const [loadingSavedFlow, setLoadingSavedFlow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stepBusyKey, setStepBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowResponse | null>(null);

  const canSubmit = useMemo(
    () => objective.trim().length >= 8 && domainInterest.trim().length >= 2 && !submitting,
    [domainInterest, objective, submitting],
  );

  async function loadFlow(flowId: string) {
    const res = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flowId)}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error("Impossible de recharger votre trajectoire.");
    }
    const data: FlowResponse = await res.json();
    setFlow(data);
  }

  useEffect(() => {
    const savedFlowId = typeof window !== "undefined" ? window.localStorage.getItem(FLOW_STORAGE_KEY) : null;
    if (!savedFlowId) {
      setLoadingSavedFlow(false);
      return;
    }
    loadFlow(savedFlowId)
      .catch(() => {
        window.localStorage.removeItem(FLOW_STORAGE_KEY);
      })
      .finally(() => setLoadingSavedFlow(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const onboardingPayload = {
        name: name.trim() || undefined,
        objective: objective.trim(),
        current_level: currentLevel,
        domain_interest: domainInterest.trim(),
        weekly_rhythm: weeklyRhythm,
        target_outcome: targetOutcome.trim() || undefined,
        context: context.trim() || undefined,
        constraints: splitLines(constraintsText),
        preferences,
      };

      const onboardingRes = await fetch(`${INNOVA_API_BASE}/trajectoire/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(onboardingPayload),
      });
      if (!onboardingRes.ok) {
        const data = await onboardingRes.json().catch(() => ({}));
        throw new Error(data?.detail || "Enregistrement de l’onboarding impossible.");
      }
      const onboardingData: FlowResponse = await onboardingRes.json();

      if (typeof window !== "undefined") {
        window.localStorage.setItem(FLOW_STORAGE_KEY, onboardingData.flow_id);
      }

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

      const diagnosticData: FlowResponse = await diagnosticRes.json();
      setFlow(diagnosticData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStep(stepKey: string, status: StepStatus) {
    if (!flow) return;
    setStepBusyKey(stepKey);
    setError(null);
    try {
      const res = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flow.flow_id)}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ step_key: stepKey, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Mise à jour de progression impossible.");
      }
      const data: FlowResponse = await res.json();
      setFlow(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setStepBusyKey(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-[28px] border border-white/12 bg-white/8 p-5 shadow-sm backdrop-blur"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200">Onboarding actif</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Commencer un diagnostic réel</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Renseignez votre objectif, votre niveau, votre rythme et vos contraintes. KORYXA produit ensuite une
            trajectoire recommandée, un score initial et des prochaines actions concrètes.
          </p>
        </div>

        <label className="text-sm text-slate-200">
          Nom ou prénom
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="text-sm text-slate-200">
          Objectif principal
          <textarea
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            rows={4}
            required
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            Niveau actuel
            <select
              value={currentLevel}
              onChange={(event) => setCurrentLevel(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              {LEVEL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-200">
            Domaine d’intérêt
            <input
              value={domainInterest}
              onChange={(event) => setDomainInterest(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="text-sm text-slate-200">
            Rythme disponible
            <select
              value={weeklyRhythm}
              onChange={(event) => setWeeklyRhythm(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            >
              {RHYTHM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-200">
            Direction visée
            <input
              value={targetOutcome}
              onChange={(event) => setTargetOutcome(event.target.value)}
              placeholder="Mission, stage, collaboration..."
              className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
        </div>

        <label className="text-sm text-slate-200">
          Contexte ou point de départ
          <textarea
            value={context}
            onChange={(event) => setContext(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="text-sm text-slate-200">
          Contraintes principales
          <textarea
            value={constraintsText}
            onChange={(event) => setConstraintsText(event.target.value)}
            rows={3}
            placeholder="Temps limité, budget serré, besoin d’accompagnement..."
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/95 px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <div className="text-sm text-slate-200">
          Préférences de progression
          <div className="mt-3 flex flex-wrap gap-2">
            {PREFERENCE_OPTIONS.map((option) => {
              const active = preferences.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setPreferences((current) =>
                      active ? current.filter((item) => item !== option) : [...current, option].slice(0, 5),
                    )
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-sky-300 bg-sky-50 text-sky-700"
                      : "border-white/15 bg-white/5 text-slate-200 hover:border-white/25"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <p className="text-sm font-medium text-rose-200">{error}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="submit" disabled={!canSubmit} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
            {submitting ? "Analyse en cours..." : "Lancer le diagnostic"}
          </button>
          {flow ? (
            <button
              type="button"
              onClick={() => void loadFlow(flow.flow_id)}
              className="btn-secondary w-full justify-center sm:w-auto"
            >
              Recharger mon résultat
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-[28px] border border-white/12 bg-white/96 p-5 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Résultat exploitable</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {flow?.diagnostic ? "Votre trajectoire recommandée" : "Le diagnostic apparaîtra ici"}
            </h3>
          </div>
          {flow?.diagnostic ? (
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${readinessTone(flow.diagnostic.readiness.score)}`}>
              Score initial : {flow.diagnostic.readiness.score}/100
            </span>
          ) : null}
        </div>

        {loadingSavedFlow ? (
          <div className="mt-6 space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : flow?.diagnostic ? (
          <div className="mt-6 space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Résumé du profil</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{flow.diagnostic.profile_summary}</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trajectoire recommandée</p>
                <h4 className="mt-3 text-xl font-semibold text-slate-950">{flow.diagnostic.recommended_trajectory.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-700">{flow.diagnostic.recommended_trajectory.rationale}</p>
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                  <span className="font-semibold text-slate-950">Focus mission :</span> {flow.diagnostic.recommended_trajectory.mission_focus}
                </div>
              </article>

              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Niveau de préparation</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{flow.diagnostic.readiness.label}</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Statut de validation : <span className="font-semibold">{flow.diagnostic.readiness.validation_status}</span>
                </p>
              </article>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ressources recommandées</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {flow.diagnostic.recommended_resources.map((resource) => (
                  <article key={`${resource.type}-${resource.label}`} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{resource.type}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{resource.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{resource.reason}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Prochaines étapes</p>
                <ol className="mt-3 space-y-3">
                  {flow.diagnostic.next_steps.map((step, index) => (
                    <li key={`${step}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                      <span className="font-semibold text-slate-950">0{index + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </article>

              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Directions possibles</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {flow.diagnostic.target_opportunities.map((item) => (
                    <span key={item} className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Progression suivie</p>
              <div className="mt-3 space-y-3">
                {flow.diagnostic.progress_steps.map((step) => (
                  <article key={step.key} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(step.status)}`}>
                        {statusLabel(step.status)}
                      </span>
                    </div>
                    {step.status !== "done" ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {step.status === "todo" ? (
                          <button
                            type="button"
                            onClick={() => void updateStep(step.key, "in_progress")}
                            disabled={stepBusyKey === step.key}
                            className="btn-secondary"
                          >
                            {stepBusyKey === step.key ? "Mise à jour..." : "Marquer comme lancé"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void updateStep(step.key, "done")}
                            disabled={stepBusyKey === step.key}
                            className="btn-secondary"
                          >
                            {stepBusyKey === step.key ? "Mise à jour..." : "Valider l’étape"}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
            Remplissez l’onboarding pour obtenir un résumé du profil, une trajectoire recommandée, des ressources
            pertinentes, un score initial et les opportunités cibles.
          </div>
        )}
      </div>
    </div>
  );
}

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
const PROOF_TYPES = [
  { value: "link", label: "Lien" },
  { value: "short_text", label: "Texte court" },
  { value: "structured_answer", label: "Réponse structurée" },
  { value: "mini_deliverable", label: "Mini-livrable" },
  { value: "project_submission", label: "Projet soumis" },
  { value: "summary_note", label: "Note de synthèse" },
] as const;

type TaskStatus = "todo" | "in_progress" | "done";
type ProofStatus = "declared" | "submitted" | "reviewed" | "validated" | "rejected";
type ValidationLevel = "initial" | "building" | "validated" | "advanced";

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
    recommended_partners: Array<{
      type: "organisme" | "plateforme" | "coach";
      label: string;
      reason: string;
      match_score: number;
      formats: string[];
      languages: string[];
      price_hint?: string | null;
      proof_fit: string[];
    }>;
    next_steps: string[];
    readiness: {
      initial_score: number;
      progress_score: number;
      readiness_score: number;
      label: string;
      validation_status: string;
      validation_level: ValidationLevel;
    };
  } | null;
  progress_plan: {
    title: string;
    target_goal: string;
    access_level: "free" | "premium";
    plan_tier: string;
    skills_to_cover: string[];
    stages: Array<{
      key: string;
      title: string;
      objective: string;
      order: number;
      status: TaskStatus;
      access_level: "free" | "premium";
      tasks: Array<{
        key: string;
        title: string;
        description: string;
        status: TaskStatus;
        proof_required: boolean;
        expected_proof_types: string[];
        access_level: "free" | "premium";
        feature_gate?: string | null;
        proof_count: number;
        validated_proof_count: number;
        next_action?: string | null;
      }>;
    }>;
    milestones: string[];
    next_actions: string[];
    progress_score: number;
    readiness_score: number;
    validation_level: ValidationLevel;
  } | null;
  proofs: Array<{
    proof_id: string;
    stage_key: string;
    task_key: string;
    proof_type: string;
    value: string;
    summary?: string | null;
    status: ProofStatus;
    impact_note?: string | null;
    submitted_at: string;
    validated_at?: string | null;
  }>;
  verified_profile: {
    profile_status: "not_ready" | "eligible" | "verified";
    progress_score: number;
    readiness_score: number;
    validation_level: ValidationLevel;
    validated_proof_count: number;
    minimum_validated_proofs: number;
    minimum_readiness_score: number;
    shareable_headline: string;
    summary: string;
    included_fields: string[];
  } | null;
  opportunity_targets: Array<{
    label: string;
    type: "mission" | "stage" | "collaboration" | "project" | "accompagnement";
    reason: string;
    visibility_status: "recommended" | "unlocked" | "prioritized";
    criteria: {
      minimum_readiness_score: number;
      minimum_validated_proofs: number;
      minimum_validation_level: ValidationLevel;
    };
  }>;
};

type ProofDraftState = {
  type: string;
  value: string;
  summary: string;
};

function splitLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function readinessTone(score: number): string {
  if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (score >= 62) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-sky-700 bg-sky-50 border-sky-200";
}

function profileTone(status: "not_ready" | "eligible" | "verified"): string {
  if (status === "verified") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "eligible") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function opportunityTone(status: "recommended" | "unlocked" | "prioritized"): string {
  if (status === "prioritized") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "unlocked") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function proofTone(status: ProofStatus): string {
  if (status === "validated") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "reviewed") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "submitted") return "bg-sky-50 text-sky-700 border-sky-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function statusLabel(status: TaskStatus): string {
  if (status === "done") return "Validé";
  if (status === "in_progress") return "En cours";
  return "À lancer";
}

function statusTone(status: TaskStatus): string {
  if (status === "done") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "in_progress") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}

function accessTone(accessLevel: "free" | "premium"): string {
  return accessLevel === "premium"
    ? "bg-slate-950 text-white border-slate-950"
    : "bg-white text-slate-700 border-slate-200";
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
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
  const [proofBusyKey, setProofBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowResponse | null>(null);
  const [proofDrafts, setProofDrafts] = useState<Record<string, ProofDraftState>>({});

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
      if (typeof window !== "undefined") {
        window.location.hash = "ma-trajectoire";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTask(taskKey: string, status: TaskStatus) {
    if (!flow) return;
    setStepBusyKey(taskKey);
    setError(null);
    try {
      const res = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flow.flow_id)}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ step_key: taskKey, status }),
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

  async function submitProof(stageKey: string, taskKey: string) {
    if (!flow) return;
    const draft = proofDrafts[taskKey] || { type: "summary_note", value: "", summary: "" };
    if (draft.value.trim().length < 3) {
      setError("Ajoutez une preuve exploitable avant l’envoi.");
      return;
    }
    setProofBusyKey(taskKey);
    setError(null);
    try {
      const res = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flow.flow_id)}/proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stage_key: stageKey,
          task_key: taskKey,
          proof_type: draft.type,
          value: draft.value.trim(),
          summary: draft.summary.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Ajout de preuve impossible.");
      }
      const data: FlowResponse = await res.json();
      setFlow(data);
      setProofDrafts((current) => ({
        ...current,
        [taskKey]: { type: draft.type, value: "", summary: "" },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setProofBusyKey(null);
    }
  }

  const latestProofs = useMemo(() => {
    if (!flow?.proofs) return [];
    return [...flow.proofs]
      .sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at))
      .slice(0, 5);
  }, [flow?.proofs]);

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
            KORYXA produit une trajectoire recommandée, un plan de progression personnalisé, des preuves attendues, un
            score initial et des opportunités cibles.
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
              Recharger ma trajectoire
            </button>
          ) : null}
        </div>
      </form>

      <div
        id="ma-trajectoire"
        className="rounded-[28px] border border-white/12 bg-white/96 p-5 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Ma trajectoire</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {flow?.diagnostic ? "Résultat exploitable et progression pilotée" : "Le diagnostic apparaîtra ici"}
            </h3>
          </div>
          {flow?.diagnostic ? (
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${readinessTone(flow.diagnostic.readiness.readiness_score)}`}
              >
                Readiness : {flow.diagnostic.readiness.readiness_score}/100
              </span>
              {flow.verified_profile ? (
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profileTone(flow.verified_profile.profile_status)}`}
                >
                  Profil : {flow.verified_profile.profile_status === "verified" ? "Verified" : flow.verified_profile.profile_status === "eligible" ? "Eligible" : "Not ready"}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {loadingSavedFlow ? (
          <div className="mt-6 space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : flow?.diagnostic && flow.progress_plan ? (
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Scores et validation</p>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-950">Score initial :</span>{" "}
                    {flow.diagnostic.readiness.initial_score}/100
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Score de progression :</span>{" "}
                    {flow.progress_plan.progress_score}/100
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Niveau de préparation :</span>{" "}
                    {flow.diagnostic.readiness.label}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">Validation :</span>{" "}
                    {flow.diagnostic.readiness.validation_level}
                  </p>
                </div>
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Plan de progression</p>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accessTone(flow.progress_plan.access_level)}`}>
                    {flow.progress_plan.plan_tier} · {flow.progress_plan.access_level}
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">{flow.progress_plan.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  Objectif : <span className="font-semibold text-slate-950">{flow.progress_plan.target_goal}</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {flow.progress_plan.skills_to_cover.map((skill) => (
                    <span key={skill} className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </article>

              {flow.verified_profile ? (
                <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Profil vérifié KORYXA</p>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profileTone(flow.verified_profile.profile_status)}`}>
                      {flow.verified_profile.profile_status}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{flow.verified_profile.shareable_headline}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{flow.verified_profile.summary}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">
                    Seuil MVP : {flow.verified_profile.minimum_validated_proofs} preuves validées et readiness minimale de{" "}
                    {flow.verified_profile.minimum_readiness_score}/100.
                  </p>
                </article>
              ) : null}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ressources externes recommandées</p>
                <div className="mt-3 grid gap-3">
                  {flow.diagnostic.recommended_resources.map((resource) => (
                    <div key={`${resource.type}-${resource.label}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{resource.type}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{resource.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{resource.reason}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Partenaires et coachs recommandés</p>
                <div className="mt-3 grid gap-3">
                  {flow.diagnostic.recommended_partners.map((partner) => (
                    <div key={`${partner.type}-${partner.label}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-950">{partner.label}</p>
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          match {partner.match_score}/100
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{partner.reason}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        {partner.type} · {partner.formats.join(", ") || "format adaptable"} · {partner.price_hint || "prix à préciser"}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Prochaines actions</p>
                <ol className="mt-3 space-y-3">
                  {flow.progress_plan.next_actions.map((step, index) => (
                    <li key={`${step}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">
                      <span className="font-semibold text-slate-950">0{index + 1}.</span> {step}
                    </li>
                  ))}
                </ol>
              </article>

              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Opportunités cibles</p>
                <div className="mt-3 space-y-3">
                  {flow.opportunity_targets.map((item) => (
                    <div key={`${item.type}-${item.label}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${opportunityTone(item.visibility_status)}`}>
                          {item.visibility_status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        Critères : readiness {item.criteria.minimum_readiness_score}+ · preuves validées {item.criteria.minimum_validated_proofs}+ · niveau {item.criteria.minimum_validation_level}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Étapes, tâches et preuves</p>
              <div className="mt-3 space-y-4">
                {flow.progress_plan.stages.map((stage) => (
                  <article key={stage.key} className="rounded-[22px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          Étape {stage.order}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-950">{stage.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{stage.objective}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(stage.status)}`}>
                          {statusLabel(stage.status)}
                        </span>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accessTone(stage.access_level)}`}>
                          {stage.access_level}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {stage.tasks.map((task) => {
                        const draft = proofDrafts[task.key] || { type: task.expected_proof_types[0] || "summary_note", value: "", summary: "" };
                        return (
                          <div key={task.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="max-w-2xl">
                                <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>
                                <p className="mt-2 text-xs leading-6 text-slate-500">
                                  {task.proof_required ? "Preuve requise" : "Validation simple"} · {task.proof_count} preuve(s) ·{" "}
                                  {task.validated_proof_count} validée(s)
                                  {task.feature_gate ? ` · gate ${task.feature_gate}` : ""}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(task.status)}`}>
                                  {statusLabel(task.status)}
                                </span>
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accessTone(task.access_level)}`}>
                                  {task.access_level}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              {task.status === "todo" ? (
                                <button
                                  type="button"
                                  onClick={() => void updateTask(task.key, "in_progress")}
                                  disabled={stepBusyKey === task.key}
                                  className="btn-secondary"
                                >
                                  {stepBusyKey === task.key ? "Mise à jour..." : "Marquer comme lancé"}
                                </button>
                              ) : null}
                              {!task.proof_required && task.status !== "done" ? (
                                <button
                                  type="button"
                                  onClick={() => void updateTask(task.key, "done")}
                                  disabled={stepBusyKey === task.key}
                                  className="btn-secondary"
                                >
                                  {stepBusyKey === task.key ? "Mise à jour..." : "Valider l’étape"}
                                </button>
                              ) : null}
                            </div>

                            {task.proof_required ? (
                              <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3">
                                <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Type de preuve
                                    <select
                                      value={draft.type}
                                      onChange={(event) =>
                                        setProofDrafts((current) => ({
                                          ...current,
                                          [task.key]: {
                                            ...draft,
                                            type: event.target.value,
                                          },
                                        }))
                                      }
                                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                    >
                                      {(task.expected_proof_types.length ? task.expected_proof_types : PROOF_TYPES.map((item) => item.value)).map((type) => (
                                        <option key={type} value={type}>
                                          {PROOF_TYPES.find((item) => item.value === type)?.label || type}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                    Preuve
                                    <textarea
                                      value={draft.value}
                                      onChange={(event) =>
                                        setProofDrafts((current) => ({
                                          ...current,
                                          [task.key]: {
                                            ...draft,
                                            value: event.target.value,
                                          },
                                        }))
                                      }
                                      rows={3}
                                      placeholder="Lien, mini-livrable, réponse structurée..."
                                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                    />
                                  </label>
                                </div>
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Note de synthèse
                                  <textarea
                                    value={draft.summary}
                                    onChange={(event) =>
                                      setProofDrafts((current) => ({
                                        ...current,
                                        [task.key]: {
                                          ...draft,
                                          summary: event.target.value,
                                        },
                                      }))
                                    }
                                    rows={2}
                                    placeholder="Expliquez en quoi cette preuve montre votre progression."
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                  />
                                </label>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-xs text-slate-500">
                                    Preuves attendues : {task.expected_proof_types.join(", ") || "format libre"}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => void submitProof(stage.key, task.key)}
                                    disabled={proofBusyKey === task.key}
                                    className="btn-secondary"
                                  >
                                    {proofBusyKey === task.key ? "Envoi..." : "Ajouter une preuve"}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {latestProofs.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dernières preuves</p>
                <div className="mt-3 grid gap-3">
                  {latestProofs.map((proof) => (
                    <div key={proof.proof_id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-950">{proof.task_key}</p>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${proofTone(proof.status)}`}>
                          {proof.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{proof.summary || proof.value}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        {proof.proof_type} · soumis le {formatDate(proof.submitted_at)}
                        {proof.impact_note ? ` · ${proof.impact_note}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-sm leading-7 text-slate-600">
            Remplissez l’onboarding pour obtenir un diagnostic, une trajectoire recommandée, un plan de progression,
            des preuves attendues, un score et des opportunités cibles.
          </div>
        )}
      </div>
    </div>
  );
}

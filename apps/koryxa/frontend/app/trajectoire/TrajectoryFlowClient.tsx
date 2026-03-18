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
    next_actions: string[];
    progress_score: number;
    readiness_score: number;
    validation_level: ValidationLevel;
  } | null;
  verified_profile: {
    profile_status: "not_ready" | "eligible" | "verified";
  } | null;
  opportunity_targets: Array<{
    label: string;
    type: "mission" | "stage" | "collaboration" | "project" | "accompagnement";
    reason: string;
    visibility_status: "recommended" | "unlocked" | "prioritized";
  }>;
};

type CockpitActivationResponse = {
  status: "ready" | "auth_required";
  flow_id: string;
  context_id: string;
  redirect_url: string;
};

function splitLines(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function readinessTone(score: number): string {
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (score >= 62) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function profileTone(status: "not_ready" | "eligible" | "verified"): string {
  if (status === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "eligible") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function buildResultBenefits(flow: FlowResponse | null): string[] {
  if (!flow?.diagnostic) return [];
  const benefits = [
    flow.diagnostic.recommended_trajectory.mission_focus,
    ...flow.opportunity_targets.slice(0, 2).map((item) => item.label),
  ]
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(benefits)).slice(0, 3);
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
  const [cockpitBusy, setCockpitBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowResponse | null>(null);

  const canSubmit = useMemo(
    () => objective.trim().length >= 8 && domainInterest.trim().length >= 2 && !submitting,
    [domainInterest, objective, submitting],
  );

  const nextActions = useMemo(() => {
    if (!flow?.diagnostic) return [];
    const items = flow.progress_plan?.next_actions?.length
      ? flow.progress_plan.next_actions
      : flow.diagnostic.next_steps;
    return items.slice(0, 3);
  }, [flow]);

  const resultBenefits = useMemo(() => buildResultBenefits(flow), [flow]);

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

  async function handleOpenCockpit() {
    if (!flow) return;
    setCockpitBusy(true);
    setError(null);
    try {
      const res = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flow.flow_id)}/cockpit`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Ouverture du cockpit impossible.");
      }
      const data: CockpitActivationResponse = await res.json();
      if (typeof window !== "undefined") {
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setCockpitBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
      <form
        id="demarrer"
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-[28px] border border-white/12 bg-white/8 p-5 shadow-sm backdrop-blur"
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200">Onboarding actif</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Commencer un diagnostic réel</h3>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            KORYXA analyse votre point de départ, recommande une trajectoire et prépare ensuite l’ouverture d’un cockpit
            de progression propulsé par MyPlanningAI.
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" disabled={!canSubmit} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
            {submitting ? "Analyse en cours..." : "Lancer le diagnostic"}
          </button>
        </div>
      </form>

      <section
        id="ma-trajectoire"
        className="rounded-[28px] border border-white/12 bg-white/96 p-5 text-slate-900 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Sortie produit</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {flow?.diagnostic ? "Votre trajectoire recommandée" : "Le résultat apparaîtra ici"}
            </h3>
          </div>
          {flow?.diagnostic ? (
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${readinessTone(flow.diagnostic.readiness.readiness_score)}`}
              >
                Readiness {flow.diagnostic.readiness.readiness_score}/100
              </span>
              {flow.verified_profile ? (
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profileTone(flow.verified_profile.profile_status)}`}
                >
                  Profil {flow.verified_profile.profile_status}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {loadingSavedFlow ? (
          <div className="mt-6 space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : flow?.diagnostic ? (
          <div className="mt-6 space-y-5">
            <article className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Résumé du profil</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{flow.diagnostic.profile_summary}</p>
            </article>

            <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trajectoire recommandée</p>
              <h4 className="mt-3 text-xl font-semibold text-slate-950">{flow.diagnostic.recommended_trajectory.title}</h4>
              <p className="mt-3 text-sm leading-7 text-slate-700">{flow.diagnostic.recommended_trajectory.rationale}</p>
            </article>

            <div className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">3 prochaines actions</p>
                <div className="mt-4 space-y-3">
                  {nextActions.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">Étape {index + 1} :</span> {item}
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Bénéfices et débouchés</p>
                <div className="mt-4 space-y-3">
                  {resultBenefits.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            </div>

            {flow.diagnostic.recommended_partners.length ? (
              <article className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Partenaires recommandés</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {flow.diagnostic.recommended_partners.slice(0, 3).map((partner) => (
                    <div key={partner.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-sm font-semibold text-slate-950">{partner.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{partner.reason}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(11,39,66,0.94))] px-4 py-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Suite logique</p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
                Le cockpit de progression KORYXA s’ouvre dans MyPlanningAI avec le bon contexte métier : trajectoire,
                tâches d’exécution, preuves, validation, opportunités et profil vérifié.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => void handleOpenCockpit()}
                  disabled={cockpitBusy}
                  className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60"
                >
                  {cockpitBusy ? "Ouverture du cockpit..." : "Ouvrir mon cockpit de progression"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-slate-900">Le résultat Trajectoire sera affiché ici.</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Vous verrez la trajectoire recommandée, les trois prochaines actions et la sortie vers le cockpit de
              progression KORYXA.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

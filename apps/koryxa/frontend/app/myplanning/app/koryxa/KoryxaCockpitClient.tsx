"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { INNOVA_API_BASE } from "@/lib/env";

const PROOF_TYPES = [
  { value: "link", label: "Lien" },
  { value: "short_text", label: "Texte court" },
  { value: "structured_answer", label: "Réponse structurée" },
  { value: "mini_deliverable", label: "Mini-livrable" },
  { value: "project_submission", label: "Projet soumis" },
  { value: "summary_note", label: "Note de synthèse" },
] as const;

type TaskState = "todo" | "in_progress" | "done";
type ProofStatus = "declared" | "submitted" | "reviewed" | "validated" | "rejected";

type MyPlanningTask = {
  id: string;
  title: string;
  description?: string | null;
  kanban_state: TaskState;
  priority_eisenhower: string;
  high_impact: boolean;
  estimated_duration_minutes?: number | null;
  due_datetime?: string | null;
};

type CockpitContext = {
  flow_id: string;
  context_id: string;
  task_query: {
    context_type: "professional";
    context_id: string;
  };
  profile_summary: string;
  recommended_trajectory: {
    title: string;
    rationale: string;
    mission_focus: string;
  };
  recommended_partners: Array<{
    type: "organisme" | "plateforme" | "coach";
    label: string;
    reason: string;
    match_score: number;
  }>;
  next_actions: string[];
  benefits: string[];
  readiness: {
    initial_score: number;
    progress_score: number;
    readiness_score: number;
    label: string;
    validation_status: string;
    validation_level: string;
  };
  verified_profile: {
    profile_status: "not_ready" | "eligible" | "verified";
    progress_score: number;
    readiness_score: number;
    validation_level: string;
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
      minimum_validation_level: string;
    };
  }>;
  latest_proofs: Array<{
    proof_id: string;
    stage_key: string;
    task_key: string;
    proof_type: string;
    value: string;
    summary?: string | null;
    status: ProofStatus;
    submitted_at: string;
  }>;
  execution_stages: Array<{
    key: string;
    title: string;
    objective: string;
    status: TaskState;
    tasks: Array<{
      myplanning_task_id: string | null;
      stage_key: string;
      task_key: string;
      title: string;
      description: string;
      proof_required: boolean;
      expected_proof_types: string[];
      proof_count: number;
      validated_proof_count: number;
      next_action?: string | null;
      feature_gate?: string | null;
    }>;
  }>;
  binding_summary: {
    binding_count: number;
    proof_required_count: number;
  };
};

type TaskListResponse = {
  items: MyPlanningTask[];
};

type ProofDraft = {
  type: string;
  value: string;
  summary: string;
};

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

function executionTone(state: TaskState): string {
  if (state === "done") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "in_progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function profileTone(status: "not_ready" | "eligible" | "verified"): string {
  if (status === "verified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "eligible") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function opportunityTone(status: "recommended" | "unlocked" | "prioritized"): string {
  if (status === "prioritized") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "unlocked") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function proofTone(status: ProofStatus): string {
  if (status === "validated") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "reviewed") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "submitted") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function KoryxaCockpitClient() {
  const searchParams = useSearchParams();
  const flowId = (searchParams.get("flow_id") || "").trim();
  const contextIdFromUrl = (searchParams.get("context_id") || "").trim();
  const { user, loading: authLoading } = useAuth();

  const [context, setContext] = useState<CockpitContext | null>(null);
  const [tasks, setTasks] = useState<MyPlanningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null);
  const [proofBusyKey, setProofBusyKey] = useState<string | null>(null);
  const [proofDrafts, setProofDrafts] = useState<Record<string, ProofDraft>>({});

  const isAuthenticated = Boolean(user?.email);
  const loginHref = `/myplanning/login?redirect=${encodeURIComponent(
    `/myplanning/app/koryxa?flow_id=${encodeURIComponent(flowId)}${contextIdFromUrl ? `&context_id=${encodeURIComponent(contextIdFromUrl)}` : ""}`,
  )}`;

  const taskMap = useMemo(() => {
    const entries = tasks.map((task) => [task.id, task] as const);
    return new Map(entries);
  }, [tasks]);

  const executionSummary = useMemo(() => {
    let done = 0;
    let inProgress = 0;
    let todo = 0;
    for (const task of tasks) {
      if (task.kanban_state === "done") done += 1;
      else if (task.kanban_state === "in_progress") inProgress += 1;
      else todo += 1;
    }
    return { total: tasks.length, done, inProgress, todo };
  }, [tasks]);

  async function loadCockpit() {
    if (!flowId || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const contextRes = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flowId)}/cockpit`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!contextRes.ok) {
        const data = await contextRes.json().catch(() => ({}));
        throw new Error(data?.detail || "Chargement du cockpit KORYXA impossible.");
      }
      const contextData: CockpitContext = await contextRes.json();

      const params = new URLSearchParams({
        context_type: contextData.task_query.context_type,
        context_id: contextData.task_query.context_id,
        limit: "200",
      });
      const tasksRes = await fetch(`${INNOVA_API_BASE}/myplanning/tasks?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!tasksRes.ok) {
        const data = await tasksRes.json().catch(() => ({}));
        throw new Error(data?.detail || "Chargement des tâches MyPlanning impossible.");
      }
      const tasksData: TaskListResponse = await tasksRes.json();
      setContext(contextData);
      setTasks(tasksData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!flowId) {
      setLoading(false);
      setError("flow_id manquant. Le cockpit KORYXA doit être ouvert avec un contexte explicite.");
      return;
    }
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void loadCockpit();
  }, [authLoading, flowId, isAuthenticated]);

  async function updateTask(taskId: string, kanbanState: TaskState) {
    setTaskBusyId(taskId);
    setError(null);
    try {
      const res = await fetch(`${INNOVA_API_BASE}/myplanning/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kanban_state: kanbanState }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Mise à jour de tâche impossible.");
      }
      await loadCockpit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setTaskBusyId(null);
    }
  }

  async function submitProof(stageKey: string, taskKey: string) {
    if (!flowId) return;
    const draft = proofDrafts[taskKey] || { type: "summary_note", value: "", summary: "" };
    if (draft.value.trim().length < 3) {
      setError("Ajoutez une preuve exploitable avant l’envoi.");
      return;
    }
    setProofBusyKey(taskKey);
    setError(null);
    try {
      const res = await fetch(`${INNOVA_API_BASE}/trajectoire/flows/${encodeURIComponent(flowId)}/proofs`, {
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
      setProofDrafts((current) => ({
        ...current,
        [taskKey]: { type: draft.type, value: "", summary: "" },
      }));
      await loadCockpit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setProofBusyKey(null);
    }
  }

  if (!flowId) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-950">Contexte manquant</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Le cockpit KORYXA doit être ouvert avec un `flow_id` explicite pour charger la bonne trajectoire.
        </p>
      </section>
    );
  }

  if (authLoading) {
    return (
      <section className="grid gap-4">
        <div className="h-28 animate-pulse rounded-[32px] bg-white" />
        <div className="h-48 animate-pulse rounded-[32px] bg-white" />
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Cockpit KORYXA</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Connexion requise pour ouvrir votre progression</h1>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            flow_id : {flowId}
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          La trajectoire KORYXA est bien identifiée, mais le cockpit MyPlanningAI a besoin d’une session pour charger les
          vraies tâches d’exécution associées à ce flow.
        </p>
        <div className="mt-6">
          <Link href={loginHref} className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
            Me connecter et ouvrir le cockpit
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(14,116,144,0.10),rgba(255,255,255,0.98))] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
                Cockpit KORYXA
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                propulsé par MyPlanningAI
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {context?.recommended_trajectory.title || "Votre trajectoire KORYXA"}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {context?.profile_summary ||
                "Ce cockpit utilise MyPlanning comme moteur d’exécution et KORYXA comme source de vérité métier pour la validation, la readiness, les opportunités et le profil vérifié."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {context ? (
              <>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  flow_id : {context.flow_id}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  contexte : {context.context_id}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          <article className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Trajectoire</p>
            <p className="mt-3 text-sm font-semibold text-slate-950">{context?.recommended_trajectory.title || "Chargement..."}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{context?.recommended_trajectory.rationale || "Le diagnostic métier charge le bon contexte."}</p>
          </article>
          <article className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Readiness / validation</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{context?.readiness.readiness_score ?? "--"}/100</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{context?.readiness.label || "Le score se met à jour avec les preuves et validations KORYXA."}</p>
          </article>
          <article className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Opportunités</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{context?.opportunity_targets.length ?? 0}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">KORYXA recommande, débloque ou priorise selon readiness, validation et preuves.</p>
          </article>
          <article className="rounded-2xl border border-white/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Profil vérifié</p>
            {context?.verified_profile ? (
              <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profileTone(context.verified_profile.profile_status)}`}>
                {context.verified_profile.profile_status}
              </span>
            ) : (
              <p className="mt-3 text-sm text-slate-600">En préparation</p>
            )}
            <p className="mt-3 text-sm leading-6 text-slate-600">Le statut KORYXA dépend d’un seuil de preuves validées et d’un niveau minimal de readiness.</p>
          </article>
        </div>
      </section>

      {error ? (
        <section className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700">
          {error}
        </section>
      ) : null}

      <section className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
        <span className="font-semibold">Règle source de vérité :</span> MyPlanning pilote l’exécution des tâches.
        KORYXA reste la source de vérité pour la validation métier, la readiness, les opportunités et le profil
        vérifié. Une tâche marquée terminée ici n’accorde donc pas automatiquement une validation KORYXA.
      </section>

      {loading ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="h-60 animate-pulse rounded-[28px] bg-white" />
          <div className="h-60 animate-pulse rounded-[28px] bg-white" />
        </section>
      ) : context ? (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">3 prochaines actions</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Ce que vous pilotez maintenant</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void loadCockpit()}
                  className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                >
                  Actualiser
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {context.next_actions.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <span className="font-semibold text-slate-950">Action {index + 1} :</span> {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tâches MyPlanning</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{executionSummary.total}</p>
                  <p className="mt-2 text-sm text-slate-600">Source de vérité exécution</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Terminées</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{executionSummary.done}</p>
                  <p className="mt-2 text-sm text-slate-600">Progression d’exécution</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Preuves requises</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950">{context.binding_summary.proof_required_count}</p>
                  <p className="mt-2 text-sm text-slate-600">Validation KORYXA séparée</p>
                </div>
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Bénéfices et débouchés</p>
              <div className="mt-5 space-y-3">
                {context.benefits.map((item, index) => (
                  <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
              {context.recommended_partners.length ? (
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Partenaires recommandés</p>
                  <div className="mt-3 grid gap-3">
                    {context.recommended_partners.slice(0, 3).map((partner) => (
                      <div key={partner.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold text-slate-950">{partner.label}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{partner.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Exécution dans MyPlanning</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Étapes métier et tâches pilotées</h2>
              <div className="mt-5 space-y-4">
                {context.execution_stages.map((stage) => (
                  <div key={stage.key} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{stage.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{stage.objective}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${executionTone(stage.status)}`}>
                        Validation KORYXA : {stage.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {stage.tasks.map((binding) => {
                        const task = binding.myplanning_task_id ? taskMap.get(binding.myplanning_task_id) : undefined;
                        const taskState = task?.kanban_state || "todo";
                        return (
                          <div key={`${stage.key}-${binding.task_key}`} className="rounded-2xl border border-white bg-white px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="max-w-2xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-950">{binding.title}</p>
                                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${executionTone(taskState)}`}>
                                    MyPlanning : {taskState}
                                  </span>
                                  {binding.proof_required ? (
                                    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                                      preuve requise
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">{binding.description}</p>
                                {binding.next_action ? (
                                  <p className="mt-3 text-sm text-slate-700">
                                    <span className="font-semibold text-slate-950">Prochaine action :</span> {binding.next_action}
                                  </p>
                                ) : null}
                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
                                    preuves {binding.proof_count}
                                  </span>
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
                                    validées {binding.validated_proof_count}
                                  </span>
                                  {task?.estimated_duration_minutes ? (
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
                                      {task.estimated_duration_minutes} min
                                    </span>
                                  ) : null}
                                  {task?.due_datetime ? (
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
                                      échéance {formatDate(task.due_datetime)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {binding.myplanning_task_id ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => void updateTask(binding.myplanning_task_id!, "todo")}
                                      disabled={taskBusyId === binding.myplanning_task_id}
                                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700 disabled:opacity-60"
                                    >
                                      À lancer
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void updateTask(binding.myplanning_task_id!, "in_progress")}
                                      disabled={taskBusyId === binding.myplanning_task_id}
                                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700 disabled:opacity-60"
                                    >
                                      En cours
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void updateTask(binding.myplanning_task_id!, "done")}
                                      disabled={taskBusyId === binding.myplanning_task_id}
                                      className="inline-flex rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                                    >
                                      Terminer dans MyPlanning
                                    </button>
                                  </>
                                ) : (
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                    liaison tâche absente
                                  </span>
                                )}
                              </div>
                            </div>

                            {binding.proof_required ? (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ajouter une preuve KORYXA</p>
                                <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr]">
                                  <select
                                    value={proofDrafts[binding.task_key]?.type || "summary_note"}
                                    onChange={(event) =>
                                      setProofDrafts((current) => ({
                                        ...current,
                                        [binding.task_key]: {
                                          type: event.target.value,
                                          value: current[binding.task_key]?.value || "",
                                          summary: current[binding.task_key]?.summary || "",
                                        },
                                      }))
                                    }
                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                  >
                                    {PROOF_TYPES.map((item) => (
                                      <option key={item.value} value={item.value}>
                                        {item.label}
                                      </option>
                                    ))}
                                  </select>
                                  <textarea
                                    rows={3}
                                    value={proofDrafts[binding.task_key]?.value || ""}
                                    onChange={(event) =>
                                      setProofDrafts((current) => ({
                                        ...current,
                                        [binding.task_key]: {
                                          type: current[binding.task_key]?.type || "summary_note",
                                          value: event.target.value,
                                          summary: current[binding.task_key]?.summary || "",
                                        },
                                      }))
                                    }
                                    placeholder="Lien, texte structuré, mini-livrable ou note de synthèse..."
                                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                  />
                                </div>
                                <textarea
                                  rows={2}
                                  value={proofDrafts[binding.task_key]?.summary || ""}
                                  onChange={(event) =>
                                    setProofDrafts((current) => ({
                                      ...current,
                                      [binding.task_key]: {
                                        type: current[binding.task_key]?.type || "summary_note",
                                        value: current[binding.task_key]?.value || "",
                                        summary: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Résumé rapide de la preuve fournie..."
                                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                                />
                                <div className="mt-3">
                                  <button
                                    type="button"
                                    onClick={() => void submitProof(binding.stage_key, binding.task_key)}
                                    disabled={proofBusyKey === binding.task_key}
                                    className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                                  >
                                    {proofBusyKey === binding.task_key ? "Envoi..." : "Soumettre la preuve"}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <div className="grid gap-4">
              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Opportunités KORYXA</p>
                <div className="mt-4 space-y-3">
                  {context.opportunity_targets.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${opportunityTone(item.visibility_status)}`}>
                          {item.visibility_status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        Critères : readiness {item.criteria.minimum_readiness_score}+ • preuves validées{" "}
                        {item.criteria.minimum_validated_proofs}+ • niveau {item.criteria.minimum_validation_level}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Profil vérifié KORYXA</p>
                {context.verified_profile ? (
                  <>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${profileTone(context.verified_profile.profile_status)}`}>
                        {context.verified_profile.profile_status}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                        preuves validées {context.verified_profile.validated_proof_count}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600">{context.verified_profile.summary}</p>
                    <div className="mt-4 space-y-2">
                      {context.verified_profile.included_fields.map((item) => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Le profil vérifié apparaîtra ici lorsque les seuils de readiness et de preuves validées seront atteints.
                  </p>
                )}
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Dernières preuves</p>
                <div className="mt-4 space-y-3">
                  {context.latest_proofs.length ? (
                    context.latest_proofs.map((proof) => (
                      <div key={proof.proof_id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-950">{proof.task_key}</p>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${proofTone(proof.status)}`}>
                            {proof.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{proof.summary || proof.value}</p>
                        <p className="mt-3 text-xs text-slate-500">Soumise le {formatDate(proof.submitted_at)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm leading-7 text-slate-600">
                      Aucune preuve soumise pour l’instant.
                    </div>
                  )}
                </div>
              </article>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

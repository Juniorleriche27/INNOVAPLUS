"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { INNOVA_API_BASE } from "@/lib/env";

type TaskState = "todo" | "in_progress" | "done";

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
  need_id: string;
  context_id: string;
  task_query: {
    context_type: "professional";
    context_id: string;
  };
  need: {
    id: string;
    title: string;
    primary_goal: string;
    need_type: string;
    expected_result: string;
    urgency: string;
    treatment_preference: string;
    recommended_treatment_mode: "prive" | "publie" | "accompagne";
    team_context: string;
    support_preference: string;
    short_brief?: string | null;
    status: string;
    qualification_score: number;
    clarity_level: string;
    structured_summary: string;
    next_recommended_action: string;
  };
  mission: {
    id: string;
    need_id: string;
    title: string;
    summary: string;
    deliverable: string;
    execution_mode: string;
    status: string;
    steps: string[];
  };
  opportunity: {
    id: string;
    type: "mission" | "stage" | "collaboration" | "project" | "accompagnement";
    title: string;
    summary: string;
    status: string;
    highlights: string[];
  } | null;
  next_actions: string[];
  execution_steps: Array<{
    step_key: string;
    title: string;
    description: string;
    myplanning_task_id: string | null;
    status: TaskState;
  }>;
  binding_summary: {
    binding_count: number;
  };
};

type TaskListResponse = {
  items: MyPlanningTask[];
};

function modeLabel(mode: "prive" | "publie" | "accompagne"): string {
  if (mode === "publie") return "Publication possible";
  if (mode === "prive") return "Traitement privé";
  return "Accompagnement recommandé";
}

function clarityTone(level: string): string {
  const normalized = level.toLowerCase();
  if (normalized === "strong") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "qualified") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function executionTone(state: TaskState): string {
  if (state === "done") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "in_progress") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
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

export default function KoryxaEnterpriseCockpitClient() {
  const searchParams = useSearchParams();
  const needId = (searchParams.get("need_id") || "").trim();
  const contextIdFromUrl = (searchParams.get("context_id") || "").trim();
  const { user, loading: authLoading } = useAuth();

  const [context, setContext] = useState<CockpitContext | null>(null);
  const [tasks, setTasks] = useState<MyPlanningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null);

  const isAuthenticated = Boolean(user?.email);
  const connectedHomeHref = "/myplanning/app/koryxa-home";
  const cockpitHref = needId
    ? `/myplanning/app/koryxa-enterprise?need_id=${encodeURIComponent(needId)}${contextIdFromUrl ? `&context_id=${encodeURIComponent(contextIdFromUrl)}` : ""}`
    : connectedHomeHref;
  const loginHref = `/myplanning/login?redirect=${encodeURIComponent(
    cockpitHref,
  )}`;

  const taskMap = useMemo(() => new Map(tasks.map((task) => [task.id, task] as const)), [tasks]);

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
    if (!needId || !isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const contextRes = await fetch(`${INNOVA_API_BASE}/enterprise/needs/${encodeURIComponent(needId)}/cockpit`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!contextRes.ok) {
        const data = await contextRes.json().catch(() => ({}));
        throw new Error(data?.detail || "Chargement du cockpit entreprise impossible.");
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
    if (!needId) {
      setContext(null);
      setTasks([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void loadCockpit();
  }, [authLoading, isAuthenticated, needId]);

  async function updateTask(taskId: string, kanbanState: TaskState) {
    setTaskBusyId(taskId);
    setError(null);
    try {
      const response = await fetch(`${INNOVA_API_BASE}/myplanning/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ kanban_state: kanbanState }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de mettre à jour cette tâche.");
      }
      setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, kanban_state: kanbanState } : task)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setTaskBusyId(null);
    }
  }

  if (loading) {
    return (
      <section className="grid gap-4">
        <div className="h-28 animate-pulse rounded-[32px] bg-white" />
        <div className="h-48 animate-pulse rounded-[32px] bg-white" />
      </section>
    );
  }

  if (!needId) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
          Entreprise connectée
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Aucun besoin entreprise actif pour le moment</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Le cockpit entreprise prend le relais lorsqu’un besoin a déjà été qualifié. Commencez un dépôt guidé ou
          revenez à l’accueil connecté KORYXA pour choisir votre prochain flux de travail.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/entreprise/demarrer" className="btn-primary w-full justify-center sm:w-auto">
            Déposer un besoin
          </Link>
          <Link href={connectedHomeHref} className="btn-secondary w-full justify-center sm:w-auto">
            Revenir à l’accueil KORYXA
          </Link>
          <Link href="/chatlaya" className="btn-secondary w-full justify-center sm:w-auto">
            Clarifier avec ChatLAYA
          </Link>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Cockpit entreprise</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Connectez-vous pour ouvrir le cockpit entreprise</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Le cockpit détaillé vit dans MyPlanningAI. La connexion sert à rattacher le besoin, créer les tâches
          d’exécution et suivre la progression dans un cadre sécurisé.
        </p>
        <div className="mt-6">
          <Link href={loginHref} className="btn-primary w-full justify-center sm:w-auto">
            Se connecter pour ouvrir le cockpit
          </Link>
        </div>
      </section>
    );
  }

  if (error || !context) {
    return (
      <section className="rounded-[32px] border border-rose-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-medium text-rose-600">{error || "Impossible de charger le cockpit entreprise."}</p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,248,255,0.96))] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
            KORYXA Enterprise
          </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${clarityTone(context.need.clarity_level)}`}>
            Clarté {context.need.clarity_level}
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {modeLabel(context.need.recommended_treatment_mode)}
          </span>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{context.need.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{context.need.structured_summary}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Tâches liées</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{executionSummary.total}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">En cours</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{executionSummary.inProgress}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white/88 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Terminées</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{executionSummary.done}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mission structurée</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">{context.mission.title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{context.mission.summary}</p>
          <p className="mt-4 text-sm font-semibold text-slate-900">Livrable : {context.mission.deliverable}</p>

          <div className="mt-6 grid gap-3">
            {context.next_actions.map((action, index) => (
              <div key={action} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Action {index + 1}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{action}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Besoin et publication</p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Objectif principal</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{context.need.primary_goal}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cadre d’équipe</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{context.need.team_context}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Publication éventuelle</p>
              <p className="mt-2 text-sm leading-6 text-slate-900">
                {context.opportunity ? context.opportunity.summary : "Aucune publication publique active pour ce besoin."}
              </p>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Exécution MyPlanning</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Les tâches vivent ici, dans le cockpit</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            MyPlanningAI reste la source de vérité pour l’exécution. KORYXA garde la logique métier du besoin, de la mission et de la publication éventuelle.
          </p>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="mt-6 grid gap-4">
          {context.execution_steps.map((step) => {
            const task = step.myplanning_task_id ? taskMap.get(step.myplanning_task_id) : null;
            const state = task?.kanban_state || "todo";
            return (
              <div key={step.step_key} className="rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {step.title}
                      </span>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${executionTone(state)}`}>
                        {state === "done" ? "Terminée" : state === "in_progress" ? "En cours" : "À lancer"}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-950">{step.description}</p>
                    {task?.description ? <p className="mt-2 text-sm leading-7 text-slate-600">{task.description}</p> : null}
                    {task?.due_datetime ? <p className="mt-3 text-xs font-medium text-slate-500">Échéance : {formatDate(task.due_datetime)}</p> : null}
                  </div>

                  {task?.id ? (
                    <div className="flex flex-col gap-2 sm:w-[180px]">
                      <button
                        type="button"
                        onClick={() => void updateTask(task.id, "in_progress")}
                        disabled={taskBusyId === task.id || state === "in_progress"}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 disabled:opacity-50"
                      >
                        Lancer
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateTask(task.id, "done")}
                        disabled={taskBusyId === task.id || state === "done"}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-50"
                      >
                        Terminer
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                      Tâche MyPlanning en cours de préparation.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}

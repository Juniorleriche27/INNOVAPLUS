"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

const API_BASE = `${INNOVA_API_BASE}/myplanning`;

type KanbanState = "todo" | "in_progress" | "done";
type Priority =
  | "urgent_important"
  | "important_not_urgent"
  | "urgent_not_important"
  | "not_urgent_not_important";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority_eisenhower: Priority;
  kanban_state: KanbanState;
  high_impact: boolean;
  estimated_duration_minutes?: number | null;
  start_datetime?: string | null;
  due_datetime?: string | null;
  linked_goal?: string | null;
  moscow?: string | null;
  status?: string | null;
  energy_level?: string | null;
  pomodoro_estimated?: number | null;
  pomodoro_done?: number | null;
  comments?: string | null;
  assignee_user_id?: string | null;
  collaborator_ids?: string[] | null;
};

type AiDraft = {
  title: string;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  priority_eisenhower?: Priority | null;
  high_impact?: boolean | null;
};

type AiPlanResult = {
  order: string[];
  focus: { task_id: string; reason?: string | null }[];
};

type AiReplanResult = {
  recommendations: { task_id: string; suggested_minutes?: number | null; reason?: string | null }[];
};

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent_important: "bg-red-100 text-red-700",
  important_not_urgent: "bg-amber-100 text-amber-800",
  urgent_not_important: "bg-orange-100 text-orange-700",
  not_urgent_not_important: "bg-slate-100 text-slate-700",
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!response.ok) {
    let message = "Impossible de contacter MyPlanning";
    const raw = await response.text();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string") message = parsed;
        else message = parsed.detail || parsed.message || parsed.error || message;
      } catch (err) {
        message = raw;
      }
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return (await response.json()) as T;
}

function formatPriority(value: Priority): string {
  switch (value) {
    case "urgent_important":
      return "Urgent & important";
    case "important_not_urgent":
      return "Important mais pas urgent";
    case "urgent_not_important":
      return "Urgent mais moins important";
    default:
      return "Ni urgent ni important";
  }
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short" });

function AlertBanner({
  tone,
  text,
  onClose,
}: {
  tone: "info" | "error";
  text: string;
  onClose: () => void;
}) {
  const base = tone === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700";
  return (
    <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${base}`}>
      <p>{text}</p>
      <button onClick={onClose} className="text-xs font-semibold underline">
        Fermer
      </button>
    </div>
  );
}

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function TaskCard({
  task,
  advanced,
  onStateChange,
  recentlyCompleted,
}: {
  task: Task;
  advanced: boolean;
  onStateChange?: (id: string, state: KanbanState) => void;
  recentlyCompleted?: boolean;
}) {
  const stateLabel = task.kanban_state === "todo" ? "À faire" : task.kanban_state === "in_progress" ? "En cours" : "Terminé";
  const stateColor =
    task.kanban_state === "done"
      ? "bg-emerald-50 text-emerald-700"
      : task.kanban_state === "in_progress"
        ? "bg-sky-50 text-sky-700"
        : "bg-slate-100 text-slate-600";
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-all duration-200 ${
        recentlyCompleted ? "ring-2 ring-emerald-200" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
          {task.category && <p className="text-xs text-slate-500">{task.category}</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${stateColor}`}>{stateLabel}</span>
      </div>
      {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className={`rounded-full px-3 py-1 font-semibold ${PRIORITY_COLORS[task.priority_eisenhower]}`}>
          {formatPriority(task.priority_eisenhower)}
        </span>
        {task.high_impact && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Impact 20 %</span>}
        {task.estimated_duration_minutes && <span className="rounded-full bg-slate-100 px-2 py-1">{task.estimated_duration_minutes} min</span>}
        {formatDate(task.due_datetime) && <span className="rounded-full bg-slate-100 px-2 py-1">Échéance {formatDate(task.due_datetime)}</span>}
      </div>
      {advanced && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {task.energy_level && (
            <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
              ⚡ Énergie {task.energy_level}
            </span>
          )}
          {task.moscow && <span className="rounded-full bg-fuchsia-50 px-2 py-1 text-fuchsia-700">MoSCoW : {task.moscow}</span>}
          {typeof task.pomodoro_estimated === "number" && (
            <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-600">
              Pomodoro : {task.pomodoro_done ?? 0}/{task.pomodoro_estimated}
            </span>
          )}
        </div>
      )}
      {onStateChange && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(["todo", "in_progress", "done"] as KanbanState[]).map((state) => (
            <button
              key={state}
              onClick={() => onStateChange(task.id, state)}
              className={`rounded-full border px-3 py-1 transition ${
                task.kanban_state === state ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600"
              }`}
            >
              {state === "todo" ? "À faire" : state === "in_progress" ? "En cours" : "Terminé"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskList({
  tasks,
  advanced,
  emptyMessage,
  onStateChange,
  recentlyCompleted,
}: {
  tasks: Task[];
  advanced: boolean;
  emptyMessage: string;
  onStateChange?: (id: string, state: KanbanState) => void;
  recentlyCompleted?: string | null;
}) {
  if (tasks.length === 0) {
    return <EmptyState title="Journée disponible" message={emptyMessage} />;
  }
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          advanced={advanced}
          onStateChange={onStateChange}
          recentlyCompleted={recentlyCompleted === task.id}
        />
      ))}
    </div>
  );
}

function WeekView({
  tasks,
  advanced,
  onStateChange,
  recentlyCompleted,
}: {
  tasks: Task[];
  advanced: boolean;
  onStateChange?: (id: string, state: KanbanState) => void;
  recentlyCompleted?: string | null;
}) {
  const buckets = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const refDate = task.start_datetime || task.due_datetime;
    const key = refDate ? dayFormatter.format(new Date(refDate)) : "Sans date";
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});
  const entries = Object.entries(buckets);
  if (!entries.length) {
    return <EmptyState title="Semaine libre" message="Aucune tâche planifiée cette semaine." />;
  }
  return (
    <div className="space-y-4">
      {entries.map(([label, list]) => (
        <div key={label} className="rounded-3xl border border-slate-100 bg-white/80 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 capitalize">{label}</p>
            <span className="text-xs text-slate-500">{list.length} tâche{list.length > 1 ? "s" : ""}</span>
          </div>
          <div className="mt-3 space-y-3">
            {list.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                advanced={advanced}
                onStateChange={onStateChange}
                recentlyCompleted={recentlyCompleted === task.id}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskKanbanBoard({
  tasks,
  advanced,
  onStateChange,
  recentlyCompleted,
}: {
  tasks: Task[];
  advanced: boolean;
  onStateChange: (id: string, state: KanbanState) => void;
  recentlyCompleted?: string | null;
}) {
  const columns: Record<KanbanState, Task[]> = { todo: [], in_progress: [], done: [] };
  tasks.forEach((task) => columns[task.kanban_state].push(task));
  const order: { key: KanbanState; label: string }[] = [
    { key: "todo", label: "À faire" },
    { key: "in_progress", label: "En cours" },
    { key: "done", label: "Terminé" },
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {order.map(({ key, label }) => (
        <div key={key} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <span className="text-xs text-slate-500">{columns[key].length}</span>
          </div>
          <div className="mt-3 space-y-3">
            {columns[key].length === 0 ? (
              <p className="text-xs text-slate-400">Aucune tâche</p>
            ) : (
              columns[key].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  advanced={advanced}
                  onStateChange={onStateChange}
                  recentlyCompleted={recentlyCompleted === task.id}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskDrawer({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority_eisenhower: "important_not_urgent" as Priority,
    high_impact: false,
    estimated_duration_minutes: 60,
    due_datetime: "",
  });

  useEffect(() => {
    if (!open) {
      setForm({
        title: "",
        description: "",
        priority_eisenhower: "important_not_urgent",
        high_impact: false,
        estimated_duration_minutes: 60,
        due_datetime: "",
      });
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        estimated_duration_minutes: form.estimated_duration_minutes || null,
        due_datetime: form.due_datetime ? new Date(form.due_datetime).toISOString() : null,
      };
      const data = await apiFetch<{ id: string } & Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la tâche");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Nouvelle tâche</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Fermer
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-600">Titre</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Priorité (Eisenhower)</span>
            <select
              value={form.priority_eisenhower}
              onChange={(e) => setForm((prev) => ({ ...prev, priority_eisenhower: e.target.value as Priority }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="urgent_important">Urgent & important</option>
              <option value="important_not_urgent">Important mais pas urgent</option>
              <option value="urgent_not_important">Urgent mais moins important</option>
              <option value="not_urgent_not_important">Ni urgent ni important</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.high_impact}
              onChange={(e) => setForm((prev) => ({ ...prev, high_impact: e.target.checked }))}
            />
            Impact élevé (Pareto 20 %)
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Durée estimée (minutes)</span>
            <input
              type="number"
              min={15}
              step={15}
              value={form.estimated_duration_minutes ?? ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, estimated_duration_minutes: Number(e.target.value) || 0 }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Échéance</span>
            <input
              type="datetime-local"
              value={form.due_datetime}
              onChange={(e) => setForm((prev) => ({ ...prev, due_datetime: e.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-sky-600 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
        >
          {loading ? "Création..." : "Ajouter la tâche"}
        </button>
      </form>
    </div>
  );
}

export default function MyPlanningPage() {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<"today" | "week" | "kanban">("today");
  const [aiText, setAiText] = useState("");
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [planResult, setPlanResult] = useState<AiPlanResult | null>(null);
  const [replanMinutes, setReplanMinutes] = useState(45);
  const [replanResult, setReplanResult] = useState<AiReplanResult | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [replanLoading, setReplanLoading] = useState(false);
  const [draftSaving, setDraftSaving] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ text: string; tone: "info" | "error" } | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<string | null>(null);

  const showBanner = (text: string, tone: "info" | "error" = "info") => setBanner({ text, tone });

  useEffect(() => {
    if (!banner) return;
    const id = window.setTimeout(() => setBanner(null), 5000);
    return () => window.clearTimeout(id);
  }, [banner]);

  const refreshTasks = async () => {
    setLoading(true);
    setTasksError(null);
    try {
      const data = await apiFetch<{ items: Task[] }>("/tasks");
      setTasks(data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de charger les tâches";
      setTasksError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshTasks();
  }, []);

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.kanban_state !== "done" && (isSameDay(task.start_datetime) || isSameDay(task.due_datetime))),
    [tasks],
  );
  const weekTasks = useMemo(
    () => tasks.filter((task) => task.kanban_state !== "done" && (isSameWeek(task.start_datetime) || isSameWeek(task.due_datetime))),
    [tasks],
  );
  const completedCount = tasks.filter((task) => task.kanban_state === "done").length;
  const highImpactCount = tasks.filter((task) => task.high_impact).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleStateChange = async (taskId: string, state: KanbanState) => {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ kanban_state: state }),
      });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, kanban_state: state } : task)));
      if (state === "done") {
        setRecentlyCompleted(taskId);
        window.setTimeout(() => setRecentlyCompleted((prev) => (prev === taskId ? null : prev)), 1200);
      } else {
        setRecentlyCompleted(null);
      }
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Action impossible", "error");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      showBanner("Tâche supprimée", "info");
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Suppression impossible", "error");
    }
  };

  const handleAiSuggest = async () => {
    if (!aiText.trim()) return;
    setSuggestLoading(true);
    try {
      const data = await apiFetch<{ drafts: AiDraft[] }>("/ai/suggest-tasks", {
        method: "POST",
        body: JSON.stringify({ free_text: aiText }),
      });
      setAiDrafts(data.drafts);
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Échec de la suggestion IA", "error");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handlePlanDay = async () => {
    setPlanLoading(true);
    try {
      const data = await apiFetch<AiPlanResult>("/ai/plan-day", { method: "POST", body: JSON.stringify({}) });
      setPlanResult(data);
      showBanner("Ordre prioritaire mis à jour", "info");
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Échec de la planification IA", "error");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleReplan = async () => {
    setReplanLoading(true);
    try {
      const data = await apiFetch<AiReplanResult>("/ai/replan-with-time", {
        method: "POST",
        body: JSON.stringify({ available_minutes: replanMinutes }),
      });
      setReplanResult(data);
      showBanner("Plan express mis à jour", "info");
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Échec du recalcul", "error");
    } finally {
      setReplanLoading(false);
    }
  };

  const handleAdoptDraft = async (draft: AiDraft, index: number) => {
    setDraftSaving(`${draft.title}-${index}`);
    try {
      const payload = {
        title: draft.title,
        description: draft.description || "",
        priority_eisenhower: draft.priority_eisenhower || "important_not_urgent",
        high_impact: Boolean(draft.high_impact),
        estimated_duration_minutes: draft.estimated_duration_minutes || null,
      };
      const data = await apiFetch<{ id: string } & Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTasks((prev) => [data, ...prev]);
      setAiDrafts((prev) => prev.filter((_, idx) => idx !== index));
      showBanner("Tâche ajoutée depuis l'IA", "info");
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Impossible d'ajouter cette tâche", "error");
    } finally {
      setDraftSaving(null);
    }
  };

  const currentTasks = activeView === "today" ? todayTasks : activeView === "week" ? weekTasks : tasks;

  const renderTasks = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-20 animate-pulse rounded-3xl bg-white/70" />
          ))}
        </div>
      );
    }
    if (tasksError) {
      return (
        <EmptyState
          title="Impossible de charger les tâches"
          message={tasksError}
          actionLabel="Réessayer"
          onAction={refreshTasks}
        />
      );
    }
    if (activeView === "kanban") {
      return (
        <TaskKanbanBoard
          tasks={tasks}
          advanced={mode === "advanced"}
          onStateChange={handleStateChange}
          recentlyCompleted={recentlyCompleted}
        />
      );
    }
    if (activeView === "week") {
      return (
        <WeekView
          tasks={weekTasks}
          advanced={mode === "advanced"}
          onStateChange={handleStateChange}
          recentlyCompleted={recentlyCompleted}
        />
      );
    }
    return (
      <TaskList
        tasks={todayTasks}
        advanced={mode === "advanced"}
        emptyMessage="Aucune tâche pour aujourd'hui. Créez votre première tâche ou décrivez votre journée à l'IA."
        onStateChange={handleStateChange}
        recentlyCompleted={recentlyCompleted}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef6ff,_#f6fbff,_#fdfdfd)] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-8 shadow-sm">
          <div className="flex flex-col gap-8 md:flex-row md:items-center">
            <div className="flex-1 space-y-4">
              <span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                Productivité
              </span>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">MyPlanning</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Votre coach de temps intelligent pour orchestrer Eisenhower, MoSCoW, Pareto, Kanban et Pomodoro. Passez en mode avancé pour piloter l'énergie et les objectifs stratégiques.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
                >
                  Nouvelle tâche
                </button>
                <button
                  onClick={() => setMode((prev) => (prev === "simple" ? "advanced" : "simple"))}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Mode {mode === "simple" ? "avancé" : "simple"}
                </button>
                <button
                  onClick={handlePlanDay}
                  disabled={planLoading}
                  className="inline-flex items-center rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {planLoading ? "Organisation..." : "Organiser ma journée (IA)"}
                </button>
              </div>
              {planResult?.focus?.length ? (
                <p className="text-xs text-emerald-800">
                  {planResult.focus.length} tâche{planResult.focus.length > 1 ? "s" : ""} focus proposées pour aujourd'hui.
                </p>
              ) : (
                <p className="text-xs text-slate-500">Cliquez sur "Organiser ma journée" pour recevoir 3 à 5 tâches phares.</p>
              )}
            </div>
            <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-white/60 bg-white/50 p-6 text-center shadow-inner">
              <span className="text-xs uppercase tracking-wide text-slate-400">Discipline</span>
              <span className="text-3xl font-semibold text-slate-900">{progress}%</span>
              <span className="text-xs text-slate-500">tâches complétées</span>
            </div>
          </div>
        </section>

        {banner && <AlertBanner tone={banner.tone} text={banner.text} onClose={() => setBanner(null)} />}

        <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
          <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {["today", "week", "kanban"].map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view as "today" | "week" | "kanban")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeView === view ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"
                  }`}
                >
                  {view === "today" ? "Aujourd'hui" : view === "week" ? "Semaine" : "Kanban"}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-500">
                {mode === "advanced" ? "Mode avancé : énergie, MoSCoW, Pomodoro" : "Mode simple : focus sur l'essentiel"}
              </span>
            </div>
            {suggestLoading && (
              <div className="mt-4 rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-3 text-xs font-semibold text-sky-700">
                L'IA prépare une proposition de tâches…
              </div>
            )}
            <div className="mt-4" key={activeView}>{renderTasks()}</div>
          </section>

          <div className="space-y-4">
            <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Stats du jour</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center">
                  <p className="text-2xl font-semibold text-slate-900">{tasks.length}</p>
                  <p className="text-xs text-slate-500">tâches actives</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-emerald-50/70 p-4 text-center">
                  <p className="text-2xl font-semibold text-emerald-700">{progress}%</p>
                  <p className="text-xs text-emerald-600">complétées</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-orange-50/70 p-4 text-center">
                  <p className="text-2xl font-semibold text-orange-600">{highImpactCount}</p>
                  <p className="text-xs text-orange-500">impact élevé</p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Assisté par IA</p>
                  <h2 className="text-lg font-semibold text-slate-900">Coaching MyPlanning</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Temps restant (min)</span>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    value={replanMinutes}
                    onChange={(e) => setReplanMinutes(Number(e.target.value) || 15)}
                    className="w-16 rounded-full border border-slate-200 px-3 py-1 focus:border-sky-500 focus:outline-none"
                  />
                  <button
                    onClick={handleReplan}
                    disabled={replanLoading}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 disabled:opacity-60"
                  >
                    {replanLoading ? "Calcul..." : "Plan express"}
                  </button>
                </div>
              </div>
              <label className="mt-4 block text-sm text-slate-600">
                Décrivez votre journée
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="mt-2 h-32 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
                  placeholder="Ex: préparer présentation, appeler la coopérative, finaliser dossier..."
                />
              </label>
              <button
                onClick={handleAiSuggest}
                disabled={suggestLoading}
                className="mt-3 inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {suggestLoading ? "Analyse en cours..." : "Générer des tâches"}
              </button>

              {aiDrafts.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Brouillons IA</p>
                  {aiDrafts.map((draft, idx) => (
                    <div key={`${draft.title}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{draft.priority_eisenhower ? formatPriority(draft.priority_eisenhower) : "Priorité à confirmer"}</span>
                        {draft.high_impact && <span className="text-emerald-600">Impact élevé</span>}
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{draft.title}</p>
                      {draft.description && <p className="text-xs text-slate-500">{draft.description}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        {draft.estimated_duration_minutes && (
                          <span className="text-xs text-slate-500">Durée estimée : {draft.estimated_duration_minutes} min</span>
                        )}
                        <button
                          onClick={() => handleAdoptDraft(draft, idx)}
                          disabled={draftSaving === `${draft.title}-${idx}`}
                          className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {draftSaving === `${draft.title}-${idx}` ? "Ajout..." : "Ajouter"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {planResult && planResult.order.length > 0 && (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-800">
                  <p className="font-semibold">Ordre suggéré</p>
                  <ol className="mt-2 list-decimal pl-5">
                    {planResult.order.map((taskId) => {
                      const task = tasks.find((t) => t.id === taskId);
                      return <li key={taskId}>{task ? task.title : taskId}</li>;
                    })}
                  </ol>
                  {planResult.focus.length > 0 && (
                    <div className="mt-3 space-y-1 text-xs">
                      <p className="font-semibold uppercase tracking-wide">Focus du jour</p>
                      {planResult.focus.map((item) => {
                        const task = tasks.find((t) => t.id === item.task_id);
                        return (
                          <div key={item.task_id} className="flex items-center justify-between">
                            <span>{task ? task.title : item.task_id}</span>
                            {item.reason && <span className="text-emerald-900">{item.reason}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {replanResult && (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-800">
                  <p className="font-semibold">Plan express</p>
                  <ul className="mt-2 space-y-2">
                    {replanResult.recommendations.map((item) => {
                      const task = tasks.find((t) => t.id === item.task_id);
                      return (
                        <li key={item.task_id} className="rounded-xl bg-white/70 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-900">{task ? task.title : item.task_id}</span>
                            {item.suggested_minutes && <span>{item.suggested_minutes} min</span>}
                          </div>
                          {item.reason && <p className="text-xs">{item.reason}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </div>

        <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Maintenance rapide</p>
              <h3 className="text-lg font-semibold text-slate-900">Gardez votre cockpit propre</h3>
            </div>
            <button
              onClick={refreshTasks}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Rafraîchir
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Aucune action de nettoyage nécessaire.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {tasks.slice(0, 3).map((task) => (
                <button
                  key={`del-${task.id}`}
                  onClick={() => handleDelete(task.id)}
                  className="flex flex-col items-start gap-1 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-left text-sm text-red-700 transition hover:border-red-200"
                >
                  <span className="text-xs uppercase tracking-wide text-red-500">Supprimer</span>
                  <span className="font-semibold">{task.title.slice(0, 40)}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={(task) => {
          setTasks((prev) => [task, ...prev]);
          showBanner("Nouvelle tâche ajoutée", "info");
        }}
      />
    </div>
  );
}

function isSameDay(iso?: string | null): boolean {
  if (!iso) return false;
  const target = new Date(iso);
  const today = new Date();
  return (
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate()
  );
}

function isSameWeek(iso?: string | null): boolean {
  if (!iso) return false;
  const target = new Date(iso);
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return target >= monday && target <= sunday;
}

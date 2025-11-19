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

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent_important: "Urgent & important",
  important_not_urgent: "Important mais pas urgent",
  urgent_not_important: "Urgent mais moins important",
  not_urgent_not_important: "Ni urgent ni important",
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
    const raw = await response.text();
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        throw new Error(parsed.detail || parsed.message || parsed.error || "Erreur inconnue");
      }
      throw new Error(parsed || raw || "Impossible de contacter MyPlanning");
    } catch (err) {
      if (err instanceof Error && err.message !== "Unexpected token") {
        throw err;
      }
      throw new Error(raw || "Impossible de contacter MyPlanning");
    }
  }
  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(date.getDate() - ((day + 6) % 7));
  return monday;
}

function sameWeek(a: Date, reference: Date): boolean {
  const monday = startOfWeek(reference);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return a >= monday && a <= sunday;
}

function formatDateLabel(date?: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatTimeLabel(date?: Date | null): string {
  if (!date) return "Libre";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short" });
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });

function AlertBanner({ text, tone, onClose }: { text: string; tone: "info" | "error"; onClose: () => void }) {
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

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
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
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Priorité (Eisenhower)</span>
            <select
              value={form.priority_eisenhower}
              onChange={(event) => setForm((prev) => ({ ...prev, priority_eisenhower: event.target.value as Priority }))}
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
              onChange={(event) => setForm((prev) => ({ ...prev, high_impact: event.target.checked }))}
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
              onChange={(event) =>
                setForm((prev) => ({ ...prev, estimated_duration_minutes: Number(event.target.value) || 0 }))
              }
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Échéance</span>
            <input
              type="datetime-local"
              value={form.due_datetime}
              onChange={(event) => setForm((prev) => ({ ...prev, due_datetime: event.target.value }))}
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

function TaskDetailDrawer({
  task,
  open,
  onClose,
  onStateChange,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onStateChange: (taskId: string, state: KanbanState) => void;
}) {
  if (!task || !open) return null;
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tâche</p>
          <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
        </div>
        <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
          Fermer
        </button>
      </div>
      <div className="space-y-4 overflow-y-auto px-5 py-4 text-sm">
        <p className="text-slate-600">{task.description || "Aucune description"}</p>
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">Catégorie</p>
            <p>{task.category || "-"}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Priorité</p>
            <p>{PRIORITY_LABEL[task.priority_eisenhower]}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Impact</p>
            <p>{task.high_impact ? "Top 20 %" : "Standard"}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Durée</p>
            <p>{task.estimated_duration_minutes ? `${task.estimated_duration_minutes} min` : "Libre"}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Deadline</p>
            <p>{formatDateLabel(parseDate(task.due_datetime))}</p>
          </div>
          {task.energy_level && (
            <div>
              <p className="font-semibold text-slate-700">Énergie</p>
              <p>{task.energy_level}</p>
            </div>
          )}
          {task.moscow && (
            <div>
              <p className="font-semibold text-slate-700">MoSCoW</p>
              <p>{task.moscow}</p>
            </div>
          )}
          {typeof task.pomodoro_estimated === "number" && (
            <div>
              <p className="font-semibold text-slate-700">Pomodoro</p>
              <p>
                {task.pomodoro_done ?? 0}/{task.pomodoro_estimated}
              </p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => onStateChange(task.id, "in_progress")}
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300"
          >
            Passer en cours
          </button>
          <button
            onClick={() => onStateChange(task.id, "done")}
            className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 hover:border-emerald-400"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyPlanningPage() {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [scope, setScope] = useState<"day" | "week">("day");
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
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [impactOnly, setImpactOnly] = useState(false);
  const [showLate, setShowLate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const showBanner = (text: string, tone: "info" | "error" = "info") => setBanner({ text, tone });

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 5000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const refreshTasks = async () => {
    setLoading(true);
    setTasksError(null);
    try {
      const data = await apiFetch<{ items: Task[] }>("/tasks");
      setTasks(data.items);
    } catch (err) {
      setTasksError(err instanceof Error ? err.message : "Impossible de charger les tâches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshTasks();
  }, []);

  const dayTasks = useMemo(() => {
    return tasks.filter((task) => {
      const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
      if (!ref) return false;
      return sameDay(ref, selectedDate);
    });
  }, [tasks, selectedDate]);

  const weekTasks = useMemo(() => {
    return tasks.filter((task) => {
      const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
      if (!ref) return false;
      return sameWeek(ref, selectedDate);
    });
  }, [tasks, selectedDate]);

  const scopedTasks = scope === "day" ? dayTasks : weekTasks;
  const completedCount = scopedTasks.filter((task) => task.kanban_state === "done").length;
  const highImpactCount = scopedTasks.filter((task) => task.high_impact).length;
  const progress = scopedTasks.length ? Math.round((completedCount / scopedTasks.length) * 100) : 0;

  const categories = useMemo(() => {
    const uniques = new Set(tasks.map((task) => task.category).filter(Boolean) as string[]);
    return Array.from(uniques);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let base = [...scopedTasks];
    if (priorityFilter !== "all") base = base.filter((task) => task.priority_eisenhower === priorityFilter);
    if (categoryFilter !== "all") base = base.filter((task) => (task.category || "") === categoryFilter);
    if (impactOnly) base = base.filter((task) => task.high_impact);
    if (showLate) {
      base = base.filter((task) => {
        const due = parseDate(task.due_datetime);
        return due ? due < new Date() && task.kanban_state !== "done" : false;
      });
    }
    return base.sort((a, b) => {
      const dueA = parseDate(a.due_datetime)?.getTime() ?? Number.POSITIVE_INFINITY;
      const dueB = parseDate(b.due_datetime)?.getTime() ?? Number.POSITIVE_INFINITY;
      return dueA - dueB;
    });
  }, [scopedTasks, priorityFilter, impactOnly, showLate, categoryFilter]);

  const timelineSlots = useMemo(() => {
    const slots = Array.from({ length: 13 }).map((_, idx) => 8 + idx);
    return slots.map((hour) => {
      const start = new Date(selectedDate);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(hour + 1, 0, 0, 0);
      const entries = dayTasks.filter((task) => {
        const ref = parseDate(task.start_datetime);
        if (!ref) return false;
        return ref >= start && ref < end;
      });
      return { hour, entries };
    });
  }, [dayTasks, selectedDate]);

  const weeklySnapshot = useMemo(() => {
    const monday = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, idx) => {
      const current = new Date(monday);
      current.setDate(monday.getDate() + idx);
      const items = tasks.filter((task) => {
        const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
        return ref ? sameDay(ref, current) : false;
      });
      const done = items.filter((task) => task.kanban_state === "done").length;
      const percentage = items.length ? Math.round((done / items.length) * 100) : 0;
      return { label: shortDayFormatter.format(current), value: percentage };
    });
  }, [tasks, selectedDate]);

  const handleStateChange = async (taskId: string, state: KanbanState) => {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ kanban_state: state }),
      });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, kanban_state: state } : task)));
      showBanner(state === "done" ? "Tâche complétée" : "Tâche mise à jour");
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Action impossible", "error");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      showBanner("Tâche supprimée");
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
      showBanner("Ordre prioritaire mis à jour");
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
      showBanner("Plan express mis à jour");
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Échec du plan express", "error");
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
      showBanner("Tâche ajoutée depuis l'IA");
    } catch (err) {
      showBanner(err instanceof Error ? err.message : "Impossible d'ajouter cette tâche", "error");
    } finally {
      setDraftSaving(null);
    }
  };

  const handleDateChange = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta);
      return next;
    });
  };

  const renderTaskTable = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      );
    }
    if (tasksError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center justify-between">
            <p>{tasksError}</p>
            <button onClick={refreshTasks} className="text-xs font-semibold underline">
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    if (!filteredTasks.length) {
      return <EmptyState title="Aucune tâche" message="Activez un filtre ou ajoutez vos premières tâches." />;
    }

    const columns = [
      "Titre",
      "Catégorie",
      "Priorité",
      "Impact",
      "Durée",
      "Deadline",
      ...(mode === "advanced" ? ["Énergie", "MoSCoW", "Pomodoro"] : []),
      "État",
      "",
    ];

    return (
      <div className="rounded-3xl border border-slate-200 bg-white">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">✔</th>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white text-slate-700">
              {filteredTasks.map((task) => {
                const deadline = formatDateLabel(parseDate(task.due_datetime));
                return (
                  <tr
                    key={task.id}
                    className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={task.kanban_state === "done"}
                        onChange={(event) => {
                          event.stopPropagation();
                          handleStateChange(task.id, event.target.checked ? "done" : "todo");
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-semibold">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {task.category ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{task.category}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[task.priority_eisenhower]}`}>
                        {PRIORITY_LABEL[task.priority_eisenhower]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {task.high_impact ? (
                        <span className="flex items-center gap-1 text-amber-600">
                          <span className="text-lg">⚡</span> Pareto 20 %
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{task.estimated_duration_minutes ? `${task.estimated_duration_minutes} min` : "—"}</td>
                    <td className="px-4 py-2">{deadline}</td>
                    {mode === "advanced" && (
                      <>
                        <td className="px-4 py-2 text-xs text-slate-500">{task.energy_level || "—"}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">{task.moscow || "—"}</td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {typeof task.pomodoro_estimated === "number"
                            ? `${task.pomodoro_done ?? 0}/${task.pomodoro_estimated}`
                            : "—"}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {task.kanban_state === "todo" ? "À faire" : task.kanban_state === "in_progress" ? "En cours" : "Terminé"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStateChange(task.id, "in_progress");
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-slate-300"
                        >
                          Démarrer
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStateChange(task.id, "done");
                          }}
                          className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-600 hover:border-emerald-400"
                        >
                          Terminer
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="rounded-full border border-red-200 px-3 py-1 text-red-500 hover:border-red-400"
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-[26px] border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/60 p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.4fr,1.2fr,1.2fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">MyPlanning</p>
              <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord de votre temps</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDateChange(-1)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:border-slate-300"
              >
                ←
              </button>
              <input
                type="date"
                value={new Date(selectedDate).toISOString().slice(0, 10)}
                onChange={(event) => {
                  const next = new Date(event.target.value);
                  if (!Number.isNaN(next.getTime())) setSelectedDate(next);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              />
              <button
                onClick={() => handleDateChange(1)}
                className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:border-slate-300"
              >
                →
              </button>
              <div className="ml-2 flex gap-2">
                <button
                  onClick={() => setScope("day")}
                  className={`rounded-full px-4 py-1 text-xs font-semibold ${
                    scope === "day" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => setScope("week")}
                  className={`rounded-full px-4 py-1 text-xs font-semibold ${
                    scope === "week" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600"
                  }`}
                >
                  Semaine
                </button>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setDrawerOpen(true)}
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Nouvelle tâche
              </button>
              <button
                onClick={handlePlanDay}
                disabled={planLoading}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {planLoading ? "Organisation..." : "Organiser ma journée (IA)"}
              </button>
              <button
                onClick={() => setMode((prev) => (prev === "simple" ? "advanced" : "simple"))}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Mode {mode === "simple" ? "avancé" : "simple"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Tâches actives</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{scopedTasks.length}</p>
            <p className="text-xs text-slate-500">{dayFormatter.format(selectedDate)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">% complétées</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{progress}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Impact élevé</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{highImpactCount}</p>
            <p className="text-xs text-slate-500">Pareto 20 %</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Focus IA</p>
            <p className="mt-2 text-base text-slate-700">
              {planResult?.focus?.length ? `${planResult.focus.length} tâches focus proposées` : "Cliquez sur Organiser"}
            </p>
          </div>
        </div>

        {banner && <AlertBanner tone={banner.tone} text={banner.text} onClose={() => setBanner(null)} />}

        <div className="grid gap-4 lg:grid-cols-[3fr,2fr]">
          <div className="space-y-4">
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Planning du jour</p>
                  <h2 className="text-lg font-semibold text-slate-900">{dayFormatter.format(selectedDate)}</h2>
                </div>
                <span className="text-xs text-slate-500">Nous sommes ici : {formatTimeLabel(new Date())}</span>
              </div>
              <div className="mt-4 max-h-[260px] space-y-3 overflow-y-auto pr-2">
                {timelineSlots.every((slot) => slot.entries.length === 0) ? (
                  <EmptyState
                    title="Aucune tâche planifiée"
                    message="Utilisez Organiser ma journée (IA) ou ajoutez une tâche depuis la liste."
                  />
                ) : (
                  timelineSlots.map((slot) => (
                    <div key={slot.hour} className="flex gap-3 text-xs text-slate-500">
                      <div className="w-16 text-right font-semibold text-slate-700">{`${slot.hour}h`}</div>
                      <div className="flex-1 rounded-3xl border border-slate-100 bg-slate-50/60 p-3">
                        {slot.entries.length === 0 ? (
                          <p className="text-[11px] text-slate-400">Créneau libre</p>
                        ) : (
                          slot.entries.map((task) => (
                            <div key={task.id} className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                              <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                              <div className="mt-1 flex gap-2 text-[11px] text-slate-500">
                                <span>{formatTimeLabel(parseDate(task.start_datetime))}</span>
                                <span>·</span>
                                <span>{task.estimated_duration_minutes ? `${task.estimated_duration_minutes} min` : "Libre"}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Pilotage des tâches</p>
                  <h2 className="text-lg font-semibold text-slate-900">{scope === "day" ? "Journée" : "Semaine"}</h2>
                </div>
                <div className="ml-auto flex flex-wrap gap-2 text-xs">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="rounded-full border border-slate-200 px-3 py-1"
                  >
                    <option value="all">Toutes catégories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
                    className="rounded-full border border-slate-200 px-3 py-1"
                  >
                    <option value="all">Toutes priorités</option>
                    <option value="urgent_important">Urgent & important</option>
                    <option value="important_not_urgent">Important mais pas urgent</option>
                    <option value="urgent_not_important">Urgent moins important</option>
                    <option value="not_urgent_not_important">Moins prioritaires</option>
                  </select>
                  <button
                    onClick={() => setImpactOnly((prev) => !prev)}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      impactOnly ? "bg-amber-500 text-white" : "border border-slate-200 text-slate-600"
                    }`}
                  >
                    Impact élevé
                  </button>
                  <button
                    onClick={() => setShowLate((prev) => !prev)}
                    className={`rounded-full px-3 py-1 font-semibold ${
                      showLate ? "bg-red-500 text-white" : "border border-slate-200 text-slate-600"
                    }`}
                  >
                    En retard
                  </button>
                </div>
              </div>
              <div className="mt-4">{renderTaskTable()}</div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Assisté par IA</p>
                  <h2 className="text-lg font-semibold text-slate-900">Coaching MyPlanning</h2>
                </div>
                <span className="text-xs text-slate-500">Décrivez votre journée</span>
              </div>
              <textarea
                value={aiText}
                onChange={(event) => setAiText(event.target.value)}
                className="mt-3 h-28 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="Ex: préparer présentation, appeler la coopérative, finaliser dossier..."
              />
              <button
                onClick={handleAiSuggest}
                disabled={suggestLoading}
                className="mt-3 w-full rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {suggestLoading ? "Analyse..." : "Générer des tâches"}
              </button>
              {aiDrafts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {aiDrafts.map((draft, idx) => (
                    <div key={`${draft.title}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{draft.priority_eisenhower ? PRIORITY_LABEL[draft.priority_eisenhower] : "Priorité à confirmer"}</span>
                        {draft.high_impact && <span className="text-emerald-600">Impact élevé</span>}
                      </div>
                      <p className="font-semibold text-slate-900">{draft.title}</p>
                      {draft.description && <p className="text-xs text-slate-500">{draft.description}</p>}
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{draft.estimated_duration_minutes ? `${draft.estimated_duration_minutes} min` : "Libre"}</span>
                        <button
                          onClick={() => handleAdoptDraft(draft, idx)}
                          disabled={draftSaving === `${draft.title}-${idx}`}
                          className="rounded-full bg-emerald-600 px-3 py-1 text-white"
                        >
                          {draftSaving === `${draft.title}-${idx}` ? "Ajout..." : "Ajouter"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Plan express</p>
                  <h2 className="text-lg font-semibold text-slate-900">Optimiser un créneau</h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Temps restant</span>
                  <input
                    type="number"
                    min={15}
                    step={5}
                    value={replanMinutes}
                    onChange={(event) => setReplanMinutes(Number(event.target.value) || 15)}
                    className="w-16 rounded-full border border-slate-200 px-3 py-1 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleReplan}
                disabled={replanLoading}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-50"
              >
                {replanLoading ? "Calcul..." : "Lancer"}
              </button>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {replanResult?.recommendations?.length ? (
                  replanResult.recommendations.map((item) => {
                    const task = tasks.find((t) => t.id === item.task_id);
                    return (
                      <div key={item.task_id} className="rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-900">{task ? task.title : item.task_id}</span>
                          {item.suggested_minutes && <span>{item.suggested_minutes} min</span>}
                        </div>
                        {item.reason && <p className="text-xs text-amber-800">{item.reason}</p>}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">Lancez un plan express pour prioriser un créneau.</p>
                )}
              </div>
            </section>

            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Discipline semaine</p>
              <div className="mt-4 space-y-3">
                {weeklySnapshot.map((entry) => (
                  <div key={entry.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{entry.label}</span>
                      <span>{entry.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${entry.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Maintenance rapide</p>
              <h3 className="text-lg font-semibold text-slate-900">Gardez votre cockpit propre</h3>
            </div>
            <button onClick={refreshTasks} className="text-xs font-semibold text-slate-500 hover:text-slate-700">
              Rafraîchir
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucune action à mener pour l'instant.</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {tasks.slice(0, 3).map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleDelete(task.id)}
                  className="rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3 text-left text-sm text-red-700 transition hover:border-red-200"
                >
                  <span className="text-xs uppercase tracking-wide text-red-500">Supprimer</span>
                  <p className="font-semibold">{task.title.slice(0, 50)}</p>
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
          showBanner("Nouvelle tâche ajoutée");
        }}
      />
      <TaskDetailDrawer task={selectedTask} open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} onStateChange={handleStateChange} />
    </div>
  );
}

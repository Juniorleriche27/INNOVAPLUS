"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { INNOVA_API_BASE } from "@/lib/env";

// Ensure the base does not contain duplicated /innova/api segments (older envs or caches)
const CLEAN_API_BASE = INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api");
const API_BASE = `${CLEAN_API_BASE}/myplanning`;

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
};

type AiDraft = {
  title: string;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  priority_eisenhower?: Priority | null;
  high_impact?: boolean | null;
};

type SidebarItem = {
  id: string;
  label: string;
};

const VIEWS: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard quotidien" },
  { id: "weekly", label: "Vue hebdomadaire" },
  { id: "matrix", label: "Matrice temps / tâches" },
  { id: "stats", label: "Stats & graphiques" },
];

const ACTIONS: SidebarItem[] = [
  { id: "create", label: "Nouvelle tâche" },
  { id: "manage", label: "Gérer les tâches" },
  { id: "coaching", label: "Coaching IA" },
  { id: "settings", label: "Paramètres IA" },
];

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent_important: "Urgent & important",
  important_not_urgent: "Important mais pas urgent",
  urgent_not_important: "Urgent moins important",
  not_urgent_not_important: "Ni urgent ni important",
};

const KANBAN_LABEL: Record<KanbanState, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    let message = await response.text();
    try {
      const parsed = message ? JSON.parse(message) : null;
      if (parsed && typeof parsed === "object") {
        if (Array.isArray((parsed as any).detail)) {
          message = (parsed as any).detail
            .map((item: any) => item.msg || item.message || item.detail || JSON.stringify(item))
            .join(" / ");
        } else {
          message = (parsed as any).detail || (parsed as any).message || message;
        }
      }
    } catch {}
    throw new Error(message || "Impossible de contacter MyPlanning");
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
  const monday = new Date(date);
  const day = monday.getDay();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((day + 6) % 7));
  return monday;
}

function formatDateInputValue(date: Date): string {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().split("T")[0];
}

function formatDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.length > 16 ? value.slice(0, 16) : value;
  }
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function friendlyError(message: string): string {
  if (/not found/i.test(message)) return "Aucune donnée disponible pour l'instant.";
  return message;
}

function normalizeTaskPayload(values: Partial<Task>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...values };
  const optionalStrings = ["category", "description", "comments", "linked_goal", "moscow", "status", "energy_level"];
  for (const key of optionalStrings) {
    if (typeof payload[key] === "string" && (payload[key] as string).trim() === "") {
      delete payload[key];
    }
  }
  if (!payload.due_datetime) delete payload.due_datetime;
  if (!payload.start_datetime) delete payload.start_datetime;
  if (!payload.estimated_duration_minutes) delete payload.estimated_duration_minutes;
  return payload;
}

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short" });
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function MyPlanningPage(): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLoadError, setTaskLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [formValues, setFormValues] = useState<Partial<Task>>({ priority_eisenhower: "important_not_urgent", high_impact: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | KanbanState>("all");
  const [aiText, setAiText] = useState("");
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [addingDraftIndex, setAddingDraftIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    setTaskLoadError(null);
    try {
      const data = await apiFetch<{ items: Task[] }>("/tasks");
      setTasks(data.items);
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible de charger les tâches";
      setTaskLoadError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(tasks.map((task) => task.category).filter(Boolean) as string[]);
    return Array.from(set);
  }, [tasks]);

  const dayTasks = useMemo(() => {
    return tasks.filter((task) => {
      const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
      return ref ? sameDay(ref, selectedDate) : false;
    });
  }, [tasks, selectedDate]);

  const weeklyDiscipline = useMemo(() => {
    const base = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(base);
      day.setDate(base.getDate() + idx);
      const list = tasks.filter((task) => {
        const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
        return ref ? sameDay(ref, day) : false;
      });
      const done = list.filter((task) => task.kanban_state === "done").length;
      const completion = list.length ? Math.round((done / list.length) * 100) : 0;
      return { dayLabel: shortDayFormatter.format(day), completion };
    });
  }, [tasks, selectedDate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterCategory !== "all" && (task.category || "") !== filterCategory) return false;
      if (filterPriority !== "all" && task.priority_eisenhower !== filterPriority) return false;
      if (filterStatus !== "all" && task.kanban_state !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterCategory, filterPriority, filterStatus]);

  const sortedTasks = useMemo(() => {
    const copy = [...filteredTasks];
    copy.sort((a, b) => {
      // High impact first
      if (a.high_impact !== b.high_impact) return a.high_impact ? -1 : 1;
      // Earlier due date first
      const aDate = parseDate(a.due_datetime)?.getTime() || Number.MAX_SAFE_INTEGER;
      const bDate = parseDate(b.due_datetime)?.getTime() || Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
      // Keep stable-ish by creation order (already sorted server-side; fallback title)
      return a.title.localeCompare(b.title);
    });
    return copy;
  }, [filteredTasks]);

  const managerStats = useMemo(() => {
    const done = filteredTasks.filter((task) => task.kanban_state === "done").length;
    const highImpact = filteredTasks.filter((task) => task.high_impact).length;
    const late = filteredTasks.filter((task) => {
      const due = parseDate(task.due_datetime);
      return due ? due.getTime() < Date.now() && task.kanban_state !== "done" : false;
    }).length;
    return { total: filteredTasks.length, done, highImpact, late };
  }, [filteredTasks]);

  const dateInputValue = useMemo(() => formatDateInputValue(selectedDate), [selectedDate]);

  const shiftSelectedDate = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta);
      return next;
    });
  };

  const resetForm = () => {
    setFormValues({ priority_eisenhower: "important_not_urgent", high_impact: false });
    setEditingId(null);
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!formValues.title) {
      setBanner({ type: "error", message: "Le titre est obligatoire." });
      return;
    }
    const payload = normalizeTaskPayload(formValues);
    try {
      if (editingId) {
        await apiFetch(`/tasks/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setTasks((prev) => prev.map((task) => (task.id === editingId ? { ...task, ...payload } : task)));
        setBanner({ type: "success", message: "Tâche mise à jour." });
      } else {
        const task = await apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });
        setTasks((prev) => [task, ...prev]);
        setBanner({ type: "success", message: "Tâche créée." });
      }
      resetForm();
      setActiveSection("dashboard");
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible d'enregistrer la tâche";
      setBanner({ type: "error", message });
    }
  };

  const handleStateChange = async (taskId: string, state: KanbanState) => {
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ kanban_state: state }) });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, kanban_state: state } : task)));
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Action impossible";
      setBanner({ type: "error", message });
    }
  };

  const handleComplete = async (taskId: string) => {
    await handleStateChange(taskId, "done");
  };

  const handleAiSuggest = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setBanner(null);
    try {
      const res = await apiFetch<{ drafts: AiDraft[] }>("/ai/suggest-tasks", { method: "POST", body: JSON.stringify({ free_text: aiText }) });
      setAiDrafts(res.drafts);
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Échec de l'assistant";
      setBanner({ type: "error", message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddDraft = async (draft: AiDraft, index: number) => {
    if (!draft.title) return;
    setAddingDraftIndex(index);
    try {
      const payload = {
        title: draft.title,
        description: draft.description || "",
        priority_eisenhower: draft.priority_eisenhower || "important_not_urgent",
        high_impact: Boolean(draft.high_impact),
        estimated_duration_minutes: draft.estimated_duration_minutes || undefined,
        kanban_state: "todo",
      };
      const task = await apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });
      setTasks((prev) => [task, ...prev]);
      setBanner({ type: "success", message: "Tâche ajoutée depuis l'IA." });
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible d'ajouter cette tâche";
      setBanner({ type: "error", message });
    } finally {
      setAddingDraftIndex(null);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Tâches actives</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dayTasks.length}</p>
          <p className="text-xs text-slate-500">Aujourd'hui</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Complétées</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {dayTasks.length ? Math.round((dayTasks.filter((task) => task.kanban_state === "done").length / dayTasks.length) * 100) : 0}%
          </p>
          <p className="text-xs text-slate-500">Progression</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Impact élevé</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dayTasks.filter((task) => task.high_impact).length}</p>
          <p className="text-xs text-slate-500">Pareto 20 %</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Pomodoro estimés</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {dayTasks.reduce((sum, task) => sum + (task.pomodoro_estimated || 0), 0)}
          </p>
          <p className="text-xs text-slate-500">Sessions prévues</p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>Planning du jour</span>
            <span>Nous sommes ici · {timeFormatter.format(new Date())}</span>
          </div>
          <div className="mt-4 space-y-3 text-xs text-slate-500">
            {Array.from({ length: 12 }).map((_, idx) => 8 + idx).map((hour) => {
              const slot = dayTasks.filter((task) => {
                const ref = parseDate(task.start_datetime);
                return ref ? ref.getHours() === hour : false;
              });
              return (
                <div key={hour} className="flex gap-3">
                  <div className="w-16 text-right text-[11px] font-semibold text-slate-400">{hour}h</div>
                  <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                    {slot.length === 0 ? (
                      <p className="text-[11px] text-slate-400">Créneau libre</p>
                    ) : (
                      slot.map((task) => (
                        <div key={task.id} className="mb-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 last:mb-0">
                          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                          <p className="text-[11px] text-slate-500">{task.estimated_duration_minutes || 0} min</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Discipline semaine</p>
          <div className="mt-4 space-y-3">
            {weeklyDiscipline.map((entry) => (
              <div key={entry.dayLabel}>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{entry.dayLabel}</span>
                  <span>{entry.completion}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${entry.completion}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTaskTable = () => {
    const Filters = (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes catégories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value as typeof filterPriority)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes priorités</option>
          <option value="urgent_important">Urgent & important</option>
          <option value="important_not_urgent">Important mais pas urgent</option>
          <option value="urgent_not_important">Urgent moins important</option>
          <option value="not_urgent_not_important">Secondaire</option>
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as typeof filterStatus)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Tous statuts</option>
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
        </select>
        <button onClick={() => void loadTasks()} className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-600">
          Recharger
        </button>
      </div>
    );

    if (loading) {
      return (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Chargement des tâches…</span>
            {Filters}
          </div>
        </div>
      );
    }
    if (taskLoadError) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{taskLoadError}</span>
            <button onClick={() => void loadTasks()} className="rounded-full border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700">
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    if (!sortedTasks.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center text-sm text-slate-500">
          <div className="flex flex-col gap-2 text-center">
            <p>Aucune tâche pour ce filtre. Créez une nouvelle tâche ou ajustez vos filtres.</p>
            <div className="flex justify-center gap-2 text-xs">{Filters}</div>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{sortedTasks.length} tâches</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">{managerStats.done} terminées</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{managerStats.late} en retard</span>
          </div>
          {Filters}
        </div>
        <div className="max-h-[580px] overflow-auto">
          <table className="min-w-full text-sm text-slate-600">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase text-slate-400 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <tr>
                <th className="px-4 py-3 text-left">✓</th>
                <th className="px-4 py-3 text-left">Titre</th>
                <th className="px-4 py-3 text-left">Catégorie</th>
                <th className="px-4 py-3 text-left">Priorité</th>
                <th className="px-4 py-3 text-left">Impact</th>
                <th className="px-4 py-3 text-left">Durée</th>
                <th className="px-4 py-3 text-left">Échéance</th>
                <th className="px-4 py-3 text-left">État</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTasks.map((task) => {
                const due = task.due_datetime ? dayFormatter.format(new Date(task.due_datetime)) : "—";
                const dueMs = parseDate(task.due_datetime)?.getTime();
                const late = dueMs ? dueMs < Date.now() && task.kanban_state !== "done" : false;
                return (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={task.kanban_state === "done"}
                        onChange={(event) => handleStateChange(task.id, event.target.checked ? "done" : "todo")}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{task.title}</span>
                        {task.description && <span className="text-[11px] text-slate-500 line-clamp-2">{task.description}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {task.category ? <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{task.category}</span> : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">{PRIORITY_LABEL[task.priority_eisenhower]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${task.high_impact ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {task.high_impact ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{task.estimated_duration_minutes ? `${task.estimated_duration_minutes} min` : "—"}</td>
                    <td className={`px-4 py-3 text-xs ${late ? "font-semibold text-amber-600" : "text-slate-500"}`}>{due}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                      <select
                        value={task.kanban_state}
                        onChange={(event) => handleStateChange(task.id, event.target.value as KanbanState)}
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs"
                      >
                        <option value="todo">À faire</option>
                        <option value="in_progress">En cours</option>
                        <option value="done">Terminé</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right text-xs">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(task.id);
                            setFormValues(task);
                            setActiveSection("create");
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-sky-200 hover:text-sky-700"
                        >
                          Modifier
                        </button>
                        <button onClick={() => handleComplete(task.id)} className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:border-emerald-300">
                          Terminer
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

  const renderManage = () => (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{managerStats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <p className="text-xs uppercase text-emerald-700">Terminées</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{managerStats.done}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <p className="text-xs uppercase text-amber-700">En retard</p>
          <p className="mt-1 text-2xl font-semibold text-amber-800">{managerStats.late}</p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4 shadow-sm">
          <p className="text-xs uppercase text-sky-700">Impact élevé</p>
          <p className="mt-1 text-2xl font-semibold text-sky-800">{managerStats.highImpact}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSection("create")}
            className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white shadow hover:bg-slate-800"
          >
            + Nouvelle tâche
          </button>
          <button
            onClick={() => void loadTasks()}
            className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 hover:border-sky-200 hover:text-sky-700"
          >
            Rafraîchir la liste
          </button>
        </div>
        <p className="text-xs text-slate-500">Vue tableau — optimisée pour la saisie rapide</p>
      </div>
      {renderTaskTable()}
    </div>
  );

  const renderCreateForm = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{editingId ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submitForm}>
        <label className="text-sm text-slate-600">
          Titre
          <input
            required
            value={formValues.title || ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          Catégorie
          <input
            value={formValues.category || ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, category: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          Priorité (Eisenhower)
          <select
            value={formValues.priority_eisenhower || "important_not_urgent"}
            onChange={(event) => setFormValues((prev) => ({ ...prev, priority_eisenhower: event.target.value as Priority }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="urgent_important">Urgent & important</option>
            <option value="important_not_urgent">Important mais pas urgent</option>
            <option value="urgent_not_important">Urgent moins important</option>
            <option value="not_urgent_not_important">Ni urgent ni important</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Impact élevé
          <select
            value={formValues.high_impact ? "oui" : "non"}
            onChange={(event) => setFormValues((prev) => ({ ...prev, high_impact: event.target.value === "oui" }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Durée estimée (min)
          <input
            type="number"
            min={5}
            value={formValues.estimated_duration_minutes ?? ""}
            onChange={(event) =>
              setFormValues((prev) => ({
                ...prev,
                estimated_duration_minutes: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          Deadline
          <input
            type="datetime-local"
            value={formatDateTimeLocal(formValues.due_datetime)}
            onChange={(event) => setFormValues((prev) => ({ ...prev, due_datetime: event.target.value || undefined }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600 md:col-span-2">
          Commentaires
          <textarea
            rows={4}
            value={formValues.comments || ""}
            onChange={(event) => setFormValues((prev) => ({ ...prev, comments: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </label>
        <div className="flex gap-3 md:col-span-2">
          <button type="submit" className="rounded-full bg-sky-600 px-4 py-2 font-semibold text-white">
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setActiveSection("dashboard");
            }}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-500"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );

  const renderCoaching = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Coaching MyPlanning</h2>
      <textarea
        value={aiText}
        onChange={(event) => setAiText(event.target.value)}
        placeholder="Décrivez votre journée..."
        className="mt-3 h-32 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
      />
      <button
        onClick={handleAiSuggest}
        disabled={aiLoading}
        className="mt-3 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {aiLoading ? "Analyse en cours..." : "Générer des tâches"}
      </button>
      {aiDrafts.length > 0 && (
        <div className="mt-4 space-y-2 text-sm">
          {aiDrafts.map((draft, idx) => (
            <div key={`${draft.title}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{draft.priority_eisenhower ? PRIORITY_LABEL[draft.priority_eisenhower] : "Priorité"}</span>
                {draft.high_impact && <span className="text-emerald-600">Impact élevé</span>}
              </div>
              <p className="font-semibold text-slate-900">{draft.title}</p>
              {draft.description && <p className="text-xs text-slate-500">{draft.description}</p>}
              <div className="mt-2 text-right">
                <button
                  onClick={() => void handleAddDraft(draft, idx)}
                  disabled={addingDraftIndex === idx}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-60"
                >
                  {addingDraftIndex === idx ? "Ajout..." : "Ajouter à mes tâches"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPlaceholder = () => {
    const label = VIEWS.concat(ACTIONS).find((item) => item.id === activeSection)?.label || "Section";
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center text-sm text-slate-500">
        <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
        <p className="mt-2">Disponible prochainement.</p>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "create":
        return renderCreateForm();
      case "manage":
        return renderManage();
      case "coaching":
        return renderCoaching();
      default:
        return renderPlaceholder();
    }
  };

  const sidebar = (
    <aside className="flex h-full w-64 min-w-[240px] flex-col gap-6 border-r border-slate-200 bg-white/95 p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">MyPlanning</p>
        <p className="text-lg font-semibold text-slate-900">Cockpit</p>
      </div>
      <nav className="space-y-6 text-sm font-semibold">
        <div>
          <p className="text-xs uppercase text-slate-400">Vues</p>
          <div className="mt-2 space-y-2">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full rounded-2xl px-4 py-2 text-left transition ${activeSection === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Actions</p>
          <div className="mt-2 space-y-2">
            {ACTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full rounded-2xl px-4 py-2 text-left transition ${activeSection === item.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 flex w-full overflow-hidden bg-slate-100"
    : "flex h-[calc(100vh-90px)] w-full flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl";

  return (
    <div className={containerClasses}>
      {sidebar}
      <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm text-slate-600 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{VIEWS.find((item) => item.id === activeSection)?.label || "MyPlanning"}</p>
            <p className="text-lg font-semibold text-slate-900">{dayFormatter.format(selectedDate)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => shiftSelectedDate(-1)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              ← Jour précédent
            </button>
            <input
              type="date"
              value={dateInputValue}
              onChange={(event) => {
                const next = new Date(event.target.value);
                if (!Number.isNaN(next.getTime())) setSelectedDate(next);
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs"
            />
            <button
              onClick={() => shiftSelectedDate(1)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Jour suivant →
            </button>
            <button
              onClick={() => setActiveSection("coaching")}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
            >
              Organiser ma journée (IA)
            </button>
            <button
              onClick={() => setIsFullscreen((value) => !value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
            >
              {isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {banner && (
            <div
              className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                banner.type === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {banner.message}
            </div>
          )}
          {renderSection()}
        </div>
      </main>
    </div>
  );
}

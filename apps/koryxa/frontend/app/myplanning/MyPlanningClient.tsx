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
type TaskSource = "manual" | "ia";
type PeriodFilter = "all" | "today" | "last7" | "last30";

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
  completed_at?: string | null;
  linked_goal?: string | null;
  moscow?: string | null;
  status?: string | null;
  energy_level?: string | null;
  pomodoro_estimated?: number | null;
  pomodoro_done?: number | null;
  comments?: string | null;
  source?: TaskSource | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type AiDraft = {
  title: string;
  description?: string | null;
  estimated_duration_minutes?: number | null;
  priority_eisenhower?: Priority | null;
  high_impact?: boolean | null;
  category?: string | null;
  due_datetime?: string | null;
};

type SidebarItem = { id: string; label: string; icon?: string };

const VIEWS: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard quotidien", icon: "📅" },
  { id: "weekly", label: "Vue hebdomadaire", icon: "🗓️" },
  { id: "matrix", label: "Matrice temps / tâches", icon: "🪧" },
  { id: "stats", label: "Stats & graphiques", icon: "📈" },
];

const ACTIONS: SidebarItem[] = [
  { id: "create", label: "Nouvelle tâche", icon: "➕" },
  { id: "manage", label: "Gérer les tâches", icon: "📋" },
  { id: "coaching", label: "Coaching IA", icon: "🤖" },
  { id: "settings", label: "Paramètres IA", icon: "⚙️" },
];

const PRIORITY_LABEL: Record<Priority, string> = {
  urgent_important: "Urgent & important",
  important_not_urgent: "Important mais pas urgent",
  urgent_not_important: "Urgent moins important",
  not_urgent_not_important: "Ni urgent ni important",
};

const SOURCE_LABEL: Record<TaskSource, string> = {
  manual: "Manuel",
  ia: "IA",
};

function hasHour(text: string): boolean {
  return /\b([01]?\d|2[0-3])h/.test(text);
}

function computePriority(title: string, description?: string | null): Priority {
  const txt = `${title} ${description || ""}`.toLowerCase();
  const hour = hasHour(txt);
  const urgentKeywords = ["rendez", "rdv", "réunion", "formation", "cours", "examen", "entretien", "médec", "facture", "payer", "deadline"];
  const importantKeywords = ["projet", "koryxa", "travail", "réviser", "étude", "budget", "finance", "sport", "santé", "dormir", "préparer", "organisation"];

  if (hour && urgentKeywords.some((k) => txt.includes(k))) return "urgent_important";
  if (hour) return "urgent_not_important";
  if (importantKeywords.some((k) => txt.includes(k))) return "important_not_urgent";
  return "not_urgent_not_important";
}

function computeImpact(title: string, description?: string | null): boolean {
  const txt = `${title} ${description || ""}`.toLowerCase();
  const impactKeywords = ["projet", "koryxa", "travail", "réviser", "étude", "formation", "certification", "budget", "finance", "sport", "santé", "préparer", "objectif", "dlci", "d-clic"];
  return impactKeywords.some((k) => txt.includes(k));
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    let message = await response.text();
    try {
      const parsed: unknown = message ? JSON.parse(message) : null;
      if (parsed && typeof parsed === "object") {
        const detail = (parsed as { detail?: unknown; message?: string }).detail;
        if (Array.isArray(detail)) {
          message = detail
            .map((item) => {
              if (typeof item === "object" && item) {
                const entry = item as { msg?: string; message?: string; detail?: string };
                return entry.msg || entry.message || entry.detail || JSON.stringify(entry);
              }
              return String(item);
            })
            .join(" / ");
        } else {
          const entry = parsed as { detail?: string; message?: string };
          message = entry.detail || entry.message || message;
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

function toIsoDate(date: Date): string {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
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
  if (!payload.completed_at) delete payload.completed_at;
  if (!payload.source) delete payload.source;
  return payload;
}

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short" });
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function MyPlanningClient(): JSX.Element {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLoadError, setTaskLoadError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string>("dashboard");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [formValues, setFormValues] = useState<Partial<Task>>({ priority_eisenhower: "important_not_urgent", high_impact: false, source: "manual" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | KanbanState>("all");
  const [filterSource, setFilterSource] = useState<"all" | TaskSource>("all");
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>("all");
  const [aiText, setAiText] = useState("");
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [addingDraftIndex, setAddingDraftIndex] = useState<number | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);
  const [addedDrafts, setAddedDrafts] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showCoachingGuide, setShowCoachingGuide] = useState(true);
  const [aiSummary, setAiSummary] = useState<{ total: number; counts: Record<Priority, number>; highImpact: number } | null>(null);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

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

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("myplanning.sidebar") : null;
    if (saved) setIsSidebarCollapsed(saved === "collapsed");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("myplanning.sidebar", isSidebarCollapsed ? "collapsed" : "open");
    }
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hideGuide = window.localStorage.getItem("myplanning.coaching.guide");
      if (hideGuide === "hidden") setShowCoachingGuide(false);
    }
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

  const weeklyTasks = useMemo(() => {
    const base = startOfWeek(selectedDate);
    return Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(base);
      day.setDate(base.getDate() + idx);
      const list = tasks.filter((task) => {
        const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
        return ref ? sameDay(ref, day) : false;
      });
      return { day, list };
    });
  }, [tasks, selectedDate]);

  const dateInputValue = useMemo(() => formatDateInputValue(selectedDate), [selectedDate]);

  const shiftSelectedDate = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + delta);
      return next;
    });
  };

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const isInPeriod = (task: Task) => {
      if (filterPeriod === "all") return true;
      const ref = parseDate(task.due_datetime) || parseDate(task.start_datetime) || parseDate(task.created_at);
      if (!ref) return false;
      if (filterPeriod === "today") return sameDay(ref, selectedDate);
      const diffDays = (now.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
      if (filterPeriod === "last7") return diffDays <= 7;
      if (filterPeriod === "last30") return diffDays <= 30;
      return true;
    };
    return tasks.filter((task) => {
      if (filterCategory !== "all" && (task.category || "") !== filterCategory) return false;
      if (filterPriority !== "all" && task.priority_eisenhower !== filterPriority) return false;
      if (filterStatus !== "all" && task.kanban_state !== filterStatus) return false;
      if (filterSource !== "all" && (task.source || "manual") !== filterSource) return false;
      if (!isInPeriod(task)) return false;
      return true;
    });
  }, [tasks, filterCategory, filterPriority, filterStatus, filterSource, filterPeriod, selectedDate]);

  const sortedTasks = useMemo(() => {
    const copy = [...filteredTasks];
    copy.sort((a, b) => {
      if (a.high_impact !== b.high_impact) return a.high_impact ? -1 : 1;
      const aDate = parseDate(a.due_datetime)?.getTime() || Number.MAX_SAFE_INTEGER;
      const bDate = parseDate(b.due_datetime)?.getTime() || Number.MAX_SAFE_INTEGER;
      if (aDate !== bDate) return aDate - bDate;
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

  const completionDate = (task: Task): Date | null => parseDate(task.completed_at) || (task.kanban_state === "done" ? parseDate(task.updated_at) : null);

  const statsLast7 = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 6);
    const createdCount = tasks.filter((t) => {
      const created = parseDate(t.created_at);
      return created && created >= start && created <= today;
    }).length;
    const completed = tasks.filter((t) => {
      const doneAt = completionDate(t);
      return t.kanban_state === "done" && doneAt && doneAt >= start && doneAt <= today;
    });
    const doneCount = completed.length;
    const days = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date(start);
      day.setDate(start.getDate() + idx);
      const count = completed.filter((t) => {
        const d = completionDate(t);
        return d ? sameDay(d, day) : false;
      }).length;
      return { label: shortDayFormatter.format(day), count };
    });
    const avgPerDay = Math.round((doneCount / 7) * 10) / 10;
    const completionRate = filteredTasks.length ? Math.round((managerStats.done / filteredTasks.length) * 100) : 0;
    return { createdCount, doneCount, avgPerDay, completionRate, days };
  }, [tasks, filteredTasks.length, managerStats.done]);

  const resetForm = () => {
    setFormValues({ priority_eisenhower: "important_not_urgent", high_impact: false, source: "manual" });
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
        const task = await apiFetch<Task>(`/tasks/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        setTasks((prev) => prev.map((t) => (t.id === editingId ? task : t)));
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
      const task = await apiFetch<Task>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ kanban_state: state }) });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Action impossible";
      setBanner({ type: "error", message });
    }
  };

  const handleAiSuggest = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setBanner(null);
    setAiSummary(null);
    setAiSummaryError(null);
    setAddedDrafts(new Set());
    try {
      const res = await apiFetch<{ drafts: AiDraft[] }>("/ai/suggest-tasks", { method: "POST", body: JSON.stringify({ free_text: aiText }) });
      setAiDrafts(res.drafts);
      if (!res.drafts || res.drafts.length === 0) {
        setAiSummaryError("L'IA n'a pas généré de tâches. Ajustez votre description et réessayez.");
        return;
      }
      const counts: Record<Priority, number> = {
        urgent_important: 0,
        important_not_urgent: 0,
        urgent_not_important: 0,
        not_urgent_not_important: 0,
      };
      let highImpact = 0;
      res.drafts.forEach((d) => {
        if (d.priority_eisenhower && counts[d.priority_eisenhower] !== undefined) counts[d.priority_eisenhower] += 1;
        if (d.high_impact) highImpact += 1;
      });
      setAiSummary({ total: res.drafts.length, counts, highImpact });
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Échec de l'assistant";
      setBanner({ type: "error", message });
      setAiSummaryError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddDraft = async (draft: AiDraft, index: number) => {
    if (!draft.title) return;
    setAddingDraftIndex(index);
    try {
      const priority = draft.priority_eisenhower || computePriority(draft.title, draft.description);
      const impact = typeof draft.high_impact === "boolean" ? draft.high_impact : computeImpact(draft.title, draft.description);
      const payload = {
        title: draft.title,
        description: draft.description || "",
        comments: draft.description || "",
        priority_eisenhower: priority,
        high_impact: impact,
        estimated_duration_minutes: draft.estimated_duration_minutes || undefined,
        kanban_state: "todo" as KanbanState,
        due_datetime: draft.due_datetime || toIsoDate(selectedDate),
        source: "ia" as TaskSource,
        category: draft.category || undefined,
      };
      const task = await apiFetch<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) });
      setTasks((prev) => [task, ...prev]);
      setBanner({ type: "success", message: "Tâche ajoutée à votre planning d'aujourd'hui" });
      setAddedDrafts((prev) => new Set([...Array.from(prev), draft.title]));
      void loadTasks();
    } catch (err) {
      const message = err instanceof Error ? friendlyError(err.message) : "Impossible d'ajouter cette tâche";
      setBanner({ type: "error", message });
    } finally {
      setAddingDraftIndex(null);
    }
  };

  const renderDashboard = () => {
    const emptyDay = dayTasks.length === 0;
    return (
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

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>Planning du jour</span>
            <span>{timeFormatter.format(new Date())}</span>
          </div>
          {emptyDay ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Aucune tâche planifiée pour aujourd’hui.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <button onClick={() => setActiveSection("create")} className="rounded-full bg-slate-900 px-4 py-2 text-white">Créer une nouvelle tâche</button>
                <button onClick={() => setActiveSection("coaching")} className="rounded-full border border-sky-200 px-4 py-2 text-sky-700 hover:bg-sky-50">
                  Organiser ma journée avec l’IA
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {dayTasks
                .sort((a, b) => {
                  const ap = a.priority_eisenhower === "urgent_important" ? 0 : a.priority_eisenhower === "important_not_urgent" ? 1 : 2;
                  const bp = b.priority_eisenhower === "urgent_important" ? 0 : b.priority_eisenhower === "important_not_urgent" ? 1 : 2;
                  return ap - bp;
                })
                .map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
                      </div>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">{PRIORITY_LABEL[task.priority_eisenhower]}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekly = () => {
    const hasTasks = weeklyTasks.some((d) => d.list.length);
    const monday = startOfWeek(selectedDate);
    if (!hasTasks) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Vous n’avez pas encore de tâches pour cette semaine.</p>
          <button
            onClick={() => {
              setSelectedDate(monday);
              setActiveSection("coaching");
            }}
            className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-white"
          >
            Organiser ma semaine avec l’IA
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {weeklyTasks.map(({ day, list }) => (
            <div
              key={day.toISOString()}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-200 cursor-pointer"
              onClick={() => {
                setSelectedDate(day);
                setActiveSection("dashboard");
              }}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>{shortDayFormatter.format(day)} {day.getDate()}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{list.length} tâche(s)</span>
              </div>
              <div className="mt-2 space-y-2">
                {list.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-800">
                      <p className="font-semibold line-clamp-1">{task.title}</p>
                      <p className="text-[11px] text-slate-500">{PRIORITY_LABEL[task.priority_eisenhower]}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      {task.high_impact && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Impact</span>}
                      {task.kanban_state === "done" ? <span className="text-emerald-600 text-lg">✓</span> : <span className="text-slate-400 text-lg">•</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMatrix = () => {
    const quadrants: Record<Priority, Task[]> = {
      urgent_important: [],
      important_not_urgent: [],
      urgent_not_important: [],
      not_urgent_not_important: [],
    };
    dayTasks.forEach((task) => quadrants[task.priority_eisenhower].push(task));

    const Empty = (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
        <p>Créez ou générez des tâches pour voir votre matrice de priorités.</p>
        <button onClick={() => setActiveSection("coaching")} className="mt-3 rounded-full border border-sky-200 px-4 py-2 text-sky-700 hover:bg-sky-50">
          Générer des tâches avec l’IA
        </button>
      </div>
    );

    return (
      <div className="space-y-3">
        {!dayTasks.length ? (
          Empty
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(Object.keys(quadrants) as Priority[]).map((prio) => (
              <div key={prio} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{PRIORITY_LABEL[prio]}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{quadrants[prio].length}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {quadrants[prio].slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                      <span>{task.title}</span>
                      {task.high_impact && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Impact élevé</span>}
                    </div>
                  ))}
                  {quadrants[prio].length > 5 && (
                    <button
                      onClick={() => {
                        setFilterPriority(prio);
                        setActiveSection("manage");
                      }}
                      className="text-xs font-semibold text-sky-700"
                    >
                      Voir toutes les tâches →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => {
    if (!tasks.length) {
      return (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Nous afficherons vos statistiques dès que vous aurez commencé à utiliser votre planning.</p>
          <button onClick={() => setActiveSection("create")} className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-white">
            Créer ma première tâche
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Tâches créées (7 j)</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.createdCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Tâches complétées (7 j)</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.doneCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Taux de complétion</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.completionRate}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase text-slate-400">Moyenne / jour (7 j)</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{statsLast7.avgPerDay}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Complétées sur 7 jours</p>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {statsLast7.days.map((day) => (
              <div key={day.label} className="flex flex-col items-center gap-2">
                <div className="h-32 w-full rounded-lg bg-slate-100">
                  <div className="h-full w-full rounded-lg bg-sky-500" style={{ height: `${Math.min(day.count * 15, 128)}px` }} />
                </div>
                <span className="text-[11px] text-slate-500">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskTable = () => {
    const Filters = (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select value={filterPeriod} onChange={(event) => setFilterPeriod(event.target.value as PeriodFilter)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes périodes</option>
          <option value="today">Aujourd’hui</option>
          <option value="last7">7 derniers jours</option>
          <option value="last30">30 derniers jours</option>
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as typeof filterStatus)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Tous statuts</option>
          <option value="todo">À faire</option>
          <option value="in_progress">En cours</option>
          <option value="done">Terminé</option>
        </select>
        <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value as typeof filterPriority)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes priorités</option>
          <option value="urgent_important">Urgent & important</option>
          <option value="important_not_urgent">Important mais pas urgent</option>
          <option value="urgent_not_important">Urgent moins important</option>
          <option value="not_urgent_not_important">Ni urgent ni important</option>
        </select>
        <select value={filterSource} onChange={(event) => setFilterSource(event.target.value as typeof filterSource)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes origines</option>
          <option value="manual">Créées manuellement</option>
          <option value="ia">Générées par l’IA</option>
        </select>
        <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="rounded-full border border-slate-200 px-3 py-1">
          <option value="all">Toutes catégories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
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
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Priorité</th>
                <th className="px-4 py-3 text-left">Impact</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTasks.map((task) => {
                const due = task.due_datetime ? dayFormatter.format(new Date(task.due_datetime)) : "—";
                const late = parseDate(task.due_datetime)?.getTime() && parseDate(task.due_datetime)!.getTime() < Date.now() && task.kanban_state !== "done";
                return (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={task.kanban_state === "done"}
                        onChange={(event) => void handleStateChange(task.id, event.target.checked ? "done" : "todo")}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{task.title}</span>
                        {task.description && <span className="text-[11px] text-slate-500 line-clamp-2">{task.description}</span>}
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-xs ${late ? "font-semibold text-amber-600" : "text-slate-500"}`}>{due}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 font-medium text-sky-700">{PRIORITY_LABEL[task.priority_eisenhower]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${task.high_impact ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {task.high_impact ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{SOURCE_LABEL[(task.source as TaskSource) || "manual"]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">
                      <select
                        value={task.kanban_state}
                        onChange={(event) => void handleStateChange(task.id, event.target.value as KanbanState)}
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
                            setFormValues({ ...task, source: (task.source as TaskSource) || "manual" });
                            setActiveSection("create");
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 hover:border-sky-200 hover:text-sky-700"
                        >
                          Éditer
                        </button>
                        <button onClick={() => void handleStateChange(task.id, task.kanban_state === "done" ? "todo" : "done")} className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 hover:border-emerald-300">
                          {task.kanban_state === "done" ? "Marquer en cours" : "Terminer"}
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
          <button onClick={() => setActiveSection("create")} className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white shadow hover:bg-slate-800">
            + Nouvelle tâche
          </button>
          <button onClick={() => void loadTasks()} className="rounded-full border border-slate-200 px-3 py-2 text-slate-600 hover:border-sky-200 hover:text-sky-700">
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
            placeholder="Ex : 25, 45, 60"
          />
        </label>
        <label className="text-sm text-slate-600">
          Échéance
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Coaching MyPlanning</h2>
      {showCoachingGuide && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">Comment ça marche ?</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
                <li>Décrivez votre journée dans la zone de texte.</li>
                <li>Cliquez sur “Générer des tâches”.</li>
                <li>L’IA propose des tâches classées par priorité.</li>
                <li>“Ajouter à mes tâches” pour les envoyer dans votre planning.</li>
              </ol>
            </div>
            <button
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => {
                setShowCoachingGuide(false);
                if (typeof window !== "undefined") window.localStorage.setItem("myplanning.coaching.guide", "hidden");
              }}
            >
              Masquer ✕
            </button>
          </div>
        </div>
      )}
      {aiSummary && (
        <div className="flex items-start justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div>
            <p className="font-semibold">
              {aiSummary.total} tâche{aiSummary.total > 1 ? "s" : ""} générée{aiSummary.total > 1 ? "s" : ""} pour aujourd’hui
            </p>
            <p className="text-[13px]">
              {aiSummary.counts.important_not_urgent} importantes, {aiSummary.counts.urgent_important} urgentes & importantes,{" "}
              {aiSummary.counts.urgent_not_important} urgentes moins importantes, {aiSummary.counts.not_urgent_not_important} autres.{" "}
              {aiSummary.highImpact} tâche{aiSummary.highImpact > 1 ? "s" : ""} à impact élevé.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveSection("manage")} className="text-xs font-semibold text-emerald-800 underline">
              Voir dans Gérer les tâches
            </button>
            <button className="text-xs text-emerald-700 hover:text-emerald-900" onClick={() => setAiSummary(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
      {aiSummaryError && (
        <div className="flex items-start justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{aiSummaryError}</span>
          <button className="text-xs text-rose-700 hover:text-rose-900" onClick={() => setAiSummaryError(null)}>
            ✕
          </button>
        </div>
      )}
      <textarea
        value={aiText}
        onChange={(event) => setAiText(event.target.value)}
        placeholder="Décrivez votre journée..."
        className="mt-1 h-32 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none"
      />
      <button
        onClick={handleAiSuggest}
        disabled={aiLoading}
        className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {aiLoading ? "Analyse en cours..." : "Générer des tâches"}
      </button>
      {aiDrafts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <span>{aiDrafts.length} tâche(s) proposées</span>
          <button
            onClick={async () => {
              const notAdded = aiDrafts.filter((d) => !addedDrafts.has(d.title));
              if (!notAdded.length) return;
              setBulkAdding(true);
              try {
                const payload = notAdded.map((draft) => {
                  const priority = draft.priority_eisenhower || computePriority(draft.title, draft.description);
                  const impact = typeof draft.high_impact === "boolean" ? draft.high_impact : computeImpact(draft.title, draft.description);
                  return {
                    title: draft.title,
                    description: draft.description || "",
                    comments: draft.description || "",
                    priority_eisenhower: priority,
                    high_impact: impact,
                    estimated_duration_minutes: draft.estimated_duration_minutes || undefined,
                    kanban_state: "todo" as KanbanState,
                    due_datetime: draft.due_datetime || toIsoDate(selectedDate),
                    source: "ia" as TaskSource,
                    category: draft.category || undefined,
                  };
                });
                const res = await apiFetch<{ items: Task[] }>("/tasks/bulk_create", { method: "POST", body: JSON.stringify(payload) });
                setTasks((prev) => [...res.items, ...prev]);
                setAddedDrafts(new Set([...Array.from(addedDrafts), ...notAdded.map((d) => d.title)]));
                setBanner({ type: "success", message: `${res.items.length} tâche(s) ajoutée(s) à votre planning d'aujourd'hui` });
                void loadTasks();
              } catch (err) {
                const message = err instanceof Error ? friendlyError(err.message) : "Impossible d'ajouter ces tâches";
                setBanner({ type: "error", message });
              } finally {
                setBulkAdding(false);
              }
            }}
            disabled={bulkAdding || aiDrafts.every((d) => addedDrafts.has(d.title))}
            className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white disabled:opacity-50"
          >
            {bulkAdding ? "Ajout..." : "Ajouter toutes les tâches à MyPlanning"}
          </button>
        </div>
      )}
      {aiDrafts.length > 0 && (
        <div className="mt-2 space-y-2 text-sm">
          {aiDrafts.map((draft, idx) => (
            <div key={`${draft.title}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{draft.priority_eisenhower ? PRIORITY_LABEL[draft.priority_eisenhower] : "Priorité"}</span>
                {draft.high_impact && <span className="text-emerald-600">Impact élevé</span>}
              </div>
              <p className="font-semibold text-slate-900">{draft.title}</p>
              {draft.description && <p className="text-xs text-slate-500">{draft.description}</p>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setFormValues({
                      title: draft.title,
                      comments: draft.description || "",
                      description: draft.description || "",
                      priority_eisenhower: draft.priority_eisenhower || "important_not_urgent",
                      high_impact: Boolean(draft.high_impact),
                      estimated_duration_minutes: draft.estimated_duration_minutes || undefined,
                      source: "ia",
                      due_datetime: draft.due_datetime || toIsoDate(selectedDate),
                    });
                    setEditingId(null);
                    setActiveSection("create");
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  Pré-remplir
                </button>
                <button
                  onClick={() => void handleAddDraft(draft, idx)}
                  disabled={addingDraftIndex === idx || addedDrafts.has(draft.title)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-60"
                >
                  {addedDrafts.has(draft.title) ? "Ajoutée" : addingDraftIndex === idx ? "Ajout..." : "Ajouter à mes tâches"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Paramètres IA</h2>
      <p className="text-sm text-slate-600">
        Configurez le niveau d’autonomie, le style de coaching et les plages horaires où l’IA peut proposer des tâches. Ces options seront activées prochainement.
      </p>
      <div className="space-y-2">
        {["Niveau d’autonomie", "Style de coaching", "Plages horaires", "Notifications"].map((label) => (
          <label key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span>{label}</span>
            <input type="checkbox" disabled className="h-4 w-4" />
          </label>
        ))}
        <p className="text-xs text-slate-500">Bientôt disponible.</p>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "weekly":
        return renderWeekly();
      case "matrix":
        return renderMatrix();
      case "stats":
        return renderStats();
      case "create":
        return renderCreateForm();
      case "manage":
        return renderManage();
      case "coaching":
        return renderCoaching();
      case "settings":
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  const sidebarWidth = isSidebarCollapsed ? "72px" : "260px";
  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 flex w-full overflow-hidden bg-slate-100"
    : "flex h-[calc(100vh-90px)] w-full flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl";

  return (
    <div className={containerClasses}>
      <aside
        className="flex h-full flex-col gap-6 border-r border-slate-200 bg-white/95 p-4 transition-[width] duration-200"
        style={{ width: sidebarWidth, minWidth: sidebarWidth }}
      >
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">MyPlanning</p>
              <p className="text-lg font-semibold text-slate-900">Cockpit</p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed((v) => !v)}
            className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            title={isSidebarCollapsed ? "Déployer" : "Réduire"}
          >
            {isSidebarCollapsed ? "»" : "«"}
          </button>
        </div>
        <nav className="space-y-6 text-sm font-semibold">
          <div>
            <p className={`text-xs uppercase text-slate-400 ${isSidebarCollapsed ? "text-center" : ""}`}>Vues</p>
            <div className="mt-2 space-y-2">
              {VIEWS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-left transition ${
                    activeSection === item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title={item.label}
                >
                  <span>{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className={`text-xs uppercase text-slate-400 ${isSidebarCollapsed ? "text-center" : ""}`}>Actions</p>
            <div className="mt-2 space-y-2">
              {ACTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-2 rounded-2xl px-4 py-2 text-left transition ${
                    activeSection === item.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title={item.label}
                >
                  <span>{item.icon}</span>
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm text-slate-600 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">{VIEWS.concat(ACTIONS).find((item) => item.id === activeSection)?.label || "MyPlanning"}</p>
            <p className="text-lg font-semibold text-slate-900">{dayFormatter.format(selectedDate)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => shiftSelectedDate(-1)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
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
            <button onClick={() => shiftSelectedDate(1)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
              Jour suivant →
            </button>
            <button
              onClick={() => setActiveSection("coaching")}
              className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500"
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
                banner.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
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

"use client";

import { useEffect, useMemo, useState } from "react";
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
  urgent_not_important: "Urgent moins important",
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
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!response.ok) {
    let message = await response.text();
    try {
      const parsed = message ? JSON.parse(message) : null;
      if (parsed && typeof parsed === "object") message = parsed.detail || parsed.message || message;
    } catch (err) {
      if (!message) message = "Impossible de contacter MyPlanning";
    }
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

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short" });
const shortDayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });

export default function MyPlanningPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [section, setSection] = useState("daily");
  const [aiText, setAiText] = useState("");
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [planResult, setPlanResult] = useState<AiPlanResult | null>(null);
  const [replanMinutes, setReplanMinutes] = useState(45);
  const [replanResult, setReplanResult] = useState<AiReplanResult | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [impactOnly, setImpactOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ items: Task[] }>("/tasks");
        setTasks(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les tâches");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(tasks.map((task) => task.category).filter(Boolean) as string[]);
    const base = ["Travail", "Études", "Perso", "Santé"];
    return set.size ? Array.from(set) : base;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let base = [...tasks];
    if (priorityFilter !== "all") base = base.filter((task) => task.priority_eisenhower === priorityFilter);
    if (impactOnly) base = base.filter((task) => task.high_impact);
    if (categoryFilter !== "all") base = base.filter((task) => (task.category || "") === categoryFilter);
    return base;
  }, [tasks, priorityFilter, impactOnly, categoryFilter]);

  const dayTasks = useMemo(() => {
    return filteredTasks.filter((task) => {
      const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
      return ref ? sameDay(ref, selectedDate) : false;
    });
  }, [filteredTasks, selectedDate]);

  const weekTasks = useMemo(() => {
    return filteredTasks.filter((task) => {
      const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
      return ref ? sameWeek(ref, selectedDate) : false;
    });
  }, [filteredTasks, selectedDate]);

  const weekDays = Array.from({ length: 7 }).map((_, idx) => {
    const date = new Date(startOfWeek(selectedDate));
    date.setDate(date.getDate() + idx);
    return date;
  });

  const timelineSlots = Array.from({ length: 12 }).map((_, idx) => 8 + idx);

  const renderTable = () => {
    if (loading) return (<div className="space-y-2">{[...Array(6)].map((_, idx) => (<div key={idx} className="h-12 animate-pulse rounded-xl bg-slate-100" />))}</div>);
    if (error)
      return (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              void apiFetch<{ items: Task[] }>("/tasks")
                .then((data) => setTasks(data.items))
                .catch((err) => setError(err instanceof Error ? err.message : "Erreur inconnue"))
                .finally(() => setLoading(false));
            }}
            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold"
          >
            Réessayer
          </button>
        </div>
      );
    if (!dayTasks.length)
      return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Aucune tâche pour cette journée. Créez une nouvelle tâche ou utilisez Organiser ma journée (IA).
        </div>
      );

    const columns = ["Titre", "Catégorie", "Priorité", "Impact", "Durée", "Deadline", "État"];
    return (
      <div className="rounded-3xl border border-slate-200 bg-white">
        <div className="max-h-[360px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" disabled />
                </th>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white text-slate-700">
              {dayTasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-100">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={task.kanban_state === "done"}
                      onChange={(event) => handleStateChange(task.id, event.target.checked ? "done" : "todo")}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-semibold">{task.title}</p>
                    {task.description && <p className="text-xs text-slate-500">{task.description}</p>}
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
                    {task.high_impact ? <span className="text-amber-600">⚡ Impact</span> : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-2">{task.estimated_duration_minutes ? `${task.estimated_duration_minutes} min` : "—"}</td>
                  <td className="px-4 py-2">{formatDateLabel(parseDate(task.due_datetime))}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {task.kanban_state === "todo" ? "À faire" : task.kanban_state === "in_progress" ? "En cours" : "Terminé"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleStateChange = async (taskId: string, state: KanbanState) => {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ kanban_state: state }),
      });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, kanban_state: state } : task)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    }
  };

  const handlePlanDay = async () => {
    try {
      const data = await apiFetch<AiPlanResult>("/ai/plan-day", { method: "POST", body: JSON.stringify({}) });
      setPlanResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec planification IA");
    }
  };

  const handleAiSuggest = async () => {
    if (!aiText.trim()) return;
    try {
      const data = await apiFetch<{ drafts: AiDraft[] }>("/ai/suggest-tasks", {
        method: "POST",
        body: JSON.stringify({ free_text: aiText }),
      });
      setAiDrafts(data.drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec IA");
    }
  };

  const handleReplan = async () => {
    try {
      const data = await apiFetch<AiReplanResult>("/ai/replan-with-time", {
        method: "POST",
        body: JSON.stringify({ available_minutes: replanMinutes }),
      });
      setReplanResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec plan express");
    }
  };

  const weekMatrix = () => {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <div>
            <p className="uppercase tracking-[0.4em] text-slate-400">Vue hebdomadaire</p>
            <p className="text-sm text-slate-600">{dayFormatter.format(weekDays[0])} – {dayFormatter.format(weekDays[6])}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSelectedDate((prev) => new Date(prev.setDate(prev.getDate() - 7)))} className="rounded-full border border-slate-200 px-3 py-1">
              Semaine -
            </button>
            <button onClick={() => setSelectedDate((prev) => new Date(prev.setDate(prev.getDate() + 7)))} className="rounded-full border border-slate-200 px-3 py-1">
              Semaine +
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="w-40 px-3 py-2 text-left text-[11px] uppercase tracking-wide text-slate-500">Catégorie</th>
                {weekDays.map((date) => (
                  <th key={date.toISOString()} className="px-3 py-2 text-center text-[11px] uppercase text-slate-500">
                    {shortDayFormatter.format(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-sm font-semibold text-slate-900">{category}</td>
                  {weekDays.map((date) => {
                    const tasksForCell = weekTasks.filter((task) => {
                      const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
                      return ref ? sameDay(ref, date) && (task.category || "") === category : false;
                    });
                    const cellState = tasksForCell.some((task) => task.kanban_state === "done")
                      ? "done"
                      : tasksForCell.some((task) => task.kanban_state === "in_progress")
                        ? "progress"
                        : tasksForCell.length
                          ? "late"
                          : "empty";
                    const stateColor =
                      cellState === "done"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : cellState === "progress"
                          ? "bg-sky-50 border-sky-200 text-sky-700"
                          : cellState === "late"
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "bg-slate-50 border-slate-200 text-slate-400";
                    return (
                      <td key={date.toISOString()} className="px-3 py-2">
                        <div className={`min-h-[60px] rounded-2xl border px-2 py-1 text-xs ${stateColor}`}>
                          {tasksForCell.length === 0 ? (
                            <span>—</span>
                          ) : (
                            tasksForCell.slice(0, 2).map((task) => (
                              <p key={task.id} className="truncate">
                                {task.title}
                              </p>
                            ))
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const timesheetMatrix = () => {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Matrice temps / tâches</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => {
            const label = idx === 0 ? "Matin" : idx === 1 ? "Après-midi" : "Soir";
            const tasksForSlot = dayTasks.filter((task) => {
              const ref = parseDate(task.start_datetime);
              if (!ref) return false;
              return idx === 0 ? ref.getHours() < 12 : idx === 1 ? ref.getHours() < 18 : ref.getHours() >= 18;
            });
            return (
              <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                  <span className="text-xs text-slate-400">{tasksForSlot.length} tâche(s)</span>
                </div>
                {tasksForSlot.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Temps libre</p>
                ) : (
                  <div className="mt-3 space-y-2 text-sm">
                    {tasksForSlot.map((task) => (
                      <div key={task.id} className="rounded-2xl bg-white px-3 py-2 shadow-sm">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">{task.estimated_duration_minutes || 0} min</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const statsView = () => {
    const histogram = weekDays.map((date) => {
      const completed = tasks.filter((task) => {
        const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
        return ref ? sameDay(ref, date) && task.kanban_state === "done" : false;
      }).length;
      return { label: shortDayFormatter.format(date), value: completed };
    });
    const categoriesData = categories.map((category) => {
      const total = tasks
        .filter((task) => (task.category || "") === category)
        .reduce((sum, task) => sum + (task.estimated_duration_minutes || 0), 0);
      return { label: category, value: total };
    });
    const impactHigh = tasks.filter((task) => task.high_impact).reduce((sum, task) => sum + (task.estimated_duration_minutes || 0), 0);
    const impactNormal = tasks.filter((task) => !task.high_impact).reduce((sum, task) => sum + (task.estimated_duration_minutes || 0), 0);

    return (
      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tâches complétées</p>
          <div className="mt-4 flex gap-2">
            {histogram.map((bar) => (
              <div key={bar.label} className="flex-1 text-center">
                <div className="mx-auto flex h-32 max-w-[40px] items-end rounded-b-xl bg-slate-100">
                  <div className="w-full rounded-t-xl bg-sky-500" style={{ height: `${Math.min(bar.value * 20, 120)}px` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{bar.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Répartition du temps</p>
            <div className="mt-3 space-y-2">
              {categoriesData.map((slice) => (
                <div key={slice.label} className="text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>{slice.label}</span>
                    <span>{slice.value} min</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${Math.min(slice.value / 5, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Impact élevé vs normal</p>
            <div className="mt-3 space-y-4 text-xs text-slate-500">
              <div>
                <p className="font-semibold text-emerald-600">High impact</p>
                <div className="mt-1 h-2 rounded-full bg-emerald-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${impactHigh ? Math.min((impactHigh / (impactHigh + impactNormal || 1)) * 100, 100) : 0}%` }} />
                </div>
                <p>{impactHigh} min</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600">Normal</p>
                <div className="mt-1 h-2 rounded-full bg-amber-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${impactNormal ? Math.min((impactNormal / (impactHigh + impactNormal || 1)) * 100, 100) : 0}%` }} />
                </div>
                <p>{impactNormal} min</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMain = () => {
    if (section === "daily")
      return (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Planning du jour</p>
                <h2 className="text-lg font-semibold text-slate-900">{dayFormatter.format(selectedDate)}</h2>
              </div>
              <span className="text-xs text-slate-500">Nous sommes ici : {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-slate-500">
              {timelineSlots.map((hour) => {
                const slotTasks = dayTasks.filter((task) => {
                  const ref = parseDate(task.start_datetime);
                  if (!ref) return false;
                  return ref.getHours() === hour;
                });
                return (
                  <div key={hour} className="flex gap-3">
                    <div className="w-12 text-right font-semibold text-slate-700">{`${hour}h`}</div>
                    <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                      {slotTasks.length === 0 ? (
                        <p className="text-[11px] text-slate-400">Créneau libre</p>
                      ) : (
                        slotTasks.map((task) => (
                          <div key={task.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
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
          <div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-2">
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)} className="rounded-full border border-slate-200 px-3 py-1">
                  <option value="all">Toutes priorités</option>
                  <option value="urgent_important">Urgent & important</option>
                  <option value="important_not_urgent">Important mais pas urgent</option>
                  <option value="urgent_not_important">Urgent secondaire</option>
                  <option value="not_urgent_not_important">Secondaire</option>
                </select>
                <button onClick={() => setImpactOnly((prev) => !prev)} className={`rounded-full px-3 py-1 font-semibold ${impactOnly ? "bg-amber-500 text-white" : "border border-slate-200 text-slate-600"}`}>
                  Impact élevé
                </button>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-full border border-slate-200 px-3 py-1">
                  <option value="all">Toutes catégories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={() => setSelectedDate(new Date())} className="rounded-full border border-slate-200 px-4 py-1 font-semibold">
                Aujourd'hui
              </button>
            </div>
            <div className="mt-3">{renderTable()}</div>
          </div>
        </div>
      );
    if (section === "week") return weekMatrix();
    if (section === "matrix") return timesheetMatrix();
    if (section === "stats") return statsView();
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Paramétrage IA disponible prochainement.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-[26px] border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/60 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">MyPlanning</p>
              <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord temps réel</h1>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => setSelectedDate((prev) => new Date(prev.setDate(prev.getDate() - 1)))} className="rounded-full border border-slate-200 px-3 py-1">
                ←
              </button>
              <input type="date" value={new Date(selectedDate).toISOString().slice(0, 10)} onChange={(event) => { const next = new Date(event.target.value); if (!Number.isNaN(next.getTime())) setSelectedDate(next); }} className="rounded-full border border-slate-200 px-3 py-1" />
              <button onClick={() => setSelectedDate((prev) => new Date(prev.setDate(prev.getDate() + 1)))} className="rounded-full border border-slate-200 px-3 py-1">
                →
              </button>
              <button onClick={handlePlanDay} className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white">
                Organiser ma journée (IA)
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm"><p className="text-xs uppercase text-slate-400">Tâches actives</p><p className="mt-2 text-3xl font-semibold text-slate-900">{dayTasks.length}</p><p className="text-xs text-slate-500">aujourd'hui</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm"><p className="text-xs uppercase text-slate-400">Tâches semaine</p><p className="mt-2 text-3xl font-semibold text-slate-900">{weekTasks.length}</p><p className="text-xs text-slate-500">semaine courante</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm"><p className="text-xs uppercase text-slate-400">Impact élevé</p><p className="mt-2 text-3xl font-semibold text-slate-900">{dayTasks.filter((task) => task.high_impact).length}</p><p className="text-xs text-slate-500">Pareto 20 %</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm"><p className="text-xs uppercase text-slate-400">Focus IA</p><p className="mt-2 text-base text-slate-700">{planResult?.focus?.length ? `${planResult.focus.length} tâches focus` : "Lancez l'organisation"}</p></div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px,1fr,320px]">
          <aside className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <nav className="space-y-2 text-sm font-semibold">
              {[
                { id: "daily", label: "Vue quotidienne" },
                { id: "week", label: "Vue hebdomadaire" },
                { id: "matrix", label: "Matrice temps / tâches" },
                { id: "stats", label: "Stats & graphiques" },
                { id: "settings", label: "Paramètres IA" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`w-full rounded-2xl px-4 py-2 text-left transition ${section === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <main>{renderMain()}</main>

          <div className="space-y-4">
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.4em] text-slate-400">Coaching IA</p><input type="number" min={15} step={5} value={replanMinutes} onChange={(event) => setReplanMinutes(Number(event.target.value) || 15)} className="w-16 rounded-full border border-slate-200 px-3 py-1 text-xs" /></div>
              <textarea value={aiText} onChange={(event) => setAiText(event.target.value)} className="mt-3 h-28 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-500 focus:outline-none" placeholder="Décrivez votre journée..." />
              <div className="mt-3 flex gap-2 text-xs"><button onClick={handleAiSuggest} className="flex-1 rounded-full bg-slate-900 px-4 py-2 font-semibold text-white">Générer des tâches</button><button onClick={handleReplan} className="rounded-full border border-slate-200 px-4 py-2 font-semibold">Plan express</button></div>
              {aiDrafts.length > 0 && (
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  {aiDrafts.map((draft, idx) => (
                    <div key={`${draft.title}-${idx}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{draft.priority_eisenhower ? PRIORITY_LABEL[draft.priority_eisenhower] : "Priorité"}</span>
                        {draft.high_impact && <span className="text-emerald-600">Impact élevé</span>}
                      </div>
                      <p className="font-semibold text-slate-900">{draft.title}</p>
                      {draft.description && <p className="text-xs text-slate-500">{draft.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {replanResult?.recommendations && (
                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {replanResult.recommendations.map((item) => (
                    <div key={item.task_id} className="rounded-2xl border border-amber-100 bg-amber-50/70 px-3 py-2">
                      <p className="font-semibold text-amber-900">{item.task_id}</p>
                      {item.reason && <p>{item.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Discipline semaine</p>
              <div className="mt-4 space-y-3 text-xs text-slate-500">
                {weekDays.map((date) => {
                  const completed = tasks.filter((task) => {
                    const ref = parseDate(task.start_datetime) || parseDate(task.due_datetime);
                    return ref ? sameDay(ref, date) && task.kanban_state === "done" : false;
                  }).length;
                  return (
                    <div key={date.toISOString()}>
                      <div className="flex items-center justify-between"><span>{shortDayFormatter.format(date)}</span><span>{completed} tâches</span></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(completed * 20, 100)}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

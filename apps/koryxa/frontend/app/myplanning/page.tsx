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
    const text = await response.text();
    throw new Error(text || "Erreur réseau");
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

function TaskCard({
  task,
  advanced,
  onStateChange,
}: {
  task: Task;
  advanced: boolean;
  onStateChange?: (id: string, state: KanbanState) => void;
}) {
  const badgeColor =
    task.priority_eisenhower === "urgent_important"
      ? "bg-red-100 text-red-700"
      : task.priority_eisenhower === "important_not_urgent"
        ? "bg-amber-100 text-amber-800"
        : task.priority_eisenhower === "urgent_not_important"
          ? "bg-orange-100 text-orange-700"
          : "bg-slate-100 text-slate-700";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{task.title}</p>
          {task.category && <p className="text-xs text-slate-500">{task.category}</p>}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${badgeColor}`}>{formatPriority(task.priority_eisenhower)}</span>
      </div>
      {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {task.high_impact && <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Impact élevé</span>}
        {task.estimated_duration_minutes && (
          <span className="rounded-full bg-slate-100 px-2 py-1">{task.estimated_duration_minutes} min</span>
        )}
        {task.due_datetime && (
          <span className="rounded-full bg-slate-100 px-2 py-1">
            Échéance : {new Date(task.due_datetime).toLocaleDateString()}
          </span>
        )}
        {advanced && task.energy_level && (
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-600">Énergie : {task.energy_level}</span>
        )}
        {advanced && task.moscow && (
          <span className="rounded-full bg-fuchsia-50 px-2 py-1 text-fuchsia-600">MoSCoW : {task.moscow}</span>
        )}
      </div>
      {onStateChange && (
        <div className="mt-4 flex gap-2 text-xs">
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
  title,
  tasks,
  advanced,
  emptyMessage,
  onStateChange,
}: {
  title: string;
  tasks: Task[];
  advanced: boolean;
  emptyMessage: string;
  onStateChange?: (id: string, state: KanbanState) => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Vue</p>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        {title === "Aujourd'hui" && (
          <span className="text-xs font-medium text-slate-500">{tasks.length} tâches pour ce créneau</span>
        )}
      </header>
      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} advanced={advanced} onStateChange={onStateChange} />
          ))}
        </div>
      )}
    </section>
  );
}

function TaskKanbanBoard({
  tasks,
  advanced,
  onStateChange,
}: {
  tasks: Task[];
  advanced: boolean;
  onStateChange: (id: string, state: KanbanState) => void;
}) {
  const columns: Record<KanbanState, Task[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };
  tasks.forEach((task) => {
    columns[task.kanban_state].push(task);
  });
  const ordered: { key: KanbanState; label: string }[] = [
    { key: "todo", label: "À faire" },
    { key: "in_progress", label: "En cours" },
    { key: "done", label: "Terminé" },
  ];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Flux</p>
        <h2 className="text-xl font-semibold text-slate-900">Kanban</h2>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {ordered.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
              <span className="text-xs text-slate-500">{columns[key].length}</span>
            </div>
            {columns[key].length === 0 ? (
              <p className="text-xs text-slate-400">Aucune tâche</p>
            ) : (
              columns[key].map((task) => (
                <TaskCard key={task.id} task={task} advanced={advanced} onStateChange={onStateChange} />
              ))
            )}
          </div>
        ))}
      </div>
    </section>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl"
      >
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
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeView, setActiveView] = useState<"today" | "week" | "kanban">("today");
  const [aiText, setAiText] = useState("");
  const [aiDrafts, setAiDrafts] = useState<AiDraft[]>([]);
  const [planResult, setPlanResult] = useState<AiPlanResult | null>(null);
  const [replanMinutes, setReplanMinutes] = useState(45);
  const [replanResult, setReplanResult] = useState<AiReplanResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const refreshTasks = async () => {
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

  useEffect(() => {
    void refreshTasks();
  }, []);

  const todayTasks = useMemo(() => tasks.filter((task) => task.kanban_state !== "done" && (isSameDay(task.start_datetime) || isSameDay(task.due_datetime))), [tasks]);
  const weekTasks = useMemo(() => tasks.filter((task) => task.kanban_state !== "done" && (isSameWeek(task.start_datetime) || isSameWeek(task.due_datetime))), [tasks]);

  const handleStateChange = async (taskId: string, state: KanbanState) => {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ kanban_state: state }),
      });
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, kanban_state: state } : task)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSuggest = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const data = await apiFetch<{ drafts: AiDraft[] }>("/ai/suggest-tasks", {
        method: "POST",
        body: JSON.stringify({ free_text: aiText }),
      });
      setAiDrafts(data.drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suggestion IA");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePlanDay = async () => {
    setAiLoading(true);
    try {
      const data = await apiFetch<AiPlanResult>("/ai/plan-day", { method: "POST", body: JSON.stringify({}) });
      setPlanResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la planification IA");
    } finally {
      setAiLoading(false);
    }
  };

  const handleReplan = async () => {
    setAiLoading(true);
    try {
      const data = await apiFetch<AiReplanResult>("/ai/replan-with-time", {
        method: "POST",
        body: JSON.stringify({ available_minutes: replanMinutes }),
      });
      setReplanResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec du recalcul");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6fb] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Productivité</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">MyPlanning</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Organisez vos journées avec les méthodes Eisenhower, MoSCoW, Pareto et Kanban. Basculez en mode avancé
                pour piloter l&apos;énergie, Pomodoro et les objectifs stratégiques.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
              >
                Nouvelle tâche
              </button>
              <button
                onClick={() => setMode((prev) => (prev === "simple" ? "advanced" : "simple"))}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Mode {mode === "simple" ? "avancé" : "simple"}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
            {["today", "week", "kanban"].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view as "today" | "week" | "kanban")}
                className={`rounded-full px-3 py-1 transition ${
                  activeView === view ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {view === "today" ? "Aujourd'hui" : view === "week" ? "Semaine" : "Kanban"}
              </button>
            ))}
            <button
              onClick={handlePlanDay}
              className="ml-auto inline-flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              Organiser ma journée (IA)
            </button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Chargement de vos tâches…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">{error}</div>
        ) : (
          <>
            {activeView === "today" && (
              <TaskList
                title="Aujourd'hui"
                tasks={todayTasks}
                advanced={mode === "advanced"}
                emptyMessage="Aucune tâche planifiée aujourd'hui."
                onStateChange={handleStateChange}
              />
            )}
            {activeView === "week" && (
              <TaskList
                title="Semaine"
                tasks={weekTasks}
                advanced={mode === "advanced"}
                emptyMessage="Aucune tâche planifiée cette semaine."
                onStateChange={handleStateChange}
              />
            )}
            {activeView === "kanban" && (
              <TaskKanbanBoard tasks={tasks} advanced={mode === "advanced"} onStateChange={handleStateChange} />
            )}
          </>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex flex-wrap items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Assisté par IA</p>
              <h2 className="text-xl font-semibold text-slate-900">Coaching MyPlanning</h2>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <label className="flex items-center gap-2">
                Temps restant (min)
                <input
                  type="number"
                  min={15}
                  value={replanMinutes}
                  onChange={(e) => setReplanMinutes(Number(e.target.value) || 15)}
                  className="w-20 rounded-xl border border-slate-200 px-3 py-1 text-xs focus:border-sky-500 focus:outline-none"
                />
              </label>
              <button
                onClick={handleReplan}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300"
              >
                Plan express
              </button>
            </div>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-600">
                Décrivez votre journée
                <textarea
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="mt-2 h-32 w-full rounded-3xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  placeholder="Ex: préparer présentation, appeler la coopérative, finaliser dossier..."
                />
              </label>
              <button
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="mt-3 inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {aiLoading ? "Analyse en cours..." : "Générer des tâches"}
              </button>
              {aiDrafts.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm">
                  <p className="font-semibold text-slate-900">Propositions IA</p>
                  <ul className="mt-2 space-y-2 text-slate-600">
                    {aiDrafts.map((draft, idx) => (
                      <li key={idx} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{draft.priority_eisenhower ? formatPriority(draft.priority_eisenhower) : "Priorité à confirmer"}</span>
                          {draft.high_impact && <span className="text-emerald-600">Impact élevé</span>}
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{draft.title}</p>
                        {draft.description && <p className="text-xs text-slate-500">{draft.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {planResult && (
                <div className="rounded-2xl border border-slate-100 bg-emerald-50/70 p-4 text-sm">
                  <p className="font-semibold text-emerald-900">Ordre suggéré</p>
                  <ol className="mt-2 list-decimal pl-5 text-emerald-700">
                    {planResult.order.map((taskId) => {
                      const task = tasks.find((t) => t.id === taskId);
                      return <li key={taskId}>{task ? task.title : taskId}</li>;
                    })}
                  </ol>
                  {planResult.focus.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Focus du jour</p>
                      <ul className="mt-1 space-y-1 text-emerald-700">
                        {planResult.focus.map((item) => {
                          const task = tasks.find((t) => t.id === item.task_id);
                          return (
                            <li key={item.task_id}>
                              <span className="font-semibold">{task ? task.title : item.task_id}</span>{" "}
                              <span className="text-xs text-emerald-900">{item.reason}</span>
                              <button
                                onClick={() => handleStateChange(item.task_id, "in_progress")}
                                className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs text-emerald-700"
                              >
                                Démarrer
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {replanResult && (
                <div className="rounded-2xl border border-slate-100 bg-amber-50/70 p-4 text-sm text-amber-800">
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
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Besoin d&apos;une vue différente ? La V1 reste volontairement simple. Vos retours amélioreront les filtres,
                exports et automatisations Pomodoro ☕️
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Maintenance rapide</h2>
          <p className="mt-1 text-sm text-slate-500">Utilisez ces actions pour garder un système propre.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {tasks.slice(0, 3).map((task) => (
              <button
                key={`del-${task.id}`}
                onClick={() => handleDelete(task.id)}
                className="rounded-2xl border border-red-200/60 bg-red-50/60 px-4 py-3 text-left text-sm text-red-700 transition hover:border-red-300"
              >
                Supprimer « {task.title.slice(0, 32)} »
              </button>
            ))}
          </div>
        </section>
      </div>
      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={(task) => setTasks((prev) => [task, ...prev])}
      />
    </div>
  );
}

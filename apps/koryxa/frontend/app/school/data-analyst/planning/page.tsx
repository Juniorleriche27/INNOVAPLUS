"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INNOVA_API_BASE } from "@/lib/env";
import { useAuth } from "@/components/auth/AuthProvider";
import { DATA_ANALYST_MODULES } from "../data";

const CLEAN_API_BASE = INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api");
const API_BASE = `${CLEAN_API_BASE}/myplanning`;

type Task = {
  id: string;
  title: string;
  kanban_state: "todo" | "in_progress" | "done";
  due_datetime?: string | null;
  estimated_duration_minutes?: number | null;
  linked_goal?: string | null;
};

type ImportItem = {
  title: string;
  description?: string | null;
  due_datetime?: string | null;
  estimated_duration_minutes?: number | null;
  linked_goal?: string | null;
  category?: string | null;
  high_impact?: boolean;
};

async function apiJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function listLearningTasks(contextId: string): Promise<Task[]> {
  const res = await fetch(
    `${API_BASE}/tasks?context_type=learning&context_id=${encodeURIComponent(contextId)}&limit=500`,
    { credentials: "include", cache: "no-store" }
  );
  const data = await apiJson<{ items: Task[] }>(res);
  return data.items || [];
}

async function importLearningTasks(contextId: string, items: ImportItem[]) {
  const res = await fetch(`${API_BASE}/learning/import`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context_id: contextId, overwrite_existing: true, items }),
  });
  return apiJson<{ created: number; updated: number; skipped: number }>(res);
}

async function markTaskDone(taskId: string) {
  const res = await fetch(`${API_BASE}/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kanban_state: "done", completed_at: new Date().toISOString() }),
  });
  return apiJson<Task>(res);
}

function buildSchedule(items: ImportItem[], minutesPerDay: number): ImportItem[] {
  const today = new Date();
  const dayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
  let currentDay = new Date(dayStart);
  let left = minutesPerDay;
  return items.map((it) => {
    const est = Math.max(10, Math.min(minutesPerDay, Number(it.estimated_duration_minutes || 45)));
    if (est > left) {
      currentDay = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000);
      left = minutesPerDay;
    }
    left -= est;
    const due = new Date(currentDay.getTime());
    due.setUTCHours(20, 0, 0, 0);
    return { ...it, estimated_duration_minutes: est, due_datetime: due.toISOString() };
  });
}

export default function DataAnalystLearningPlanningPage() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [minutesPerDay, setMinutesPerDay] = useState(120);

  const contextId = "data-analyst";

  useEffect(() => {
    if (!user) return;
    listLearningTasks(contextId)
      .then(setTasks)
      .catch((err) => setError(err.message || "Impossible de charger les tâches"));
  }, [user]);

  const completedCount = useMemo(() => tasks.filter((t) => t.kanban_state === "done").length, [tasks]);
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((100 * completedCount) / totalCount) : 0;

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const raw: ImportItem[] = [];
      for (const mod of DATA_ANALYST_MODULES) {
        for (const theme of mod.themes || []) {
          for (const lesson of theme.lessons || []) {
            raw.push({
              title: `${mod.title} — ${theme.title} — ${lesson.title}`,
              description: `Ouvrir la leçon : ${lesson.href}`,
              linked_goal: `href:${lesson.href}`,
              category: "Data Analyst",
              high_impact: true,
              estimated_duration_minutes: 45,
            });
          }
        }
      }
      const scheduled = buildSchedule(raw, minutesPerDay);
      await importLearningTasks(contextId, scheduled);
      const refreshed = await listLearningTasks(contextId);
      setTasks(refreshed);
    } catch (err) {
      setError((err as Error).message || "Impossible de générer le planning");
    } finally {
      setBusy(false);
    }
  }

  async function onComplete(task: Task) {
    setBusy(true);
    setError(null);
    try {
      await markTaskDone(task.id);
      const refreshed = await listLearningTasks(contextId);
      setTasks(refreshed);
    } catch (err) {
      setError((err as Error).message || "Impossible de terminer la tâche");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">{error}</div>;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mon planning d’apprentissage</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Parcours Data Analyst</h1>
            <p className="mt-2 text-sm text-slate-700">
              Ici tu ne gères que des tâches liées au parcours (context_type=learning).
            </p>
          </div>
          <Link href="/school/data-analyst" className="text-sm font-semibold text-sky-700 hover:underline">
            Retour au dashboard
          </Link>
        </div>

        {!loading && !user ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Connecte-toi pour créer ton planning.
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Progression</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{progressPct}%</p>
            <p className="mt-1 text-sm text-slate-600">{completedCount} / {totalCount} terminées</p>
          </div>
          <form onSubmit={onGenerate} className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Générer / régénérer</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-800">Minutes / jour</label>
                <input
                  type="number"
                  min={30}
                  max={720}
                  value={minutesPerDay}
                  onChange={(e) => setMinutesPerDay(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={!user || busy}
                className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {busy ? "…" : "Créer mon planning"}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">La génération crée 1 tâche par leçon (module → thème → leçon).</p>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Tâches</h2>
        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
            Aucune tâche. Clique sur “Créer mon planning”.
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t.estimated_duration_minutes ? `${t.estimated_duration_minutes} min` : "—"} ·{" "}
                      {t.due_datetime ? new Date(t.due_datetime).toLocaleString() : "sans échéance"}
                    </p>
                  </div>
                  {t.kanban_state !== "done" ? (
                    <button
                      onClick={() => onComplete(t)}
                      disabled={!user || busy}
                      className="inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Terminer
                    </button>
                  ) : (
                    <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                      ✓ Terminé
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


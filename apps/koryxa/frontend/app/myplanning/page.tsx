"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { listOrgs, listOrgWorkspaces, Organization } from "@/app/myplanning/components/enterpriseApi";
import { TeamApiError, Workspace, WorkspaceListResponse, teamRequest } from "@/app/myplanning/team/_components/teamApi";
import { AttendanceApiError, myplanningRequest } from "@/app/myplanning/components/attendanceApi";

type Task = {
  id: string;
  title: string;
  status?: string | null;
  kanban_state?: string | null;
  high_impact?: boolean | null;
  context_type?: string | null;
  workspace_id?: string | null;
  due_datetime?: string | null;
  due_date?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type TaskListResponse = {
  items: Task[];
  total?: number;
  has_more?: boolean;
};

type Snapshot = {
  tasks: Task[];
  workspaces: Workspace[];
  orgs: Organization[];
  enterpriseWorkspaceIds: Set<string>;
};

const timeFormatter = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" });

function normalizeText(value: string | null | undefined): string {
  return (value || "").trim().toLowerCase();
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isDone(task: Task): boolean {
  const status = normalizeText(task.status);
  const kanban = normalizeText(task.kanban_state);
  return status === "done" || status === "completed" || kanban === "done" || kanban === "termine" || kanban === "completed";
}

function taskLevel(task: Task, enterpriseWorkspaceIds: Set<string>): "free" | "pro" | "team" | "enterprise" {
  const workspaceId = (task.workspace_id || "").trim();
  if (workspaceId) {
    return enterpriseWorkspaceIds.has(workspaceId) ? "enterprise" : "team";
  }
  const context = normalizeText(task.context_type);
  if (context === "professional" || context === "learning") return "pro";
  return "free";
}

function levelLabel(level: "free" | "pro" | "team" | "enterprise"): string {
  if (level === "enterprise") return "Enterprise";
  if (level === "team") return "Team";
  if (level === "pro") return "Pro";
  return "Free";
}

function statusLabel(task: Task): string {
  if (isDone(task)) return "Terminé";
  const due = parseDate(task.due_datetime || task.due_date);
  if (due && due.getTime() < Date.now()) return "En retard";
  return "Actif";
}

function formatDue(task: Task): string {
  const due = parseDate(task.due_datetime || task.due_date);
  if (!due) return "Non planifié";
  return `${dateFormatter.format(due)} · ${timeFormatter.format(due)}`;
}

async function loadTasksSnapshot(): Promise<Task[]> {
  const pageSize = 200;
  let page = 1;
  const tasks: Task[] = [];
  while (true) {
    const response = await myplanningRequest<TaskListResponse>(`/tasks?page=${page}&limit=${pageSize}`);
    const batch = Array.isArray(response.items) ? response.items : [];
    tasks.push(...batch);
    const hasMore = Boolean(response.has_more) || batch.length === pageSize;
    if (!hasMore || batch.length === 0) break;
    page += 1;
    if (page > 20) break;
  }
  return tasks;
}

export default function MyPlanningLandingPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot>({
    tasks: [],
    workspaces: [],
    orgs: [],
    enterpriseWorkspaceIds: new Set<string>(),
  });
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!user?.email;

  const loadSnapshot = useCallback(
    async (isAuto = false) => {
      if (!isAuthenticated) {
        setSnapshot({ tasks: [], workspaces: [], orgs: [], enterpriseWorkspaceIds: new Set<string>() });
        setError(null);
        setLoading(false);
        return;
      }
      if (isAuto) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [tasks, workspaceResp, orgs] = await Promise.all([
          loadTasksSnapshot(),
          teamRequest<WorkspaceListResponse>("/workspaces").catch((err) => {
            if (err instanceof TeamApiError && (err.status === 401 || err.status === 403)) return { items: [] };
            throw err;
          }),
          listOrgs().catch((err) => {
            if (err instanceof AttendanceApiError && (err.status === 401 || err.status === 403)) return [];
            throw err;
          }),
        ]);

        const enterpriseWorkspaceIds = new Set<string>();
        if (Array.isArray(orgs) && orgs.length > 0) {
          await Promise.all(
            orgs.slice(0, 12).map(async (org) => {
              try {
                const linked = await listOrgWorkspaces(org.id);
                for (const workspace of linked) {
                  const id = (workspace.id || "").trim();
                  if (id) enterpriseWorkspaceIds.add(id);
                }
              } catch {
                // Keep dashboard resilient even if one org fetch fails.
              }
            })
          );
        }

        setSnapshot({
          tasks,
          workspaces: workspaceResp.items || [],
          orgs: Array.isArray(orgs) ? orgs : [],
          enterpriseWorkspaceIds,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Impossible de synchroniser les données MyPlanning.";
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    void loadSnapshot(false);
  }, [loadSnapshot]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const timer = window.setInterval(() => {
      void loadSnapshot(true);
    }, 25000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, loadSnapshot]);

  const metrics = useMemo(() => {
    const tasks = snapshot.tasks;
    const active = tasks.filter((task) => !isDone(task));
    const done = tasks.filter((task) => isDone(task));
    const completionRate = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
    const overdue = active.filter((task) => {
      const due = parseDate(task.due_datetime || task.due_date);
      return due ? due.getTime() < Date.now() : false;
    }).length;
    const highImpact = active.filter((task) => Boolean(task.high_impact)).length;

    let free = 0;
    let pro = 0;
    let team = 0;
    let enterprise = 0;
    for (const task of tasks) {
      const level = taskLevel(task, snapshot.enterpriseWorkspaceIds);
      if (level === "free") free += 1;
      else if (level === "pro") pro += 1;
      else if (level === "team") team += 1;
      else enterprise += 1;
    }

    const recent = [...tasks]
      .sort((a, b) => {
        const aDate = parseDate(a.updated_at || a.created_at)?.getTime() || 0;
        const bDate = parseDate(b.updated_at || b.created_at)?.getTime() || 0;
        return bDate - aDate;
      })
      .slice(0, 8);

    return { total: tasks.length, active: active.length, done: done.length, completionRate, overdue, highImpact, free, pro, team, enterprise, recent };
  }, [snapshot]);

  if (authLoading || loading) {
    return (
      <div className="w-full space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-700">Chargement du tableau de pilotage...</p>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">MyPlanningAI</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Accueil intelligent synchronisé</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            Connecte-toi pour voir le dashboard live et la synchronisation automatique des tâches Free, Pro, Team et Enterprise.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/myplanning/login?redirect=/myplanning" className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
              Se connecter
            </Link>
            <Link href="/myplanning/signup?redirect=/myplanning" className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Créer un compte
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Accueil live MyPlanningAI</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Pilotage unifié: Free, Pro, Team, Enterprise</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-700">
              Les indicateurs ci-dessous se synchronisent automatiquement avec les tâches en cours de l’utilisateur.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadSnapshot(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {refreshing ? "Synchronisation..." : "Actualiser"}
            </button>
            <Link href="/myplanning/app" className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
              Ouvrir l’app
            </Link>
          </div>
        </div>
        {error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Tâches actives</p>
          <p className="mt-2 text-4xl font-black text-slate-900">{metrics.active}</p>
          <p className="mt-1 text-xs text-slate-600">Sur {metrics.total} tâches synchronisées</p>
        </article>
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Taux complété</p>
          <p className="mt-2 text-4xl font-black text-slate-900">{metrics.completionRate}%</p>
          <p className="mt-1 text-xs text-slate-600">{metrics.done} tâches terminées</p>
        </article>
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">En retard</p>
          <p className="mt-2 text-4xl font-black text-slate-900">{metrics.overdue}</p>
          <p className="mt-1 text-xs text-slate-600">Échéance dépassée</p>
        </article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Impact élevé</p>
          <p className="mt-2 text-4xl font-black text-slate-900">{metrics.highImpact}</p>
          <p className="mt-1 text-xs text-slate-600">Priorités critiques en cours</p>
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { key: "free", label: "Free", value: metrics.free, color: "bg-slate-100 text-slate-700 border-slate-200" },
          { key: "pro", label: "Pro", value: metrics.pro, color: "bg-sky-100 text-sky-700 border-sky-200" },
          { key: "team", label: "Team", value: metrics.team, color: "bg-violet-100 text-violet-700 border-violet-200" },
          { key: "enterprise", label: "Enterprise", value: metrics.enterprise, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
        ].map((item) => (
          <article key={item.key} className={`rounded-2xl border p-4 shadow-sm ${item.color}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]">{item.label}</p>
            <p className="mt-2 text-3xl font-black">{item.value}</p>
            <p className="mt-1 text-xs opacity-80">Tâches détectées</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Dernières tâches synchronisées</h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Workspaces: {snapshot.workspaces.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Orgs: {snapshot.orgs.length}
            </span>
          </div>
        </div>
        {metrics.recent.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
            Aucune tâche trouvée. Crée d’abord des tâches dans l’app Free, Pro, Team ou Enterprise.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Tâche</th>
                  <th className="px-4 py-3">Niveau</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Échéance</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recent.map((task) => {
                  const level = taskLevel(task, snapshot.enterpriseWorkspaceIds);
                  return (
                    <tr key={task.id} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-medium text-slate-900">{task.title}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {levelLabel(level)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{statusLabel(task)}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDue(task)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

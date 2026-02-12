"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { TeamApiError, Workspace, WorkspaceListResponse, teamRequest } from "./teamApi";

function formatDate(value?: string | null): string {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function roleLabel(role: Workspace["role"]): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

export default function TeamWorkspacesClient() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const isAuthenticated = !!user?.email;

  const emptyMessage = useMemo(() => {
    if (!isAuthenticated) return "Connecte-toi pour voir et créer tes workspaces Team.";
    return "Aucun workspace pour le moment. Crée le premier espace d'équipe.";
  }, [isAuthenticated]);

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await teamRequest<WorkspaceListResponse>("/workspaces");
      setWorkspaces(Array.isArray(payload?.items) ? payload.items : []);
    } catch (err) {
      if (err instanceof TeamApiError && err.status === 401) {
        setError("Session requise. Connecte-toi puis recharge la page.");
      } else {
        const message = err instanceof Error ? err.message : "Chargement impossible";
        setError(message);
      }
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  async function onCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    const name = workspaceName.trim();
    if (!name) return;

    setCreating(true);
    setError("");
    setInfo("");
    try {
      const created = await teamRequest<Workspace>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setWorkspaces((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setWorkspaceName("");
      setInfo("Workspace créé.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Création impossible";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Team</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Collaboration équipe</h1>
        <p className="mt-2 text-sm text-slate-700">
          Crée tes workspaces, invite des membres et pilote les accès sur une base Postgres unifiée.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Workspaces</h2>
          <button
            type="button"
            onClick={() => void loadWorkspaces()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Actualiser
          </button>
        </div>

        <form onSubmit={onCreateWorkspace} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="Nom du workspace (ex: Direction Opérations)"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating || !workspaceName.trim() || authLoading || !isAuthenticated}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Création..." : "Créer un workspace"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
        {info ? <p className="mt-3 text-sm font-medium text-emerald-700">{info}</p> : null}

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Chargement des workspaces...</p>
        ) : workspaces.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
            {emptyMessage}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {workspaces.map((workspace) => (
              <article key={workspace.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{workspace.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">ID: {workspace.id}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {roleLabel(workspace.role)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <p>Membres: {workspace.member_count}</p>
                  <p>Créé: {formatDate(workspace.created_at)}</p>
                </div>
                <Link
                  href={`/myplanning/team/${encodeURIComponent(workspace.id)}`}
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Gérer
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createOrg, createOrgWorkspace } from "@/app/myplanning/components/enterpriseApi";
import { TeamApiError, Workspace, WorkspaceListResponse, teamRequest } from "@/app/myplanning/team/_components/teamApi";

type WorkspaceMode = "new" | "link";

export default function EnterpriseOnboardingClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user?.email;

  const [orgName, setOrgName] = useState("");
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("new");
  const [workspaceName, setWorkspaceName] = useState("");
  const [existingWorkspaces, setExistingWorkspaces] = useState<Workspace[]>([]);
  const [existingWorkspaceId, setExistingWorkspaceId] = useState("");
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const canLinkExistingWorkspace = existingWorkspaces.length > 0;

  const loginHref = useMemo(() => {
    return "/myplanning/login?redirect=/myplanning/enterprise";
  }, []);

  async function loadWorkspaces() {
    if (!isAuthenticated) return;
    setLoadingWorkspaces(true);
    setError("");
    try {
      const payload = await teamRequest<WorkspaceListResponse>("/workspaces");
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setExistingWorkspaces(items);
      setExistingWorkspaceId((current) => current || items[0]?.id || "");
    } catch (err) {
      if (err instanceof TeamApiError && err.status === 401) {
        setError("Session requise. Connecte-toi puis réessaie.");
      } else {
        const message = err instanceof Error ? err.message : "Impossible de charger les workspaces";
        setError(message);
      }
      setExistingWorkspaces([]);
      setExistingWorkspaceId("");
    } finally {
      setLoadingWorkspaces(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (workspaceMode === "link" && !canLinkExistingWorkspace) {
      setWorkspaceMode("new");
      setExistingWorkspaceId("");
    }
  }, [workspaceMode, canLinkExistingWorkspace]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setInfo("");

    const trimmedOrg = orgName.trim();
    if (!trimmedOrg) {
      setError("Le nom de l'organisation est requis.");
      return;
    }

    const trimmedWorkspace = workspaceName.trim();
    if (workspaceMode === "new" && !trimmedWorkspace) {
      setError("Le nom du premier espace est requis.");
      return;
    }

    if (workspaceMode === "link" && !existingWorkspaceId) {
      setError("Choisis un espace à lier (ou crée-en un nouveau).");
      return;
    }

    setSubmitting(true);
    try {
      const org = await createOrg(trimmedOrg);
      const workspaceResult = await createOrgWorkspace(org.id, {
        name: workspaceMode === "new" ? trimmedWorkspace : undefined,
        workspace_id: workspaceMode === "link" ? existingWorkspaceId : undefined,
      });

      const workspaceId = workspaceResult?.workspace?.id;
      if (!workspaceId) {
        throw new Error("Workspace introuvable dans la réponse API");
      }

      setInfo("Organisation créée. Redirection vers le setup de présence…");
      router.push(`/myplanning/team/${encodeURIComponent(workspaceId)}/attendance`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Activation impossible";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Créer mon organisation</h2>
        <p className="mt-2 text-sm text-slate-700">Chargement de la session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Créer mon organisation</h2>
        <p className="mt-2 text-sm text-slate-700">
          Connecte-toi pour activer Entreprise (organisation) et lancer la configuration (espaces, présence, alertes).
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={loginHref}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Se connecter
          </Link>
          <Link
            href="/myplanning/signup?redirect=/myplanning/enterprise"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Créer mon organisation</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">
            Une organisation regroupe plusieurs espaces (workspaces) et active les modules Entreprise (présence, alertes,
            stats).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadWorkspaces()}
          disabled={loadingWorkspaces}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingWorkspaces ? "Actualisation..." : "Actualiser les espaces"}
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Organisation</span>
            <input
              value={orgName}
              onChange={(event) => setOrgName(event.target.value)}
              placeholder="Ex: INNOVAPLUS"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Premier espace</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setWorkspaceMode("new")}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
                  workspaceMode === "new"
                    ? "border-sky-600 bg-sky-50 text-sky-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Créer un espace
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode("link")}
                disabled={!canLinkExistingWorkspace}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                  workspaceMode === "link"
                    ? "border-sky-600 bg-sky-50 text-sky-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Lier un espace existant
              </button>
            </div>
            {!canLinkExistingWorkspace ? (
              <p className="text-xs text-slate-500">Aucun espace existant détecté pour l’instant.</p>
            ) : null}
          </div>
        </div>

        {workspaceMode === "new" ? (
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Nom du premier espace</span>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Ex: Direction Opérations"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </label>
        ) : (
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Espace à lier</span>
            <select
              value={existingWorkspaceId}
              onChange={(event) => setExistingWorkspaceId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            >
              {existingWorkspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {info ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !orgName.trim() || (workspaceMode === "new" && !workspaceName.trim())}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Création..." : "Créer mon organisation"}
          </button>
          <Link
            href="/myplanning/team"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Aller aux espaces
          </Link>
        </div>
      </form>
    </div>
  );
}


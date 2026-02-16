"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createOrgWorkspace,
  EnterpriseApiError,
  getOrg,
  listOrgWorkspaces,
  OrganizationDetail,
  OrganizationWorkspaceResult,
} from "@/app/myplanning/components/enterpriseApi";

type OrgDashboardPageProps = {
  params: { org_id: string };
};

function roleLabel(role: OrganizationDetail["role"]): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

function statusLabel(status: OrganizationDetail["status"]): string {
  if (status === "active") return "Active";
  return "Trial";
}

function formatDate(value?: string | null): string {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function MyPlanningOrgDashboardPage({ params }: OrgDashboardPageProps) {
  const orgId = useMemo(() => decodeURIComponent(params.org_id || "").trim(), [params.org_id]);
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user?.email;
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [workspaces, setWorkspaces] = useState<OrganizationWorkspaceResult["workspace"][]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadOrgData = useCallback(async () => {
    if (!isAuthenticated || !orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [orgDetail, orgWorkspaces] = await Promise.all([getOrg(orgId), listOrgWorkspaces(orgId)]);
      setOrg(orgDetail);
      setWorkspaces(Array.isArray(orgWorkspaces) ? orgWorkspaces : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chargement organisation impossible";
      setError(message);
      setOrg(null);
      setWorkspaces([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, orgId]);

  useEffect(() => {
    void loadOrgData();
  }, [loadOrgData]);

  async function onCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating || !orgId) return;
    const name = workspaceName.trim();
    if (!name) return;

    setCreating(true);
    setError("");
    setInfo("");
    try {
      const created = await createOrgWorkspace(orgId, { name });
      setWorkspaces((prev) => [created.workspace, ...prev.filter((item) => item.id !== created.workspace.id)]);
      setWorkspaceName("");
      setInfo("Workspace créé et lié à l’organisation.");
    } catch (err) {
      if (err instanceof EnterpriseApiError && err.status === 403) {
        setError("Accès refusé: owner/admin requis pour créer un workspace.");
      } else {
        const message = err instanceof Error ? err.message : "Création workspace impossible";
        setError(message);
      }
    } finally {
      setCreating(false);
    }
  }

  if (authLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-700">Chargement de la session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard Organisation</h1>
        <p className="mt-2 text-sm text-slate-700">Connecte-toi pour accéder aux organisations Enterprise.</p>
        <div className="mt-5">
          <Link
            href={`/myplanning/login?redirect=${encodeURIComponent(`/myplanning/orgs/${orgId}`)}`}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Enterprise Org Dashboard</p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{org?.name || "Organisation"}</h1>
            <p className="mt-1 text-xs text-slate-500">Org ID: {orgId}</p>
          </div>
          <div className="flex gap-2">
            {org ? (
              <>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {roleLabel(org.role)}
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {statusLabel(org.status)}
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/myplanning/enterprise"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retour Enterprise
          </Link>
          <button
            type="button"
            onClick={() => void loadOrgData()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Actualiser
          </button>
        </div>
      </section>

      {loading ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-700">Chargement du dashboard…</p>
        </section>
      ) : (
        <>
          {error ? (
            <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
              <p className="text-sm font-medium text-rose-700">{error}</p>
            </section>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspaces</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{org?.workspace_count ?? workspaces.length}</p>
              <p className="mt-1 text-xs text-slate-500">Espaces liés à l’organisation</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Membres</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{org?.member_count ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Membres actifs de l’organisation</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Présence</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">Attendance par workspace</p>
              <p className="mt-1 text-xs text-slate-500">Pilotage site, check-in/out et agrégats.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reporting</p>
              <p className="mt-3 text-sm font-semibold text-slate-900">Stats, alertes et intégrations</p>
              <p className="mt-1 text-xs text-slate-500">Vue consolidée portefeuille + opérations.</p>
            </article>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Créer un workspace</h2>
            <form onSubmit={onCreateWorkspace} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Nom du workspace (ex: Direction Opérations)"
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={creating || !workspaceName.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? "Création..." : "Créer workspace"}
              </button>
            </form>
            {info ? <p className="mt-3 text-sm font-medium text-emerald-700">{info}</p> : null}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Workspaces de l’organisation</h2>
            </div>
            {workspaces.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-700">
                Aucun workspace lié pour le moment.
              </div>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {workspaces.map((workspace) => (
                  <article key={workspace.id} className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-base font-semibold text-slate-900">{workspace.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">ID: {workspace.id}</p>
                    <p className="mt-3 text-xs text-slate-600">Membres: {workspace.member_count}</p>
                    <p className="mt-1 text-xs text-slate-600">Créé: {formatDate(workspace.created_at)}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/myplanning/team/${encodeURIComponent(workspace.id)}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Espaces
                      </Link>
                      <Link
                        href={`/myplanning/team/${encodeURIComponent(workspace.id)}/attendance`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Présence
                      </Link>
                      <Link
                        href="/myplanning/app/pro/stats"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Reporting
                      </Link>
                      <Link
                        href="/myplanning/app/integrations"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Alerts & Intégrations
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

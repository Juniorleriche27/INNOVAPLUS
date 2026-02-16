"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createOrg,
  createOrgWorkspace,
  createWorkspaceDepartment,
  Department,
  getWorkspaceN8nIntegration,
  patchWorkspaceN8nIntegration,
  testWorkspaceN8nIntegration,
} from "@/app/myplanning/components/enterpriseApi";
import { myplanningRequest } from "@/app/myplanning/components/attendanceApi";
import { TeamApiError, Workspace, WorkspaceListResponse, WorkspaceMember, teamRequest } from "@/app/myplanning/team/_components/teamApi";

type WorkspaceMode = "new" | "link";

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS: Record<Step, string> = {
  1: "Organisation + espace entreprise",
  2: "Départements",
  3: "Managers",
  4: "Intégration n8n",
  5: "Présence (locations)",
};

function makeNextStep(step: Step): Step {
  return (step >= 5 ? 5 : (step + 1)) as Step;
}

export default function EnterpriseOnboardingClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user?.email;

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");

  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("new");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [existingWorkspaces, setExistingWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  const [departmentName, setDepartmentName] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [managerEmail, setManagerEmail] = useState("");
  const [invites, setInvites] = useState<WorkspaceMember[]>([]);

  const [n8nUrl, setN8nUrl] = useState("");
  const [n8nEnabled, setN8nEnabled] = useState(false);
  const [n8nSecret, setN8nSecret] = useState("");
  const [n8nTesting, setN8nTesting] = useState(false);

  const [locationName, setLocationName] = useState("");

  const canLinkExistingWorkspace = existingWorkspaces.length > 0;

  const loginHref = useMemo(() => "/myplanning/login?redirect=/myplanning/enterprise/onboarding", []);

  async function loadWorkspaces() {
    if (!isAuthenticated) return;
    setLoadingWorkspaces(true);
    setError("");
    try {
      const payload = await teamRequest<WorkspaceListResponse>("/workspaces");
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setExistingWorkspaces(items);
      setWorkspaceId((current) => current || items[0]?.id || "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de charger les espaces";
      setError(message);
      setExistingWorkspaces([]);
      setWorkspaceId("");
    } finally {
      setLoadingWorkspaces(false);
    }
  }

  async function loadN8nConfig(targetWorkspaceId: string) {
    try {
      const config = await getWorkspaceN8nIntegration(targetWorkspaceId);
      setN8nUrl(config.n8n_webhook_url || "");
      setN8nEnabled(!!config.enabled);
      setN8nSecret(config.secret || "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Config n8n indisponible";
      setError(message);
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
      setWorkspaceId("");
    }
  }, [workspaceMode, canLinkExistingWorkspace]);

  async function onCreateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setInfo("");

    const trimmedOrg = orgName.trim();
    const trimmedWorkspace = workspaceName.trim();
    if (!trimmedOrg) {
      setError("Le nom de l’organisation est requis.");
      return;
    }
    if (workspaceMode === "new" && !trimmedWorkspace) {
      setError("Le nom du workspace entreprise est requis.");
      return;
    }
    if (workspaceMode === "link" && !workspaceId) {
      setError("Choisis un espace existant à lier.");
      return;
    }

    setSubmitting(true);
    try {
      const org = await createOrg(trimmedOrg);
      setOrgId(org.id);
      const createdWorkspace = await createOrgWorkspace(org.id, {
        name: workspaceMode === "new" ? trimmedWorkspace : undefined,
        workspace_id: workspaceMode === "link" ? workspaceId : undefined,
      });
      const createdWorkspaceId = createdWorkspace.workspace.id;
      setWorkspaceId(createdWorkspaceId);
      setInfo("Organisation créée. Passez à la définition des départements.");
      setCurrentStep(2);
      await loadN8nConfig(createdWorkspaceId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Activation impossible";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onAddDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !workspaceId) return;
    const name = departmentName.trim();
    if (!name) return;

    setSubmitting(true);
    setError("");
    setInfo("");
    try {
      const created = await createWorkspaceDepartment(workspaceId, name);
      setDepartments((prev) => [created, ...prev.filter((d) => d.id !== created.id)]);
      setDepartmentName("");
      setInfo("Département ajouté.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ajout département impossible";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onInviteManager(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !workspaceId) return;
    const email = managerEmail.trim();
    if (!email) return;

    setSubmitting(true);
    setError("");
    setInfo("");
    try {
      const member = await teamRequest<WorkspaceMember>(`/workspaces/${encodeURIComponent(workspaceId)}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role: "admin" }),
      });
      setInvites((prev) => [member, ...prev.filter((x) => (x.email || "").toLowerCase() !== email.toLowerCase())]);
      setManagerEmail("");
      setInfo(member.status === "pending" ? "Invitation manager envoyée." : "Manager ajouté.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invitation manager impossible";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSaveN8nConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !workspaceId) return;
    setSubmitting(true);
    setError("");
    setInfo("");
    try {
      const updated = await patchWorkspaceN8nIntegration(workspaceId, {
        n8n_webhook_url: n8nUrl.trim() || null,
        enabled: n8nEnabled,
      });
      setN8nUrl(updated.n8n_webhook_url || "");
      setN8nEnabled(!!updated.enabled);
      setN8nSecret(updated.secret || "");
      setInfo("Intégration n8n enregistrée.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Configuration n8n impossible";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onTestN8n() {
    if (!workspaceId || n8nTesting) return;
    setN8nTesting(true);
    setError("");
    setInfo("");
    try {
      const result = await testWorkspaceN8nIntegration(workspaceId);
      setInfo(`Webhook testé: status=${result.delivery_status}${result.response_code ? ` (HTTP ${result.response_code})` : ""}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test webhook impossible";
      setError(message);
    } finally {
      setN8nTesting(false);
    }
  }

  async function onAddAttendanceLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !workspaceId) return;
    const name = locationName.trim();
    if (!name) return;
    setSubmitting(true);
    setError("");
    setInfo("");
    try {
      await myplanningRequest(`/workspaces/${encodeURIComponent(workspaceId)}/attendance/locations`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setLocationName("");
      setInfo("Point de présence créé.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Création location impossible";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function goNextStep() {
    setCurrentStep((prev) => makeNextStep(prev));
    setError("");
    setInfo("");
  }

  function onFinish() {
    if (!workspaceId) return;
    router.push(`/myplanning/orgs/${encodeURIComponent(orgId)}?workspace_id=${encodeURIComponent(workspaceId)}`);
  }

  if (authLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Onboarding Entreprise</h1>
        <p className="mt-2 text-sm text-slate-700">Chargement de la session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Onboarding Entreprise</h1>
        <p className="mt-2 text-sm text-slate-700">
          Connecte-toi pour activer ton organisation Entreprise (espaces, départements, managers, intégrations).
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={loginHref}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Se connecter
          </Link>
          <Link
            href="/myplanning/signup?redirect=/myplanning/enterprise/onboarding"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Enterprise onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Activer une organisation Entreprise</h1>
        <p className="mt-2 text-sm text-slate-700">
          Team = Espaces. Entreprise = Organisation complète avec gouvernance, intégrations et reporting.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-5">
          {([1, 2, 3, 4, 5] as Step[]).map((step) => (
            <div
              key={step}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                step <= currentStep ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              {step}. {STEP_LABELS[step]}
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {info ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</p> : null}

      {currentStep === 1 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">1) Créer l’organisation et le premier espace</h2>
          <form onSubmit={onCreateOrganization} className="mt-4 space-y-4">
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
                  Créer un espace entreprise
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
            </div>
            {workspaceMode === "new" ? (
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Nom du workspace entreprise</span>
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
                <div className="flex gap-2">
                  <select
                    value={workspaceId}
                    onChange={(event) => setWorkspaceId(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    {existingWorkspaces.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void loadWorkspaces()}
                    disabled={loadingWorkspaces}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {loadingWorkspaces ? "..." : "Actualiser"}
                  </button>
                </div>
              </label>
            )}
            <button
              type="submit"
              disabled={submitting || !orgName.trim() || (workspaceMode === "new" && !workspaceName.trim())}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Activation..." : "Activer l’organisation"}
            </button>
          </form>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">2) Départements</h2>
          <p className="mt-2 text-sm text-slate-700">Créez les groupes métiers de l’organisation.</p>
          <form onSubmit={onAddDepartment} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={departmentName}
              onChange={(event) => setDepartmentName(event.target.value)}
              placeholder="Ex: Opérations"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !departmentName.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              Ajouter
            </button>
          </form>
          {departments.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {departments.map((dep) => (
                <li key={dep.id} className="rounded-xl border border-slate-200 px-3 py-2">
                  {dep.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Ajoutez au moins un département.</p>
          )}
          <button
            type="button"
            onClick={goNextStep}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continuer
          </button>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">3) Inviter 1-2 managers</h2>
          <form onSubmit={onInviteManager} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={managerEmail}
              onChange={(event) => setManagerEmail(event.target.value)}
              placeholder="manager@entreprise.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !managerEmail.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              Inviter
            </button>
          </form>
          {invites.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {invites.map((member) => (
                <li key={`${member.email}-${member.status}`} className="rounded-xl border border-slate-200 px-3 py-2">
                  {(member.email || "membre")} · {member.status}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Invitez au moins un manager (role admin).</p>
          )}
          <button
            type="button"
            onClick={goNextStep}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Continuer
          </button>
        </section>
      ) : null}

      {currentStep === 4 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">4) Activer une intégration n8n</h2>
          <form onSubmit={onSaveN8nConfig} className="mt-4 space-y-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Webhook URL n8n</span>
              <input
                type="url"
                value={n8nUrl}
                onChange={(event) => setN8nUrl(event.target.value)}
                placeholder="https://n8n.example/webhook/..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={n8nEnabled} onChange={(event) => setN8nEnabled(event.target.checked)} />
              Intégration active
            </label>
            {n8nSecret ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">Secret signature HMAC: {n8nSecret}</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => void onTestN8n()}
                disabled={n8nTesting}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {n8nTesting ? "Test..." : "Tester"}
              </button>
              <button
                type="button"
                onClick={goNextStep}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Continuer
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {currentStep === 5 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900">5) Activer la présence</h2>
          <p className="mt-2 text-sm text-slate-700">Créez le premier point de présence (location).</p>
          <form onSubmit={onAddAttendanceLocation} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              placeholder='Ex: "Entrée principale"'
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !locationName.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              Créer
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={workspaceId ? `/myplanning/team/${encodeURIComponent(workspaceId)}/attendance` : "/myplanning/team"}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ouvrir attendance workspace
            </Link>
            <button
              type="button"
              onClick={onFinish}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Terminer et ouvrir dashboard
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

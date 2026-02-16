"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getWorkspaceN8nIntegration,
  patchWorkspaceN8nIntegration,
  testWorkspaceN8nIntegration,
} from "@/app/myplanning/components/enterpriseApi";
import { Workspace, WorkspaceListResponse, teamRequest } from "@/app/myplanning/team/_components/teamApi";

export default function MyPlanningIntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user?.email;
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const selectedWorkspace = useMemo(() => workspaces.find((w) => w.id === workspaceId) || null, [workspaces, workspaceId]);

  async function loadWorkspaces() {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const payload = await teamRequest<WorkspaceListResponse>("/workspaces");
      const items = Array.isArray(payload?.items) ? payload.items : [];
      setWorkspaces(items);
      setWorkspaceId((current) => current || items[0]?.id || "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chargement espaces impossible";
      setError(message);
      setWorkspaces([]);
      setWorkspaceId("");
    } finally {
      setLoading(false);
    }
  }

  async function loadIntegration(targetWorkspaceId: string) {
    if (!targetWorkspaceId) return;
    setError("");
    try {
      const config = await getWorkspaceN8nIntegration(targetWorkspaceId);
      setWebhookUrl(config.n8n_webhook_url || "");
      setEnabled(!!config.enabled);
      setSecret(config.secret || "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chargement intégration impossible";
      setError(message);
      setWebhookUrl("");
      setEnabled(false);
      setSecret("");
    }
  }

  useEffect(() => {
    void loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!workspaceId) return;
    void loadIntegration(workspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceId || saving) return;
    setSaving(true);
    setError("");
    setInfo("");
    try {
      const updated = await patchWorkspaceN8nIntegration(workspaceId, {
        n8n_webhook_url: webhookUrl.trim() || null,
        enabled,
      });
      setWebhookUrl(updated.n8n_webhook_url || "");
      setEnabled(!!updated.enabled);
      setSecret(updated.secret || "");
      setInfo("Intégration n8n enregistrée.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Enregistrement impossible";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    if (!workspaceId || testing) return;
    setTesting(true);
    setError("");
    setInfo("");
    try {
      const result = await testWorkspaceN8nIntegration(workspaceId);
      setInfo(`Test OK: status=${result.delivery_status}${result.response_code ? ` (HTTP ${result.response_code})` : ""}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test webhook impossible";
      setError(message);
    } finally {
      setTesting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Intégrations</h1>
        <p className="mt-2 text-sm text-slate-700">Chargement de la session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Intégrations</h1>
        <p className="mt-2 text-sm text-slate-700">Connecte-toi pour gérer les webhooks n8n.</p>
        <div className="mt-4">
          <Link
            href="/myplanning/login?redirect=/myplanning/app/integrations"
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
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Integrations</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Connecter n8n</h1>
        <p className="mt-2 text-sm text-slate-700">
          Configure un webhook n8n par espace pour relier MyPlanning à Notion, Google Calendar, Slack ou vos flux internes.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Configuration n8n</h2>
          <button
            type="button"
            onClick={() => void loadWorkspaces()}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Chargement..." : "Actualiser"}
          </button>
        </div>

        <form onSubmit={onSave} className="mt-4 space-y-4">
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Espace</span>
            <select
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Webhook URL n8n</span>
            <input
              type="url"
              value={webhookUrl}
              onChange={(event) => setWebhookUrl(event.target.value)}
              placeholder="https://n8n.example/webhook/..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
            Activer l’intégration
          </label>

          {secret ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Secret HMAC</p>
              <p className="mt-1 break-all text-sm text-slate-700">{secret}</p>
            </div>
          ) : null}

          {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
          {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!workspaceId || saving}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => void onTest()}
              disabled={!workspaceId || testing}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {testing ? "Test..." : "Tester"}
            </button>
            {selectedWorkspace ? (
              <Link
                href={`/myplanning/team/${encodeURIComponent(selectedWorkspace.id)}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ouvrir espace
              </Link>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}

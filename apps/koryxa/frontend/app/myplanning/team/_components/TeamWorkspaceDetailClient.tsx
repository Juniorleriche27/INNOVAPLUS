"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { TeamApiError, Workspace, WorkspaceMember, WorkspaceMembersResponse, teamRequest } from "./teamApi";

type Props = {
  workspaceId: string;
};

function memberName(member: WorkspaceMember): string {
  const first = (member.first_name || "").trim();
  const last = (member.last_name || "").trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return member.email || "Utilisateur";
}

function roleLabel(role: WorkspaceMember["role"]): string {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

function statusLabel(status: WorkspaceMember["status"]): string {
  if (status === "pending") return "Pending";
  return "Active";
}

export default function TeamWorkspaceDetailClient({ workspaceId }: Props) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const currentEmail = (user?.email || "").toLowerCase();

  const currentMember = useMemo(
    () =>
      members.find(
        (member) =>
          member.status === "active" &&
          (member.email || "").toLowerCase() === currentEmail,
      ),
    [members, currentEmail],
  );
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [workspacePayload, membersPayload] = await Promise.all([
        teamRequest<Workspace>(`/workspaces/${encodeURIComponent(workspaceId)}`),
        teamRequest<WorkspaceMembersResponse>(`/workspaces/${encodeURIComponent(workspaceId)}/members`),
      ]);
      setWorkspace(workspacePayload);
      setMembers(Array.isArray(membersPayload?.items) ? membersPayload.items : []);
    } catch (err) {
      if (err instanceof TeamApiError && err.status === 404) {
        setError("Workspace introuvable ou accès non autorisé.");
      } else if (err instanceof TeamApiError && err.status === 401) {
        setError("Session requise. Connecte-toi puis recharge la page.");
      } else {
        const message = err instanceof Error ? err.message : "Chargement impossible";
        setError(message);
      }
      setWorkspace(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  async function onInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inviting) return;
    const email = inviteEmail.trim();
    if (!email) return;

    setInviting(true);
    setError("");
    setInfo("");
    try {
      const created = await teamRequest<WorkspaceMember>(`/workspaces/${encodeURIComponent(workspaceId)}/members`, {
        method: "POST",
        body: JSON.stringify({ email, role: inviteRole }),
      });
      setMembers((prev) => {
        const existingIndex = prev.findIndex(
          (item) => (item.email || "").toLowerCase() === (created.email || "").toLowerCase(),
        );
        if (existingIndex >= 0) {
          const clone = [...prev];
          clone[existingIndex] = created;
          return clone;
        }
        return [...prev, created];
      });
      setInviteEmail("");
      setInviteRole("member");
      setInfo(created.status === "pending" ? "Invitation envoyée (pending)." : "Membre ajouté.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invitation impossible";
      setError(message);
    } finally {
      setInviting(false);
    }
  }

  async function onRemoveMember(userId: string) {
    if (!userId || removingId) return;
    setRemovingId(userId);
    setError("");
    setInfo("");
    try {
      await teamRequest<{ ok: boolean }>(
        `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      setMembers((prev) => prev.filter((member) => member.user_id !== userId));
      setInfo("Membre retiré.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Suppression impossible";
      setError(message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Team</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{workspace?.name || "Workspace Team"}</h1>
            <p className="mt-2 text-sm text-slate-700">ID: {workspaceId}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/myplanning/team/${encodeURIComponent(workspaceId)}/attendance`}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Attendance
            </Link>
            <Link
              href="/myplanning/team"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Retour Team
            </Link>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {info ? <p className="text-sm font-medium text-emerald-700">{info}</p> : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Membres</h2>
          <button
            type="button"
            onClick={() => void loadWorkspaceData()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Actualiser
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Chargement des membres...</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Aucun membre.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {members.map((member) => {
              const canRemove = canManage && member.status === "active" && member.role !== "owner" && !!member.user_id;
              return (
                <article key={`${member.user_id || member.email}-${member.status}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{memberName(member)}</p>
                      <p className="mt-1 text-xs text-slate-500">{member.email || "Email non disponible"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {roleLabel(member.role)}
                      </span>
                      <span
                        className={
                          member.status === "pending"
                            ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
                            : "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                        }
                      >
                        {statusLabel(member.status)}
                      </span>
                      {canRemove ? (
                        <button
                          type="button"
                          onClick={() => void onRemoveMember(member.user_id as string)}
                          disabled={removingId === member.user_id}
                          className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingId === member.user_id ? "Retrait..." : "Retirer"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Inviter par email</h2>
        <p className="mt-2 text-sm text-slate-700">
          Ajoute un membre actif si le compte existe, sinon une invitation sera créée en statut pending.
        </p>
        {!canManage && !loading ? (
          <p className="mt-3 text-sm font-medium text-amber-700">Seuls les rôles owner/admin peuvent inviter ou retirer des membres.</p>
        ) : null}

        <form onSubmit={onInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.target.value)}
            placeholder="email.membre@exemple.com"
            className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          />
          <select
            value={inviteRole}
            onChange={(event) => setInviteRole(event.target.value as "admin" | "member")}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim() || !canManage}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {inviting ? "Envoi..." : "Inviter"}
          </button>
        </form>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AUTH_API_BASE } from "@/lib/env";

export default function JoinGroupButton({ groupId }: { groupId: string }) {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500">Chargement…</div>;
  }

  if (!user?.email) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(`/community/groups/${groupId}`)}`}
        className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
      >
        Se connecter pour rejoindre
      </Link>
    );
  }

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE}/api/groups/${encodeURIComponent(groupId)}/join`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Impossible de rejoindre ce groupe.");
      }
      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de rejoindre ce groupe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void join()}
        disabled={busy || joined}
        className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {joined ? "Groupe rejoint" : busy ? "Connexion..." : "Rejoindre le groupe"}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}


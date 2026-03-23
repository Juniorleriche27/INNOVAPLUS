"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AUTH_API_BASE } from "@/lib/env";

type GroupOption = {
  id: string;
  name: string;
};

export default function CommunityComposer({
  groups,
  defaultGroupId,
}: {
  groups: GroupOption[];
  defaultGroupId?: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState(defaultGroupId || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm text-slate-500">Chargement du compositeur…</div>;
  }

  if (!user?.email) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/94 p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-950">Publier une note dans le réseau IA</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Connectez-vous pour publier un post, rejoindre des groupes et participer aux discussions KORYXA.
        </p>
        <Link
          href="/login?redirect=%2Fcommunity"
          className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  async function submitPost() {
    if (!title.trim() || !body.trim()) {
      setError("Ajoutez un titre et un contenu avant de publier.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE}/api/posts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          group_id: groupId || undefined,
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Publication impossible pour le moment.");
      }
      setTitle("");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white/94 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Composer</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Publier une note utile</h2>
        </div>
        <Link href="/community/messages" className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
          Ouvrir les messages
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titre de votre publication"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          placeholder="Partagez une réflexion, une preuve, un cas d’usage ou un retour de terrain."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        />
        <select
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
        >
          <option value="">Publier sans groupe spécifique</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void submitPost()}
          disabled={busy}
          className="btn-primary disabled:opacity-60"
        >
          {busy ? "Publication..." : "Publier dans le réseau"}
        </button>
      </div>
    </div>
  );
}


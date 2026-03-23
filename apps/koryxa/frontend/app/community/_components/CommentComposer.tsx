"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AUTH_API_BASE } from "@/lib/env";

export default function CommentComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-sm text-slate-500">Chargement…</div>;
  }

  if (!user?.email) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/94 p-5 shadow-sm">
        <p className="text-sm text-slate-600">Connectez-vous pour commenter et participer à la discussion.</p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/community/posts/${postId}`)}`}
          className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  async function submitComment() {
    if (!body.trim()) {
      setError("Ajoutez un commentaire avant d'envoyer.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${AUTH_API_BASE}/api/posts/${encodeURIComponent(postId)}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Commentaire impossible.");
      }
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commentaire impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white/94 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Répondre</p>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        placeholder="Ajoutez une réponse utile, structurée et contextualisée."
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
      />
      {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
      <div className="mt-4">
        <button type="button" onClick={() => void submitComment()} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Envoi..." : "Publier le commentaire"}
        </button>
      </div>
    </div>
  );
}


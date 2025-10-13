// app/meet/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TelemetryPing from "@/components/util/TelemetryPing";

type Post = {
  id: string;
  author: string;
  country: string;
  tags: string[];
  text: string;
  likes: number;
  comments: number;
};

export default function MeetPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  // In real app, derive from auth/session
  const isConnected = false;

  useEffect(() => {
    // Simulate initial load
    const t = setTimeout(() => {
      setItems(gen(1));
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  function gen(p: number): Post[] {
    return Array.from({ length: 5 }).map((_, i) => ({
      id: `${p}-${i}`,
      author: `Auteur ${i + 1 + (p - 1) * 5}`,
      country: ["CI", "SN", "BJ", "BF"][i % 4],
      tags: ["#agritech", "#pricing", "#ai"].slice(0, (i % 3) + 1),
      text:
        "Besoin terrain: optimisation des prix pour coopératives, recherche retours d'expérience et solutions data/IA adaptées au contexte local.",
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 12),
    }));
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    setLoading(true);
    setTimeout(() => {
      setItems((cur) => [...cur, ...gen(next)]);
      setLoading(false);
    }, 400);
  }

  const charCount = useMemo(() => draft.length, [draft]);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
      <TelemetryPing name="view_meet" />
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">INNOVA-MEET</h1>
          <p className="text-sm text-slate-500">Réseau social intégré – besoins, solutions, succès.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/meet/new" className="btn-primary">Créer un post</Link>
        </div>
      </header>

      {/* Composer */}
      <section className="mx-auto mb-6 w-full max-w-[720px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Partagez une idée, un besoin ou une réussite…"
          maxLength={500}
          disabled={!isConnected}
          className="h-28 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm disabled:bg-slate-50 disabled:text-slate-400"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{charCount}/500</span>
          <button disabled={!isConnected || charCount === 0} className="btn-secondary disabled:opacity-50">Publier</button>
        </div>
      </section>

      {/* Feed centré */}
      <section className="mx-auto w-full max-w-[720px]">
        {items.map((p) => (
          <article key={p.id} className="mb-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <header className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">{p.author.slice(0,2)}</span>
                <div>
                  <p className="font-semibold text-slate-800">{p.author}</p>
                  <p className="text-xs text-slate-500">{p.country} · {p.tags.join(' ')}</p>
                </div>
              </div>
            </header>
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{p.text}</p>
            <footer className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <button className="rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-50">👍 Like ({p.likes})</button>
              <button className="rounded-full border border-slate-200 px-3 py-1.5 hover:bg-slate-50">💬 Comment ({p.comments})</button>
            </footer>
          </article>
        ))}

        {/* Skeletons while loading */}
        {loading && (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-36 w-full animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {/* Incremental pagination */}
        <div className="mt-4 flex items-center justify-center">
          <button onClick={loadMore} className="btn-secondary">Charger plus</button>
        </div>
      </section>
    </main>
  );
}


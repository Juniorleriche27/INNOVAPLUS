"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TelemetryPing from "@/components/util/TelemetryPing";
import { apiMeet, type MeetPost } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

type Filter = {
  country: string;
  tags: string[];
  sort: "recent" | "relevant";
};

export default function MeetPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<MeetPost[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [filters, setFilters] = useState<Filter>({
    country: "all",
    tags: [],
    sort: "recent"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [openComments, setOpenComments] = useState<Record<string, { loading: boolean; items: Array<{ comment_id: string; user_id: string; author?: string; text: string; created_at: string }>; draft: string }>>({});
  const { user } = useAuth();
  const isConnected = !!user;
  const userId = user?.id ?? null;
  const author =
    user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "Utilisateur";

  const charCount = useMemo(() => draft.length, [draft]);
  const maxChars = 280;

  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    if (filters.country !== "all") {
      filtered = filtered.filter(p => (p.country || "").toUpperCase() === filters.country);
    }
    
    if (filters.tags.length > 0) {
      filtered = filtered.filter(p => 
        filters.tags.some(tag => (p.tags || []).includes(tag))
      );
    }
    
    if (filters.sort === "recent") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      filtered.sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0));
    }
    
    return filtered;
  }, [items, filters]);

  const computeTrendingTags = useCallback((posts: MeetPost[]) => {
    const tagCounts: Record<string, number> = {};
    posts.forEach((p) => (p.tags || []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);
  }, []);

  const loadFeed = useCallback(async (nextPage: number, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiMeet.feed({ limit: 20, offset: nextPage * 20 });
      const newItems = res.items;
      setItems((previous) => {
        const combined = reset ? newItems : [...previous, ...newItems];
        setTrendingTags(computeTrendingTags(combined));
        return combined;
      });
      setPage(nextPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger le feed");
    } finally {
      setLoading(false);
    }
  }, [computeTrendingTags]);

  useEffect(() => {
    void loadFeed(0, true);
  }, [loadFeed]);

  function loadMore() {
    void loadFeed(page + 1, false);
  }

  async function handlePublish() {
    if (!draft.trim() || !isConnected || posting) return;
    setPosting(true);
    setError(null);
    try {
      const tags = draft.match(/#\w+/g) || [];
      const payload = {
        user_id: userId || "frontend-user",
        author,
        text: draft.trim(),
        tags,
        country: (filters.country !== "all" ? filters.country : undefined) || "CI",
      };
      const r = await apiMeet.create(payload);
      const created: MeetPost = {
        id: r.post_id,
        user_id: payload.user_id,
        author: payload.author,
        text: payload.text,
        tags,
        country: payload.country,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
      };
      setItems((cur) => [created, ...cur]);
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publication impossible");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(post: MeetPost) {
    if (!isConnected || !userId) return;
    const already = liked.has(post.id);
    try {
      await apiMeet.like({
        post_id: post.id,
        user_id: userId,
        action: already ? "unlike" : "like",
      });
      setLiked((prev) => {
        const next = new Set(prev);
        if (already) next.delete(post.id);
        else next.add(post.id);
        return next;
      });
      setItems((cur) =>
        cur.map((p) =>
          p.id === post.id ? { ...p, likes_count: (p.likes_count || 0) + (already ? -1 : 1) } : p
        )
      );
    } catch {
      setError("Like impossible");
    }
  }

  async function loadComments(post: MeetPost) {
    setOpenComments((prev) => ({ ...prev, [post.id]: { loading: true, items: [], draft: "" } }));
    try {
      const res = await apiMeet.comments(post.id);
      setOpenComments((prev) => ({ ...prev, [post.id]: { loading: false, items: res.items, draft: "" } }));
    } catch {
      setError("Commentaires indisponibles");
      setOpenComments((prev) => ({ ...prev, [post.id]: { loading: false, items: [], draft: "" } }));
    }
  }

  async function submitComment(post: MeetPost) {
    const box = openComments[post.id];
    if (!isConnected || !userId || !box || !box.draft.trim()) return;
    try {
      const payload = {
        post_id: post.id,
        user_id: userId,
        author,
        text: box.draft.trim(),
      };
      const r = await apiMeet.comment(payload);
      const newItem = {
        comment_id: r.comment_id,
        post_id: post.id,
        user_id: payload.user_id,
        author: payload.author,
        text: payload.text,
        created_at: new Date().toISOString(),
      };
      setOpenComments((prev) => ({
        ...prev,
        [post.id]: { loading: false, draft: "", items: [newItem, ...(prev[post.id]?.items || [])] },
      }));
      setItems((cur) => cur.map((p) => (p.id === post.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p)));
    } catch {
      setError("Commentaire impossible");
    }
  }

  const formatTime = (iso: string) => {
    const ts = new Date(iso).getTime();
    const now = Date.now();
    const diff = now - ts;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));
    if (days > 0) return `il y a ${days}j`;
    if (hours > 0) return `il y a ${hours}h`;
    if (minutes > 0) return `il y a ${minutes}min`;
    return "à l'instant";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-[1200px] px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
        <TelemetryPing name="view_meet" />
        
        {/* Header */}
        <header className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">KORYXA Meet</h1>
            <p className="text-sm text-slate-500">Partagez besoins, solutions et succès</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
            </button>
            <a
              href="#composer"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-3 sm:px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer un post
            </a>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Composer */}
            <section id="composer" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-semibold text-sm">
                  {isConnected ? "VO" : "?"}
                </div>
                <div className="flex-1">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Partagez une idée, un besoin ou une réussite…"
                    maxLength={maxChars}
                    disabled={!isConnected}
                    className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm disabled:bg-slate-50 disabled:text-slate-400 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    rows={3}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={`${charCount > maxChars * 0.9 ? 'text-amber-600' : ''}`}>
                        {charCount}/{maxChars}
                      </span>
                    </div>
                    <button 
                      onClick={handlePublish}
                      disabled={!isConnected || charCount === 0 || charCount > maxChars || posting}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {posting ? "Publication..." : "Publier"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Filters */}
            {showFilters && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Pays</label>
                    <select
                      value={filters.country}
                      onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="all">Tous les pays</option>
                      <option value="CI">Côte d'Ivoire</option>
                      <option value="SN">Sénégal</option>
                      <option value="BJ">Bénin</option>
                      <option value="BF">Burkina Faso</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {trendingTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => setFilters(prev => ({
                            ...prev,
                            tags: prev.tags.includes(tag)
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag]
                          }))}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            filters.tags.includes(tag)
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tri</label>
                    <select
                      value={filters.sort}
                      onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as "recent" | "relevant" }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                    >
                      <option value="recent">Plus récents</option>
                      <option value="relevant">Plus pertinents</option>
                    </select>
                  </div>
                </div>
              </section>
            )}

            {/* Feed */}
            <section className="space-y-3 sm:space-y-4">
              {filteredItems.map((post) => (
                <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                  <header className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-sm">
                        {(post.author || post.user_id || "US").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{post.author || post.user_id || "Utilisateur"}</h3>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {post.country || "ND"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{formatTime(post.created_at)}</p>
                      </div>
                    </div>
                  </header>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {post.text}
                    </p>
                  </div>
                  
                  {post.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {post.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                 )}
                  
                  <footer className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(post)}
                      disabled={!isConnected}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                        liked.has(post.id)
                          ? "bg-sky-100 text-sky-700"
                          : "text-slate-600 hover:bg-slate-100"
                      } disabled:opacity-50`}
                    >
                      <svg className="h-4 w-4" fill={liked.has(post.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {post.likes_count ?? 0}
                    </button>
                    <button
                      onClick={() => {
                        if (!openComments[post.id]) loadComments(post);
                        else
                          setOpenComments((prev) => {
                            const next = { ...prev };
                            delete next[post.id];
                            return next;
                          });
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-sky-700"
                    >
                      Commentaires : {post.comments_count ?? 0}
                    </button>
                    <span className="text-xs text-slate-500">#{(post.tags || []).length} tags</span>
                  </footer>

                  {openComments[post.id] && (
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                      <div className="flex items-start gap-2">
                        <textarea
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none"
                          rows={2}
                          placeholder="Écrire un commentaire..."
                          value={openComments[post.id]?.draft || ""}
                          onChange={(e) =>
                            setOpenComments((prev) => ({
                              ...prev,
                              [post.id]: { ...(prev[post.id] || { items: [], loading: false, draft: "" }), draft: e.target.value },
                            }))
                          }
                        />
                        <button
                          onClick={() => submitComment(post)}
                          disabled={!isConnected || openComments[post.id]?.draft.trim() === ""}
                          className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Envoyer
                        </button>
                      </div>
                      {openComments[post.id]?.loading && <p className="text-xs text-slate-500">Chargement...</p>}
                      <div className="space-y-2">
                        {(openComments[post.id]?.items || []).map((c) => (
                          <div key={c.comment_id} className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-xs font-semibold text-slate-800">{c.author || c.user_id}</p>
                            <p className="text-sm text-slate-700">{c.text}</p>
                            <p className="text-[11px] text-slate-500">{formatTime(c.created_at)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}

              {/* Loading skeletons */}
              {loading && (
                <div className="space-y-4" aria-busy="true" aria-live="polite">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              )}

              {/* Load more */}
              <div className="flex items-center justify-center pt-4">
                <button 
                  onClick={loadMore}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 transition-colors"
                >
                  Charger plus
                </button>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Trending Tags */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Tendances</h3>
              <div className="space-y-3">
                {trendingTags.map((tag, index) => (
                  <div key={tag} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{tag}</span>
                    <span className="text-xs text-slate-500">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Stats */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Communauté</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Membres actifs</span>
                  <span className="text-sm font-semibold text-slate-900">2,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Posts aujourd'hui</span>
                  <span className="text-sm font-semibold text-slate-900">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Pays représentés</span>
                  <span className="text-sm font-semibold text-slate-900">12</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

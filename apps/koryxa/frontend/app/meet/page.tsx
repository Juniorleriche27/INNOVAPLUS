"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TelemetryPing from "@/components/util/TelemetryPing";

type Post = {
  id: string;
  author: string;
  authorId: string;
  country: string;
  tags: string[];
  text: string;
  likes: number;
  comments: number;
  timestamp: number;
  isLiked?: boolean;
};

type Filter = {
  country: string;
  tags: string[];
  sort: "recent" | "relevant";
};

export default function MeetPage() {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [filters, setFilters] = useState<Filter>({
    country: "all",
    tags: [],
    sort: "recent"
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trendingTags, setTrendingTags] = useState<string[]>([]);
  
  // In real app, derive from auth/session
  const isConnected = true; // Temporarily true for demo

  useEffect(() => {
    // Simulate initial load
    const t = setTimeout(() => {
      setItems(gen(1));
      setTrendingTags(["#agritech", "#fintech", "#edtech", "#healthtech", "#logistics"]);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  function gen(p: number): Post[] {
    const countries = ["CI", "SN", "BJ", "BF", "ML", "NE", "TG"];
    const allTags = ["#agritech", "#fintech", "#edtech", "#healthtech", "#logistics", "#energy", "#transport"];
    
    return Array.from({ length: 5 }).map((_, i) => ({
      id: `${p}-${i}`,
      author: `Auteur ${i + 1 + (p - 1) * 5}`,
      authorId: `user-${i + 1}`,
      country: countries[i % countries.length],
      tags: allTags.slice(0, (i % 3) + 1),
      text: [
        "Besoin terrain: optimisation des prix pour coopératives, recherche retours d'expérience et solutions data/IA adaptées au contexte local.",
        "Succès partagé: notre solution de paiement mobile a permis d'augmenter les revenus de 40% pour 200+ commerçants à Dakar.",
        "Recherche partenaire technique pour développer une plateforme de gestion des stocks avec IA prédictive.",
        "Formation disponible: méthodologies agiles pour startups tech en Afrique de l'Ouest. Prochaine session le 15/11.",
        "Appel à projets: financement disponible pour solutions innovantes dans l'agriculture durable. Dossier avant le 30/11."
      ][i % 5],
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 12),
      timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Last 7 days
      isLiked: Math.random() > 0.7
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
  const maxChars = 280;

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    if (filters.country !== "all") {
      filtered = filtered.filter(p => p.country === filters.country);
    }
    
    if (filters.tags.length > 0) {
      filtered = filtered.filter(p => 
        filters.tags.some(tag => p.tags.includes(tag))
      );
    }
    
    if (filters.sort === "recent") {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      // Sort by engagement (likes + comments)
      filtered.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
    }
    
    return filtered;
  }, [items, filters]);

  const handleLike = (postId: string) => {
    setItems(prev => prev.map(p => 
      p.id === postId 
        ? { 
            ...p, 
            isLiked: !p.isLiked, 
            likes: p.isLiked ? p.likes - 1 : p.likes + 1 
          }
        : p
    ));
  };

  const handlePublish = () => {
    if (!draft.trim() || !isConnected) return;
    
    const newPost: Post = {
      id: `new-${Date.now()}`,
      author: "Vous",
      authorId: "current-user",
      country: "CI", // Default
      tags: draft.match(/#\w+/g) || [],
      text: draft,
      likes: 0,
      comments: 0,
      timestamp: Date.now(),
      isLiked: false
    };
    
    setItems(prev => [newPost, ...prev]);
    setDraft("");
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
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
      <main className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
        <TelemetryPing name="view_meet" />
        
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">KORYXA Meet</h1>
            <p className="text-sm text-slate-500">Réseau social KORYXA – partagez besoins, solutions et succès</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
            </button>
            <Link 
              href="/meet/new" 
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer un post
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Composer */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                      disabled={!isConnected || charCount === 0 || charCount > maxChars}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Publier
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Filters */}
            {showFilters && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <section className="space-y-4">
              {filteredItems.map((post) => (
                <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <header className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-sm">
                        {post.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{post.author}</h3>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                            {post.country}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{formatTime(post.timestamp)}</p>
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
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                        post.isLiked
                          ? 'bg-sky-100 text-sky-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <svg className="h-4 w-4" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {post.likes}
                    </button>
                    
                    <button className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.comments}
                    </button>
                    
                    <button className="flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Partager
                    </button>
                  </footer>
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
          <div className="space-y-6">
            {/* Trending Tags */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Tendances</h3>
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
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Communauté</h3>
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

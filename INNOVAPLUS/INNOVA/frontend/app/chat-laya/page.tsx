// innova-frontend/app/chat-laya/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SVGProps } from "react";

/** Base API */
const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

/** Types basiques */
type Hit = {
  id: string;
  score: number;
  payload: {
    text?: string;
    title?: string;
    source?: string;
    url?: string;
    type?: string;
    [k: string]: unknown;
  } | null;
};

type ChatTurn = { role: "user" | "assistant"; text: string; sources?: Hit[] };

type IconProps = SVGProps<SVGSVGElement>;

/** Petit util */
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const errorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Erreur inconnue";
  }
};

function IconSun(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx={12} cy={12} r={4} />
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36l-1.42 1.42M7.05 16.95 5.63 18.37m12.72 0-1.41-1.42M7.05 7.05 5.63 5.63" />
    </svg>
  );
}

function IconMoon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
    </svg>
  );
}

function IconUpload(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 16V4m0 0l-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx={11} cy={11} r={6} />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChat(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M21 12a8.5 8.5 0 0 1-11.7 7.86L5 21l1.14-3.42A8.5 8.5 0 1 1 21 12Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Page */
export default function ChatLayaPage() {
  /** Onglets */
  const [tab, setTab] = useState<"search" | "chat">("search");

  /** Recherche */
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[]>([]);
  const [ran, setRan] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  /** Filtres */
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  /** Chat */
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);

  /** Upload */
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  /** UI refs */
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /** Dark mode toggle */
  const [dark, setDark] = useState<boolean>(() =>
    typeof window === "undefined"
      ? false
      : localStorage.getItem("innova.theme") === "dark" ||
        (matchMedia?.("(prefers-color-scheme: dark)").matches ?? false)
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("innova.theme", dark ? "dark" : "light");
  }, [dark]);

  /** Historique */
  useEffect(() => {
    try {
      const storedQ = localStorage.getItem("innova.rag.lastQ");
      if (storedQ) setQ(storedQ);
      const storedTurns = localStorage.getItem("innova.chat.turns");
      if (storedTurns) setTurns(JSON.parse(storedTurns));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("innova.chat.turns", JSON.stringify(turns.slice(-50)));
    } catch {}
  }, [turns]);
  useEffect(() => {
    try {
      if (q) localStorage.setItem("innova.rag.lastQ", q);
    } catch {}
  }, [q]);

  /** Raccourcis clavier */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setTab("search");
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && q) setQ("");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q]);

  /** Auto-scroll chat */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [turns, thinking]);

  /** Actions : Recherche */
  async function runSearch(query: string) {
    const t0 = performance.now();
    setLoading(true);
    setErr(null);
    setHits([]);
    setRan(true);

    try {
      const resp = await fetch(`${API}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: Hit[] = await resp.json();
      setHits(data || []);
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setElapsed(performance.now() - t0);
      setLoading(false);
    }
  }

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    runSearch(query);
  }

  /** Actions : Chat */
  async function runChat(question: string) {
    setThinking(true);
    setTurns((prev) => [...prev, { role: "user", text: question }]);

    try {
      const resp = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setTurns((prev) => [...prev, { role: "assistant", text: data.answer ?? "", sources: data.sources ?? [] }]);
    } catch (error) {
      setTurns((prev) => [
        ...prev,
        { role: "assistant", text: `Une erreur est survenue: ${errorMessage(error)}` },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function onSubmitChat(e: React.FormEvent) {
    e.preventDefault();
    const message = prompt.trim();
    if (!message) return;
    setPrompt("");
    runChat(message);
  }

  /** Upload */
  async function onFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setUploading(true);
    setUploadErr(null);

    try {
      const form = new FormData();
      Array.from(list).forEach((file) => form.append("files", file));
      const resp = await fetch(`${API}/documents`, { method: "POST", body: form });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch (error) {
      setUploadErr(errorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  /** Drivs : facettes */
  const sources = useMemo(() => {
    const set = new Set<string>();
    hits.forEach((h) => h.payload?.source && set.add(String(h.payload.source)));
    return ["all", ...Array.from(set)];
  }, [hits]);
  const types = useMemo(() => {
    const set = new Set<string>();
    hits.forEach((h) => h.payload?.type && set.add(String(h.payload.type)));
    return ["all", ...Array.from(set)];
  }, [hits]);

  const filtered = hits.filter((h) => {
    const okS = filterSource === "all" || String(h.payload?.source) === filterSource;
    const okT = filterType === "all" || String(h.payload?.type) === filterType;
    return okS && okT;
  });

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(148,197,253,0.22),transparent_65%)]" />
      <div className="space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-lg shadow-sky-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
              Innova+
            </span>
            <h1 className="text-3xl font-semibold text-slate-900">CHATLAYA</h1>
            <p className="max-w-xl text-sm text-slate-600 sm:text-base">
              RAG et copilote conversationnel sur vos documents. Uploadez vos sources, explorez-les en recherche
              plein texte ou conversez avec un assistant qui cite ses rfrences.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-slate-900"
              title="Basculer le thme"
              type="button"
            >
              {dark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
              {dark ? "Mode clair" : "Mode sombre"}
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/30 transition hover:bg-sky-700">
              <IconUpload className="h-4 w-4" />
              {uploading ? "Import..." : "Uploader des docs"}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>
        </header>

        <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setTab("search")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === "search"
                    ? "bg-white text-sky-700 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <IconSearch className="h-4 w-4" />
                Recherche
              </button>
              <button
                type="button"
                onClick={() => setTab("chat")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === "chat"
                    ? "bg-white text-sky-700 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <IconChat className="h-4 w-4" />
                Chat
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span>Ctrl/Cmd + K pour la recherche</span>
              <span>Shift + Enter pour envoyer</span>
              <span>Jusqu a 50 tours conserves localement</span>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <DropZone onFiles={onFiles} disabled={uploading} />
            {uploadErr && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {uploadErr}
              </div>
            )}

            {tab === "search" ? (
              <section className="space-y-6">
                <form onSubmit={onSubmitSearch} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm" role="search">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Pose ta question (Ctrl ou Cmd + K)"
                        className="w-full rounded-full border border-slate-200 bg-white px-9 py-3 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        aria-label="Saisir la requte"
                      />
                      {q && (
                        <button
                          type="button"
                          onClick={() => setQ("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                          aria-label="Effacer"
                          title="Effacer (Esc)"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-50"
                      disabled={!q.trim() || loading}
                    >
                      {loading ? "Recherche..." : "Rechercher"}
                    </button>
                  </div>
                </form>

                {ran && (
                  <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold">Filtres</span>
                    <select
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm"
                      aria-label="Filtrer par source"
                    >
                      {sources.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm"
                      aria-label="Filtrer par type"
                    >
                      {types.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div className="ml-auto text-xs text-slate-500">
                      {elapsed != null && <span>{Math.round(elapsed)} ms  </span>}
                      {filtered.length} rsultats / {hits.length} total
                    </div>
                  </div>
                )}

                {err && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {err}
                  </div>
                )}

                {loading && <SkeletonList count={4} />}

                {!loading && !err && hits.length === 0 && ran && (
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
                    Aucun rsultat. Prcise ta question ou dpose de nouveaux documents.
                  </div>
                )}

                {!loading && !err && filtered.length > 0 && <ResultsList hits={filtered} query={q} />}
              </section>
            ) : (
              <section className="space-y-4">
                <div
                  ref={scrollRef}
                  className="max-h-[55vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-inner shadow-slate-200"
                >
                  {turns.length === 0 && !thinking && (
                    <div className="text-center text-slate-500">
                      Commence une conversation avec tes documents. Inspire-toi des suggestions :
                      <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
                        {[
                          "Rsum des notes de runion",
                          "Comparer deux versions d'une offre",
                          "Lister les points de vigilance",
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              setPrompt(suggestion);
                              inputRef.current?.focus();
                            }}
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {turns.map((t, i) => (
                    <Bubble key={i} role={t.role} text={t.text} sources={t.sources} />
                  ))}
                  {thinking && <Bubble role="assistant" text="Analyse des sources en cours" thinking />}
                </div>

                <form onSubmit={onSubmitChat} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <label className="sr-only" htmlFor="chat-message">
                    Message chat
                  </label>
                  <textarea
                    id="chat-message"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Demande quelque chose... (Shift + Enter pour un retour)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSubmitChat(e);
                      }
                    }}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Shift + Enter pour la ligne suivante</span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-50"
                      disabled={!prompt.trim() || thinking}
                    >
                      Envoyer
                    </button>
                  </div>
                </form>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/** ======= Composants ======= */

function DropZone({ onFiles, disabled }: { onFiles: (f: FileList | null) => void; disabled?: boolean }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled) onFiles(e.dataTransfer.files);
      }}
      className={`rounded-2xl border border-dashed px-4 py-5 text-sm transition ${
        over ? "border-sky-300 bg-sky-50 text-sky-700" : "border-sky-200 bg-sky-50/50 text-slate-600"
      }`}
      aria-label="Zone d import de documents (glisser-deposer)"
    >
      <b>Importer des documents</b> - Glisse tes fichiers ici ou utilise le bouton Uploader des docs.
    </div>
  );
}

function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white px-4 py-4">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-[90%] rounded bg-slate-200" />
          <div className="mt-1 h-3 w-[75%] rounded bg-slate-200" />
          <div className="mt-3 h-2 w-[30%] rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function ResultsList({ hits, query }: { hits: Hit[]; query: string }) {
  const terms = useMemo(
    () => query.toLowerCase().split(/\s+/).filter(Boolean),
    [query]
  );

  return (
    <div className="space-y-3" aria-live="polite">
      {hits.map((h) => {
        const text = (h.payload?.text || "") as string;
        const title = (h.payload?.title || "").toString();
        const url = (h.payload?.url || h.payload?.source || "") as string;

        return (
          <article key={h.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-slate-900/5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold leading-6 text-slate-900">
                {title || (text ? text.slice(0, 80) + (text.length > 80 ? "..." : "") : "Rsultat")}
              </h3>
              <div className="flex items-center gap-2">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                    title="Ouvrir la source"
                  >
                    Ouvrir
                  </a>
                )}
                <button
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                  onClick={() => navigator.clipboard.writeText(text || "")}
                  title="Copier le texte"
                >
                  Copier
                </button>
              </div>
            </div>

            <p className="mt-2 text-[15px] leading-6 text-slate-700">{highlight(text, terms)}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {h.payload?.source && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                  source: {String(h.payload.source)}
                </span>
              )}
              {h.payload?.type && (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1">
                  type: {String(h.payload.type)}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                score <ScoreBar score={h.score} /> {h.score.toFixed(3)}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function highlight(text: string, terms: string[]) {
  if (!text || terms.length === 0) return text;
  const regex = new RegExp(`(${terms.map(escapeRe).join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    terms.some((t) => t && part.toLowerCase() === t.toLowerCase()) ? (
      <mark key={i} className="rounded bg-sky-100 px-1 text-sky-800">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score)) * 100;
  return (
    <span className="inline-block h-2 w-24 overflow-hidden rounded-full bg-slate-200 align-middle">
      <span className="block h-full bg-sky-500" style={{ width: `${pct}%` }} aria-hidden="true" />
    </span>
  );
}

function Bubble({
  role,
  text,
  thinking,
  sources,
}: {
  role: "user" | "assistant";
  text: string;
  thinking?: boolean;
  sources?: Hit[];
}) {
  const isUser = role === "user";
  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "bg-sky-600 text-white"
            : "bg-white text-slate-800 shadow-slate-200 border border-slate-200"
        }`}
      >
        {thinking ? (
          <span className="inline-flex items-center gap-2 text-slate-200">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-200 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-300" />
            </span>
            {text}
          </span>
        ) : (
          text
        )}
        {sources && sources.length > 0 && (
          <div className={`mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs ${isUser ? "text-sky-100" : "text-slate-600"}`}>
            <span className="font-semibold">Sources :</span>
            <ul className="mt-1 list-disc pl-5">
              {sources.slice(0, 5).map((s) => (
                <li key={s.id}>
                  {s.payload?.title || s.payload?.source || "source"}{" "}
                  {s.payload?.url && (
                    <a className="underline" href={String(s.payload.url)} target="_blank" rel="noreferrer">
                      ouvrir
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

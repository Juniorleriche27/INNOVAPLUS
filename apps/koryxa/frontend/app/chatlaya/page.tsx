"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { CHATLAYA_API_BASE } from "@/lib/env";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  pending?: boolean;
};

type Conversation = {
  conversation_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
};

const API_BASE = CHATLAYA_API_BASE;
const SECTION_ICON_MAP: Record<string, string> = {
  "1) Resume bref": "💡",
  "2) Reponse detaillee": "📘",
  "3) Pistes d'action (3 puces max)": "🚀",
  "4) KPIs (1-3) si utiles": "📊",
  "5) Risques / limites (1-2) si utiles": "⚠️",
};
type StructuredSection = {
  title: string;
  body: string;
};

function normalizeSectionTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const SECTION_ICON_ENTRIES = Object.entries(SECTION_ICON_MAP).map(([label, icon]) => ({
  icon,
  normalized: normalizeSectionTitle(label),
}));

function resolveSectionIcon(title: string): string | undefined {
  const normalized = normalizeSectionTitle(title);
  const entry = SECTION_ICON_ENTRIES.find((candidate) => normalized.startsWith(candidate.normalized));
  return entry?.icon;
}

function parseStructuredSections(content: string): StructuredSection[] {
  const lines = content.split(/\r?\n/);
  const sections: StructuredSection[] = [];
  let currentTitle: string | null = null;
  let buffer: string[] = [];
  const commit = () => {
    if (!currentTitle) return;
    const body = buffer.join("\n").trim();
    sections.push({ title: currentTitle, body });
    buffer = [];
  };

  for (const rawLine of lines) {
    const headingMatch = rawLine.match(/^#{2,3}\s+(.*)$/);
    if (headingMatch) {
      if (currentTitle) commit();
      currentTitle = headingMatch[1].trim();
      continue;
    }
    if (currentTitle) {
      buffer.push(rawLine);
    }
  }
  if (currentTitle) commit();
  return sections;
}

function IconCopy(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

type ContentBlock =
  | {
      type: "paragraph";
      lines: string[];
    }
  | {
      type: "list";
      items: string[];
    };

function buildContentBlocks(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ type: "paragraph", lines: [...paragraph] });
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push({ type: "list", items: [...list] });
    list = [];
  };

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^[-*]\s+/, "").trim());
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function StructuredSectionContent({ text }: { text: string }): JSX.Element | null {
  if (!text.trim()) return null;
  const blocks = buildContentBlocks(text);
  if (!blocks.length) {
    return <p className="mt-1 text-sm text-slate-700">{text}</p>;
  }
  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === "paragraph") {
          return (
            <p key={`p-${idx}`} className={`${idx === 0 ? "mt-1" : "mt-2"} text-sm text-slate-700`}>
              {block.lines.join(" ")}
            </p>
          );
        }
        return (
          <ul
            key={`ul-${idx}`}
            className={`${idx === 0 ? "mt-1" : "mt-2"} list-disc pl-5 text-sm text-slate-700 marker:text-sky-500`}
          >
            {block.items.map((item, itemIdx) => (
              <li key={itemIdx} className="mb-1 last:mb-0">
                {item}
              </li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

function AssistantMessageContent({ content }: { content: string }): JSX.Element {
  const sections = parseStructuredSections(content);
  if (!sections.length) {
    return <span className="whitespace-pre-wrap break-words">{content}</span>;
  }
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const icon = resolveSectionIcon(section.title);
        return (
          <div key={`${section.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
              {icon ? (
                <span aria-hidden="true" className="text-base">
                  {icon}
                </span>
              ) : null}
              <span>{section.title}</span>
            </div>
            <StructuredSectionContent text={section.body} />
          </div>
        );
      })}
    </div>
  );
}

export default function ChatlayaPage(): JSX.Element {
  // ---- State ----
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Refs ----
  const ensuredConversation = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  // ---- UI toggles / layout ----
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  // Charger conversations/messages
  useEffect(() => {
    void loadConversations();
  }, []);
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  // Autoscroll dans la liste des messages (pas la page)
  useEffect(() => {
    const el = messagesViewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Focus composer quand on change de conv
  useEffect(() => {
    composerRef.current?.focus();
  }, [selectedConversationId]);
  // Ajuster automatiquement la hauteur du textarea
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "0px";
    const maxHeight = 200;
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [input]);

  // Annuler le stream à l’unmount
  useEffect(() => () => streamAbortRef.current?.abort(), []);

  // Bloquer le scroll du body pendant l'utilisation de la page
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // ---- Helpers API ----
  function forceLoginRedirect() {
    if (typeof window === "undefined") return;
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const redirect = encodeURIComponent(next && next !== "/" ? next : "/chatlaya");
    window.location.href = `/login?redirect=${redirect}`;
  }
  function isAuthFailure(status: number) {
    if (status === 401 || status === 403 || status === 419) {
      forceLoginRedirect();
      return true;
    }
    return false;
  }

  async function ensureSeedConversation() {
    if (ensuredConversation.current) return;
    ensuredConversation.current = true;
    try {
      const res = await fetch(`${API_BASE}/chatlaya/session`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        if (isAuthFailure(res.status)) return;
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de creer la conversation initiale");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }

  async function loadConversations(force = false) {
    setConversationsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chatlaya/conversations`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        if (isAuthFailure(res.status)) return;
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de charger les conversations");
      }
      const data = await res.json();
      const items: Conversation[] = Array.isArray(data?.items) ? data.items : [];

      if (items.length === 0 && !force) {
        await ensureSeedConversation();
        await loadConversations(true);
        return;
      }
      setConversations(items);

      if (items.length === 0) {
        setSelectedConversationId(null);
        setMessages([]);
        return;
      }

      const still = items.some((c) => c.conversation_id === selectedConversationId);
      setSelectedConversationId(still ? selectedConversationId : items[0]?.conversation_id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    } finally {
      setConversationsLoading(false);
    }
  }

  async function loadMessages(id: string) {
    setMessagesLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/chatlaya/messages?conversation_id=${encodeURIComponent(id)}`,
        { credentials: "include", cache: "no-store" },
      );
      if (!res.ok) {
        if (isAuthFailure(res.status)) return;
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de recuperer les messages");
      }
      const data = await res.json().catch(() => ({}));
      setMessages(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleSelectConversation(id: string) {
    streamAbortRef.current?.abort();
    const collapse = typeof window !== "undefined" ? window.innerWidth < 768 : false;
    if (id === selectedConversationId) {
      if (collapse) setSidebarOpen(false);
      return;
    }
    setError(null);
    setMessages([]);
    setSelectedConversationId(id);
    if (collapse) setSidebarOpen(false);
  }

  async function handleCreateConversation() {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/chatlaya/conversations`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        if (isAuthFailure(res.status)) return;
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de creer la conversation");
      }
      const created: Conversation = await res.json();
      setConversations((prev) => [
        created,
        ...prev.filter((c) => c.conversation_id !== created.conversation_id),
      ]);
      setSelectedConversationId(created.conversation_id);
      setMessages([]);
      if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }

  async function handleArchiveConversation(id: string) {
    try {
      const res = await fetch(`${API_BASE}/chatlaya/conversations/${id}/archive`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        if (isAuthFailure(res.status)) return;
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible d'archiver la conversation");
      }
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.conversation_id !== id);
        if (selectedConversationId === id) {
          setSelectedConversationId(remaining[0]?.conversation_id ?? null);
          setMessages([]);
        }
        return remaining;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }

  async function sendMessage() {
    if (!selectedConversationId || streaming) return;
    const prompt = input.trim();
    if (!prompt) return;
    setError(null);

    const now = Date.now();
    const userEntry: ChatMessage = { id: `local-${now}`, role: "user", content: prompt };
    const assistantPlaceholder: ChatMessage = {
      id: `pending-${now}`,
      role: "assistant",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userEntry, assistantPlaceholder]);
    setInput("");
    setStreaming(true);
    composerRef.current?.focus();

    try {
      await streamAssistant(selectedConversationId, prompt);
      await loadMessages(selectedConversationId);
      await loadConversations(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur pendant la generation");
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("pending-")));
    } finally {
      setStreaming(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await sendMessage();
  }

  function handleComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // ---- Streaming SSE ----
  async function streamAssistant(id: string, prompt: string) {
    const controller = new AbortController();
    streamAbortRef.current = controller;

    const res = await fetch(`${API_BASE}/chatlaya/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ conversation_id: id, message: prompt }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) {
      if (!res.ok && isAuthFailure(res.status)) throw new Error("Authentification requise");
      const text = await res.text().catch(() => "");
      throw new Error(text || "Echec de la reponse");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let boundary: number;

        while ((boundary = buffer.indexOf("\n\n")) !== -1) {
          const packet = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (!packet.trim()) continue;

          let event = "message";
          const dataLines: string[] = [];
          for (const line of packet.split("\n")) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            else if (line.startsWith("data:")) dataLines.push(line.slice(5));
          }
          const data = dataLines.join("\n");

          if (event === "token") {
            setMessages((prev) =>
              prev.map((m) => (m.pending ? { ...m, content: m.content + data } : m)),
            );
          } else if (event === "done") {
            setMessages((prev) => prev.filter((m) => !m.pending));
            return;
          } else if (event === "error") {
            throw new Error(data || "Erreur de streaming");
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((prev) => prev.filter((m) => !m.pending));
        return;
      }
      if (err instanceof Error) throw err;
      throw new Error("Erreur de streaming");
    } finally {
      if (streamAbortRef.current === controller) streamAbortRef.current = null;
    }
  }

  // ---- Utils ----
  function normalizeTitle(title?: string | null) {
    if (!title) return "Nouvelle conversation";
    const t = title.trim();
    return t.length > 0 ? t : "Nouvelle conversation";
  }
  function formatRelativeTimestamp(timestamp?: string | null) {
    if (!timestamp) return "";
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }).format(new Date(timestamp));
    } catch {
      return "";
    }
  }

  // ---- Dérivés d'UI (UN SEUL BLOC) ----
  const activeConversation = useMemo(
    () => conversations.find((c) => c.conversation_id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );
  const activeConversationTitle = normalizeTitle(activeConversation?.title);
  const activeConversationUpdatedAt = formatRelativeTimestamp(activeConversation?.updated_at);
  const composerDisabled = streaming || !selectedConversationId;

  // ---- Sidebar (liste) ----
  function SidebarContent({ onClose }: { onClose?: () => void }) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Historique</h2>
            <p className="text-xs text-slate-500">Tous vos echanges Chatlaya</p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 md:hidden"
          >
            <span className="sr-only">Fermer l'historique</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="border-b border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={handleCreateConversation}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
          >
            <span aria-hidden>＋</span>
            Nouvelle conversation
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 pr-4">
          {conversationsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Aucune conversation encore. Lancez-vous pour remplir l'historique.
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((c) => {
                const isActive = c.conversation_id === selectedConversationId;
                const label = normalizeTitle(c.title);
                const updatedLabel = formatRelativeTimestamp(c.updated_at) || "Jamais utilisee";
                return (
                  <li key={c.conversation_id}>
                    <div
                      className={`rounded-2xl border ${
                        isActive
                          ? "border-sky-500 bg-sky-50"
                          : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleSelectConversation(c.conversation_id)}
                          className="flex-1 text-left"
                        >
                          <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {isActive ? "Session en cours" : `Mis a jour · ${updatedLabel}`}
                          </p>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleArchiveConversation(c.conversation_id);
                          }}
                        >
                          Archiver
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </div>
    );
  }

  // ---- Message bubbles ----
  const bubbleBaseClass = "rounded-3xl px-5 py-4 text-sm leading-relaxed shadow transition";
  const userBubbleClass =
    `${bubbleBaseClass} max-w-2xl bg-[#edf0f5] text-slate-900 border border-slate-200 shadow-slate-900/5`;
  const assistantBubbleClass =
    `${bubbleBaseClass} max-w-3xl bg-white text-slate-900 border border-slate-200/70 shadow-slate-900/5`;
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  async function handleCopy(content: string, id: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId((current) => (current === id ? null : current)), 2000);
    } catch {
      setCopiedMessageId(null);
    }
  }

  // ---- Rendu ----
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex w-full overflow-hidden bg-[#f7f7f8]"
    : "flex h-[calc(100vh-90px)] w-full flex-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-xl";

  return (
    <div className={containerClasses}>
      <aside className="hidden min-h-0 w-80 shrink-0 flex-col overflow-hidden border-r border-slate-200/60 bg-[#f3f4f8] md:flex">
        <SidebarContent />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col bg-[#f7f7f8]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500">Conversation</p>
            <p className="truncate text-lg font-semibold text-slate-900">{activeConversationTitle}</p>
            <p className="text-xs text-slate-500">
              {activeConversationUpdatedAt
                ? `Derniere activite · ${activeConversationUpdatedAt}`
                : "Commencez votre echange avec Chatlaya"}
            </p>
          </div>
          <div className="flex flex-none items-center gap-2">
            <button
              type="button"
              onClick={() => setHistoryDrawerOpen(true)}
              className="inline-flex items-center rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 md:hidden"
            >
              Historique
            </button>
            <button
              type="button"
              onClick={handleCreateConversation}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            >
              Nouvelle conversation
            </button>
            {activeConversation && (
              <button
                type="button"
                onClick={() => void handleArchiveConversation(activeConversation.conversation_id)}
                disabled={streaming}
                className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Archiver
              </button>
            )}
            <button
              type="button"
              onClick={() => setFullScreen((v) => !v)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:bg-sky-50"
            >
              {fullScreen ? "Quitter le plein écran" : "Plein écran"}
            </button>
          </div>
        </div>
        <div ref={messagesViewportRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
          {error && (
            <div className="mx-auto mb-4 w-full max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {messagesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex justify-center">
                  <div className="h-16 w-full max-w-3xl animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="w-full max-w-lg rounded-3xl border border-dashed border-slate-300 bg-white/80 px-8 py-10 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Pret a discuter ?</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Posez une question precise ou decrivez un besoin. Chatlaya vous repondra en francais avec des
                  suggestions concretes.
                </p>
                <button
                  type="button"
                  onClick={() => composerRef.current?.focus()}
                  className="mt-4 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
                >
                  Commencer
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-16 mx-auto w-full max-w-4xl">
              {messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`${isUser ? userBubbleClass : assistantBubbleClass} w-full`}>
                      {m.pending && !m.content ? (
                        <span className="inline-flex items-center gap-2 text-slate-400">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                          Chatlaya reflechit...
                        </span>
                      ) : isUser ? (
                        m.content
                      ) : (
                        <div className="space-y-3">
                          <AssistantMessageContent content={m.content} />
                          <div className="flex justify-end text-xs text-slate-500">
                            <button
                              type="button"
                              onClick={() => handleCopy(m.content, m.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 transition hover:border-slate-300 hover:text-slate-700"
                            >
                              <IconCopy className="h-3.5 w-3.5" />
                              <span className="text-[11px] font-medium">
                                {copiedMessageId === m.id ? "Copié" : "Copier"}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <form onSubmit={onSubmit} className="border-t border-slate-100 bg-[#f7f7f8] px-4 py-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-4xl items-end gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
            <textarea
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={streaming ? "Patientez pendant la reponse..." : "Pose ta question a Chatlaya"}
              rows={1}
              aria-label="Message pour Chatlaya"
              className="max-h-[200px] min-h-[48px] w-full resize-none bg-transparent text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
              disabled={composerDisabled}
            />
            <button
              type="submit"
              disabled={composerDisabled || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              <span className="sr-only">Envoyer</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M3.4 20.6a1 1 0 0 1-1.28-1.28l3-9a1 1 0 0 1 .63-.63l9-3a1 1 0 0 1 1.28 1.28L13 12l4.03 4.03a1 1 0 0 1-1.42 1.42L11.59 13.4l-3.73 4.04-.01.01a1 1 0 0 1-1.72-.37z" />
              </svg>
            </button>
          </div>
          <p className="mx-auto mt-2 max-w-3xl text-right text-xs text-slate-400">
            Entree pour envoyer · Maj + Entree pour aller a la ligne
          </p>
        </form>
      </main>
      {historyDrawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setHistoryDrawerOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-full flex-col bg-white shadow-2xl md:hidden">
            <SidebarContent onClose={() => setHistoryDrawerOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

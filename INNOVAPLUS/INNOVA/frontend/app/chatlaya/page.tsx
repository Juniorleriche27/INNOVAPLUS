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

export default function ChatlayaPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ensuredConversation = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [mobileSidebarInsets, setMobileSidebarInsets] = useState({ left: 16, right: 16, top: 96 });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncSidebar = () => setSidebarOpen(mediaQuery.matches);
    syncSidebar();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncSidebar);
      return () => {
        mediaQuery.removeEventListener("change", syncSidebar);
      };
    }
    mediaQuery.addListener(syncSidebar);
    return () => {
      mediaQuery.removeListener(syncSidebar);
    };
  }, []);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.focus();
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (!sidebarOpen) return;
    if (typeof window === "undefined") return;
    const syncPosition = () => {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      setMobileSidebarInsets({
        left: Math.max(rect.left, 12),
        right: Math.max(window.innerWidth - rect.right, 12),
        top: Math.max(rect.top, 72),
      });
    };
    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, { passive: true });
    return () => {
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition);
    };
  }, [sidebarOpen]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.conversation_id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  function forceLoginRedirect() {
    if (typeof window === "undefined") return;
    const nextLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const redirect = encodeURIComponent(
      nextLocation && nextLocation !== "/" ? nextLocation : "/chatlaya",
    );
    window.location.href = `/login?redirect=${redirect}`;
  }

  function isAuthFailure(status: number) {
    if (status === 401 || status === 403) {
      forceLoginRedirect();
      return true;
    }
    return false;
  }

  async function ensureSeedConversation() {
    if (ensuredConversation.current) {
      return;
    }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
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

      const stillExists = items.some((c) => c.conversation_id === selectedConversationId);
      const nextSelection = stillExists
        ? selectedConversationId
        : items[0]?.conversation_id ?? null;
      setSelectedConversationId(nextSelection);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setConversationsLoading(false);
    }
  }

  async function loadMessages(id: string) {
    setMessagesLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/chatlaya/messages?conversation_id=${encodeURIComponent(id)}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );
      if (!res.ok) {
        if (isAuthFailure(res.status)) return;
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de recuperer les messages");
      }
      const data = await res.json().catch(() => ({}));
      setMessages(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleSelectConversation(id: string) {
    const shouldCollapseSidebar = typeof window !== "undefined" ? window.innerWidth < 768 : false;
    if (id === selectedConversationId) {
      if (shouldCollapseSidebar) {
        setSidebarOpen(false);
      }
      return;
    }
    setError(null);
    setMessages([]);
    setSelectedConversationId(id);
    if (shouldCollapseSidebar) {
      setSidebarOpen(false);
    }
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
      const data = await res.json();
      const created: Conversation = data;
      setConversations((prev) => [created, ...prev]);
      setSelectedConversationId(created.conversation_id);
      setMessages([]);
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
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
          const nextConversationId = remaining[0]?.conversation_id ?? null;
          setSelectedConversationId(nextConversationId);
          setMessages([]);
        }
        return remaining;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    }
  }

  async function sendMessage() {
    if (!selectedConversationId || streaming) return;
    const prompt = input.trim();
    if (!prompt) return;
    setError(null);

    const now = Date.now();
    const userEntry: ChatMessage = {
      id: `local-${now}`,
      role: "user",
      content: prompt,
      pending: false,
    };
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur pendant la generation");
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("pending-")));
    } finally {
      setStreaming(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function streamAssistant(id: string, prompt: string) {
    const res = await fetch(`${API_BASE}/chatlaya/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ conversation_id: id, message: prompt }),
    });
    if (!res.ok || !res.body) {
      if (!res.ok && isAuthFailure(res.status)) {
        throw new Error("Authentification requise");
      }
      const text = await res.text().catch(() => "");
      throw new Error(text || "Echec de la reponse");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const packet = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        if (!packet.trim()) continue;

        let event = "message";
        let data = "";
        for (const line of packet.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          if (line.startsWith("data:")) data += line.slice(5).trim();
        }

        if (event === "token") {
          setMessages((prev) =>
            prev.map((msg) => (msg.pending ? { ...msg, content: msg.content + data } : msg)),
          );
        }

        if (event === "done") {
          setMessages((prev) => prev.filter((msg) => !msg.pending));
        }

        if (event === "error") {
          throw new Error(data || "Erreur de streaming");
        }
      }
    }
  }

  const emptyConversation = useMemo(
    () => !messagesLoading && messages.length === 0,
    [messagesLoading, messages.length],
  );

  function normalizeTitle(title?: string | null) {
    if (!title) return "Nouvelle conversation";
    const trimmed = title.trim();
    return trimmed.length > 0 ? trimmed : "Nouvelle conversation";
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

  const activeConversationTitle = normalizeTitle(activeConversation?.title);
  const activeConversationUpdatedAt = formatRelativeTimestamp(activeConversation?.updated_at);
  const composerDisabled = streaming || !selectedConversationId;

  function SidebarContent({ onClose }: { onClose?: () => void }) {
    return (
      <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Historique</h2>
            <p className="text-xs text-slate-500">Tous vos échanges Chatlaya</p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 md:hidden"
          >
            <span className="sr-only">Fermer l'historique</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
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
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {conversationsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              Aucune conversation encore. Lancez-vous pour remplir l'historique.
            </div>
          ) : (
            <ul className="space-y-2">
              {conversations.map((conversation) => {
                const isActive = conversation.conversation_id === selectedConversationId;
                const label = normalizeTitle(conversation.title);
                const updatedLabel =
                  formatRelativeTimestamp(conversation.updated_at) || "Jamais utilisée";
                return (
                  <li key={conversation.conversation_id}>
                    <div
                      className={`group relative overflow-hidden rounded-2xl border ${
                        isActive
                          ? "border-sky-500 bg-sky-50"
                          : "border-transparent bg-white hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void handleSelectConversation(conversation.conversation_id)}
                        className="block w-full px-4 py-3 text-left"
                      >
                        <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {isActive ? "Session en cours" : `Mis à jour · ${updatedLabel}`}
                        </p>
                      </button>
                      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleArchiveConversation(conversation.conversation_id);
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
  return (
    <div
      ref={frameRef}
      className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-2 pb-8 pt-4 sm:px-4 lg:px-6"
    >
      <div className="flex flex-1 flex-col gap-6 md:flex-row">
        <div className="hidden md:block md:w-72 md:flex-shrink-0">
          <div className="sticky top-24">
            <SidebarContent />
          </div>
        </div>
        <section className="flex min-h-[70vh] flex-1 flex-col rounded-3xl border border-slate-200 bg-white shadow-xl">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-3xl border-b border-slate-200 bg-white px-4 py-4 shadow-sm md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-800 md:hidden"
              >
                <span className="sr-only">Afficher l'historique</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h10M4 18h16"
                  />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">
                  {activeConversationTitle}
                </p>
                <p className="text-xs text-slate-500">
                  {activeConversationUpdatedAt
                    ? `Dernière activité · ${activeConversationUpdatedAt}`
                    : "Commencez votre échange avec Chatlaya"}
                </p>
              </div>
            </div>
            <div className="flex flex-none items-center gap-2">
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
                  onClick={() =>
                    void handleArchiveConversation(activeConversation.conversation_id)
                  }
                  disabled={streaming}
                  className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Archiver
                </button>
              )}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
            {error && (
              <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
            {messagesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
                  >
                    <div className="h-16 w-3/4 max-w-md animate-pulse rounded-3xl bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : emptyConversation ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900">Prêt à discuter ?</h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Posez une question précise ou décrivez un besoin. Chatlaya vous répondra en
                    français avec des suggestions concrètes.
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
              <div className="space-y-4 pb-10">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[60%] whitespace-pre-wrap break-words rounded-3xl px-5 py-3 text-[0.95rem] leading-relaxed shadow ${
                          isUser
                            ? "bg-sky-600 text-white"
                            : "bg-white text-slate-900 ring-1 ring-slate-200"
                        }`}
                      >
                        {message.pending && !message.content ? (
                          <span className="inline-flex items-center gap-2 text-slate-400">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                            Chatlaya réfléchit…
                          </span>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
            )}
            {streaming && !messagesLoading && (
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
                Chatlaya génère une réponse…
              </div>
            )}
          </div>
          <form
            onSubmit={onSubmit}
            className="border-t border-slate-200/70 bg-white px-4 py-4 shadow-inner md:px-6 lg:px-10"
          >
            <div className="relative rounded-3xl border border-slate-200 bg-white shadow-sm transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
              <textarea
                ref={composerRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={
                  streaming ? "Patientez pendant la réponse..." : "Pose ta question à Chatlaya"
                }
                rows={1}
                className="block w-full resize-none rounded-3xl bg-transparent px-4 py-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                disabled={composerDisabled}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={composerDisabled || !input.trim()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <span className="sr-only">Envoyer</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path d="M3.4 20.6a1 1 0 0 1-1.28-1.28l3-9a1 1 0 0 1 .63-.63l9-3a1 1 0 0 1 1.28 1.28L13 12l4.03 4.03a1 1 0 0 1-1.42 1.42L11.59 13.4l-3.73 4.04-.01.01a1 1 0 0 1-1.72-.37z" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Entrée pour envoyer · Maj + Entrée pour aller à la ligne
            </p>
          </form>
        </section>
      </div>
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="fixed z-50 max-h-[80vh] overflow-hidden md:hidden"
            style={{
              left: mobileSidebarInsets.left,
              right: mobileSidebarInsets.right,
              top: mobileSidebarInsets.top,
            }}
          >
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}

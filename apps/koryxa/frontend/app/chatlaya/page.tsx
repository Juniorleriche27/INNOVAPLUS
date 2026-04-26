"use client";

import { FormEvent, KeyboardEvent, WheelEvent as ReactWheelEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, MessageSquarePlus } from "lucide-react";
import { CHATLAYA_API_BASE } from "@/lib/env";

type AssistantMode = "general" | "launch_structure_sell";

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
  assistant_mode: AssistantMode;
};

const API_BASE = CHATLAYA_API_BASE;
const STREAM_TIMEOUT_MS = 45_000;
const TYPEWRITER_BASE_DELAY_MS = 12;
const TYPEWRITER_PAUSE_DELAY_MS = 26;
const GENERAL_STARTER_PROMPTS = [
  {
    label: "Clarifier ma trajectoire",
    prompt: "Aide-moi à clarifier ma trajectoire KORYXA, mon point de départ et mes prochaines étapes prioritaires.",
  },
  {
    label: "Cadrer un besoin entreprise",
    prompt: "Aide-moi à cadrer un besoin entreprise en distinguant objectif, contexte, livrable, urgence et mode de traitement.",
  },
  {
    label: "Choisir la bonne entrée",
    prompt: "Aide-moi à choisir la bonne entrée KORYXA selon mon besoin actuel.",
  },
  {
    label: "Prioriser mes prochaines étapes",
    prompt: "Aide-moi à identifier les prochaines étapes les plus utiles selon ma situation actuelle.",
  },
] as const;

const SPECIALIST_STARTER_PROMPTS = [
  {
    label: "Lancer mon projet",
    prompt: "Aide-moi a lancer mon projet en identifiant les etapes essentielles pour passer de l'idee a une offre claire.",
  },
  {
    label: "Structurer mon offre",
    prompt: "Aide-moi a structurer mon offre pour qu'elle soit lisible, utile et vendable.",
  },
  {
    label: "Construire un business plan",
    prompt: "Aide-moi a construire un business plan simple et exploitable pour mon activite.",
  },
  {
    label: "Mieux vendre",
    prompt: "Aide-moi a mieux vendre mon offre en clarifiant proposition de valeur, cible et argumentaire commercial.",
  },
] as const;

const ASSISTANT_MODE_OPTIONS: Array<{ value: AssistantMode; label: string; hint: string }> = [
  {
    value: "general",
    label: "Mode general",
    hint: "ChatLAYA repond avec son contexte produit habituel.",
  },
  {
    value: "launch_structure_sell",
    label: "Lancer, Structurer, Vendre",
    hint: "ChatLAYA repond uniquement avec le corpus dedie a cette fonctionnalite.",
  },
];

function normalizeTitle(value?: string | null) {
  return value?.trim() || "Nouvelle conversation";
}

function normalizeAssistantMode(value?: string | null): AssistantMode {
  return value === "launch_structure_sell" ? "launch_structure_sell" : "general";
}

function normalizeConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    assistant_mode: normalizeAssistantMode(conversation?.assistant_mode),
  };
}

function formatDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function normalizeStreamError(text: string, status?: number, contentType?: string | null) {
  const raw = text.trim();
  const lower = raw.toLowerCase();
  const htmlLike = (contentType || "").includes("text/html") || lower.includes("<html");
  if (status === 504 || lower.includes("gateway time-out") || lower.includes("gateway timeout")) {
    return "ChatLAYA met trop de temps à répondre. Réessayez dans un instant.";
  }
  if (status === 502 || status === 503 || htmlLike) {
    return "Le service ChatLAYA est temporairement indisponible. Réessayez dans un instant.";
  }
  return raw || "Échec de la réponse.";
}

function AssistantContent({ content }: { content: string }) {
  return <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{content}</div>;
}

function ChatlayaContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessMode, setAccessMode] = useState<"guest" | "user" | null>(null);
  const [assistantModeSaving, setAssistantModeSaving] = useState(false);

  const bootstrappedRef = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const conversationsViewportRef = useRef<HTMLDivElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const typewriterQueueRef = useRef("");
  const typewriterTimerRef = useRef<number | null>(null);
  const typewriterDrainWaitersRef = useRef<Array<() => void>>([]);

  function focusComposer(preventScroll = false) {
    const composer = composerRef.current;
    if (!composer) return;
    try {
      composer.focus({ preventScroll });
    } catch {
      composer.focus();
    }
  }

  function resolveTypewriterDrain() {
    const waiters = [...typewriterDrainWaitersRef.current];
    typewriterDrainWaitersRef.current = [];
    for (const resolve of waiters) {
      resolve();
    }
  }

  function resetTypewriterQueue() {
    typewriterQueueRef.current = "";
    if (typewriterTimerRef.current !== null) {
      window.clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    resolveTypewriterDrain();
  }

  function flushTypewriterTick() {
    if (!typewriterQueueRef.current) {
      typewriterTimerRef.current = null;
      resolveTypewriterDrain();
      return;
    }

    const nextCharacter = typewriterQueueRef.current[0];
    typewriterQueueRef.current = typewriterQueueRef.current.slice(1);
    setMessages((current) =>
      current.map((item) => (item.pending ? { ...item, content: item.content + nextCharacter } : item)),
    );

    const delay =
      nextCharacter === "\n" || /[.!?;:,]/.test(nextCharacter)
        ? TYPEWRITER_PAUSE_DELAY_MS
        : nextCharacter === " "
          ? Math.max(6, TYPEWRITER_BASE_DELAY_MS - 4)
          : TYPEWRITER_BASE_DELAY_MS;
    typewriterTimerRef.current = window.setTimeout(flushTypewriterTick, delay);
  }

  function enqueueTypewriterChunk(chunk: string) {
    if (!chunk) return;
    typewriterQueueRef.current += chunk;
    if (typewriterTimerRef.current === null) {
      typewriterTimerRef.current = window.setTimeout(flushTypewriterTick, TYPEWRITER_BASE_DELAY_MS);
    }
  }

  function waitForTypewriterDrain() {
    if (!typewriterQueueRef.current && typewriterTimerRef.current === null) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      typewriterDrainWaitersRef.current.push(resolve);
    });
  }

  function forwardWheelToViewport(
    event: ReactWheelEvent<HTMLElement>,
    viewportRef: React.RefObject<HTMLDivElement | null>,
  ) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const target = event.target;
    if (target instanceof Element && viewport.contains(target)) return;
    if (viewport.scrollHeight <= viewport.clientHeight) return;

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    if ((event.deltaY < 0 && viewport.scrollTop <= 0) || (event.deltaY > 0 && viewport.scrollTop >= maxScrollTop)) {
      return;
    }

    event.preventDefault();
    viewport.scrollTop = Math.min(maxScrollTop, Math.max(0, viewport.scrollTop + event.deltaY));
  }

  function forwardWheelToChatLayout(event: ReactWheelEvent<HTMLElement>) {
    const target = event.target;
    if (target instanceof Element && conversationsViewportRef.current?.contains(target)) {
      forwardWheelToViewport(event, conversationsViewportRef);
      return;
    }
    forwardWheelToViewport(event, messagesViewportRef);
  }

  async function createConversationRequest() {
    const response = await fetch(`${API_BASE}/chatlaya/conversations`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || "Impossible de créer la conversation.");
    }
    return normalizeConversation((await response.json()) as Conversation);
  }

  async function ensureSession() {
    const response = await fetch(`${API_BASE}/chatlaya/session`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.detail || "Impossible d’ouvrir la session ChatLAYA.");
    }
    const data = await response.json().catch(() => ({}));
    if (data?.mode === "guest" || data?.mode === "user") {
      setAccessMode(data.mode);
    }
    return {
      conversationId: typeof data?.conversation_id === "string" ? data.conversation_id : null,
      mode: data?.mode === "guest" || data?.mode === "user" ? data.mode : null,
    };
  }

  async function createConversation() {
    setError(null);
    try {
      streamAbortRef.current?.abort();
      resetTypewriterQueue();
      setStreaming(false);
      const created = await createConversationRequest();
      setConversations((current) => [created, ...current.filter((item) => item.conversation_id !== created.conversation_id)]);
      setSelectedConversationId(created.conversation_id);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  }

  async function loadConversations(force = false) {
    setConversationsLoading(true);
    try {
      const session = await ensureSession();
      const response = await fetch(`${API_BASE}/chatlaya/conversations`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de charger les conversations.");
      }

      const data = await response.json().catch(() => ({}));
      const items: Conversation[] = Array.isArray(data?.items) ? data.items.map(normalizeConversation) : [];

      if (!items.length && session.conversationId) {
        setSelectedConversationId(session.conversationId);
        setMessages([]);
        return;
      }

      if (!items.length && !force) {
        await loadConversations(true);
        return;
      }

      if (!items.length && force) {
        const created = await createConversationRequest();
        setConversations([created]);
        setSelectedConversationId(created.conversation_id);
        setMessages([]);
        return;
      }

      setConversations(items);
      setSelectedConversationId((current) => {
        if (current && items.some((item) => item.conversation_id === current)) return current;
        if (session.conversationId && items.some((item) => item.conversation_id === session.conversationId)) {
          return session.conversationId;
        }
        return items[0]?.conversation_id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setConversationsLoading(false);
    }
  }

  async function loadMessages(conversationId: string) {
    setMessagesLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/chatlaya/messages?conversation_id=${encodeURIComponent(conversationId)}`,
        { cache: "no-store", credentials: "include" },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de récupérer les messages.");
      }
      const data = await response.json().catch(() => ({}));
      resetTypewriterQueue();
      setMessages(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConversationId);
  }, [selectedConversationId]);

  const latestMessageContent = messages[messages.length - 1]?.content ?? "";

  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [messages.length, latestMessageContent, streaming]);

  useEffect(() => {
    focusComposer(true);
  }, [selectedConversationId]);

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "0px";
    const nextHeight = Math.min(el.scrollHeight, 220);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > 220 ? "auto" : "hidden";
  }, [input]);

  useEffect(
    () => () => {
      streamAbortRef.current?.abort();
      resetTypewriterQueue();
    },
    [],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = "ChatLAYA | KORYXA";
    }
  }, []);

  async function archiveConversation(conversationId: string) {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/chatlaya/conversations/${conversationId}/archive`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible d’archiver la conversation.");
      }
      setConversations((current) => {
        const remaining = current.filter((item) => item.conversation_id !== conversationId);
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(remaining[0]?.conversation_id ?? null);
          setMessages([]);
        }
        return remaining;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  }

  async function updateConversationMode(nextMode: AssistantMode) {
    if (!selectedConversationId || assistantModeSaving || streaming) return;
    const previous = conversations.find((item) => item.conversation_id === selectedConversationId);
    if (!previous) return;
    const normalizedNextMode = normalizeAssistantMode(nextMode);
    if (previous.assistant_mode === normalizedNextMode) return;

    setAssistantModeSaving(true);
    setError(null);
    setConversations((current) =>
      current.map((item) =>
        item.conversation_id === selectedConversationId
          ? { ...item, assistant_mode: normalizedNextMode }
          : item,
      ),
    );

    try {
      const response = await fetch(`${API_BASE}/chatlaya/conversations/${selectedConversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ assistant_mode: normalizedNextMode }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || "Impossible de changer le mode assistant.");
      }
      const updated = normalizeConversation((await response.json()) as Conversation);
      setConversations((current) =>
        current.map((item) => (item.conversation_id === updated.conversation_id ? updated : item)),
      );
    } catch (err) {
      setConversations((current) =>
        current.map((item) =>
          item.conversation_id === previous.conversation_id
            ? { ...item, assistant_mode: previous.assistant_mode }
            : item,
        ),
      );
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setAssistantModeSaving(false);
    }
  }

  function applyStarterPrompt(prompt: string) {
    setError(null);
    setInput(prompt);
    focusComposer(true);
  }

  async function streamAssistant(conversationId: string, prompt: string) {
    const controller = new AbortController();
    streamAbortRef.current = controller;
    let timedOut = false;
    const timeoutId =
      typeof window !== "undefined"
        ? window.setTimeout(() => {
            timedOut = true;
            controller.abort();
          }, STREAM_TIMEOUT_MS)
        : null;

    const response = await fetch(`${API_BASE}/chatlaya/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ conversation_id: conversationId, message: prompt }),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type");
    const isEventStream = (contentType || "").includes("text/event-stream");
    if (!response.ok || !response.body || !isEventStream) {
      const text = await response.text().catch(() => "");
      throw new Error(normalizeStreamError(text, response.status, contentType));
    }

    const reader = response.body.getReader();
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
            if (line.startsWith("data:")) dataLines.push(line.slice(5));
          }

          const data = dataLines.join("\n");
          if (event === "token") {
            enqueueTypewriterChunk(data);
          } else if (event === "done") {
            await waitForTypewriterDrain();
            setMessages((current) => current.filter((item) => !item.pending));
            return;
          } else if (event === "error") {
            throw new Error(data || "Erreur de streaming.");
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        resetTypewriterQueue();
        setMessages((current) => current.filter((item) => !item.pending));
        if (timedOut) {
          throw new Error("ChatLAYA met trop de temps à répondre. Réessayez dans un instant.");
        }
        return;
      }
      resetTypewriterQueue();
      if (err instanceof Error) throw err;
      throw new Error("Erreur de streaming.");
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (streamAbortRef.current === controller) {
        streamAbortRef.current = null;
      }
    }
  }

  async function sendMessage() {
    if (streaming) return;
    const prompt = input.trim();
    if (!prompt) return;

    let convId = selectedConversationId;
    if (!convId) {
      try {
        const session = await ensureSession();
        convId = session.conversationId;
        if (!convId) {
          const created = await createConversationRequest();
          setConversations((current) => [created, ...current]);
          setSelectedConversationId(created.conversation_id);
          setMessages([]);
          convId = created.conversation_id;
        } else {
          setSelectedConversationId(convId);
          setMessages([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de créer la conversation.");
        return;
      }
    }

    setError(null);
    resetTypewriterQueue();
    const now = Date.now();
    setMessages((current) => [
      ...current,
      { id: `user-${now}`, role: "user", content: prompt },
      { id: `pending-${now}`, role: "assistant", content: "", pending: true },
    ]);
    setInput("");
    setStreaming(true);

    try {
      await streamAssistant(convId, prompt);
      await loadMessages(convId);
      await loadConversations(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur pendant la génération.");
      setMessages((current) => current.filter((item) => !item.pending));
    } finally {
      setStreaming(false);
      focusComposer(true);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  const activeConversation = useMemo(
    () => conversations.find((item) => item.conversation_id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );
  const activeAssistantMode = activeConversation?.assistant_mode ?? "general";
  const starterPrompts =
    activeAssistantMode === "launch_structure_sell" ? SPECIALIST_STARTER_PROMPTS : GENERAL_STARTER_PROMPTS;

  return (
    <main onWheelCapture={forwardWheelToChatLayout} className="flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-slate-50/60">
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          ref={conversationsViewportRef}
          className="grid content-start gap-4 overflow-y-auto overscroll-y-contain touch-pan-y [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] lg:min-h-0 lg:pr-1"
        >
          <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Historique</p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950 sm:text-xl">Conversations</h2>
              {activeConversation ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  {activeAssistantMode === "launch_structure_sell" ? "Lancer, Structurer, Vendre" : "Mode general"}
                </p>
              ) : null}
            </div>

            {accessMode ? (
              <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {accessMode === "guest" ? "Mode invité" : "Mode connecté"}
              </p>
            ) : null}

            <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Conversation active</p>
              <p className="mt-2 truncate text-sm font-semibold text-slate-950">{normalizeTitle(activeConversation?.title)}</p>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                {activeConversation?.updated_at
                  ? `Dernière activité : ${formatDate(activeConversation.updated_at)}`
                  : "Posez votre première question pour démarrer."}
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => void createConversation()}
                className="inline-flex items-center justify-center gap-2 rounded-[20px] bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(2,132,199,0.22)] transition hover:bg-sky-700"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Nouvelle conversation
              </button>
              {activeConversation ? (
                <button
                  type="button"
                  onClick={() => void archiveConversation(activeConversation.conversation_id)}
                  disabled={streaming}
                  className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-400 hover:text-sky-700 disabled:opacity-50"
                >
                  Archiver
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2">
              {conversationsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-[22px] bg-slate-100" />
                ))
              ) : conversations.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-7 text-slate-500">
                  Aucune conversation pour le moment.
                </div>
              ) : (
                conversations.map((conversation) => {
                  const active = conversation.conversation_id === selectedConversationId;
                  return (
                    <button
                      key={conversation.conversation_id}
                      type="button"
                      onClick={() => {
                        streamAbortRef.current?.abort();
                        resetTypewriterQueue();
                        setStreaming(false);
                        setError(null);
                        setMessages([]);
                        setSelectedConversationId(conversation.conversation_id);
                      }}
                      className={`rounded-[22px] border px-4 py-4 text-left transition ${
                        active
                          ? "border-sky-300 bg-sky-50 shadow-[0_14px_30px_rgba(14,165,233,0.10)]"
                          : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50"
                      }`}
                    >
                      <p className="truncate text-sm font-semibold text-slate-950">{normalizeTitle(conversation.title)}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-500">
                        {formatDate(conversation.updated_at) || "Nouvelle conversation"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] sm:rounded-[28px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Démarrage rapide</p>
            <div className="mt-4 grid gap-2">
              {starterPrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => applyStarterPrompt(item.prompt)}
                  className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section
          onWheelCapture={(event) => forwardWheelToViewport(event, messagesViewportRef)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] sm:rounded-[30px] sm:p-5"
        >
          {error ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className={`${error ? "mt-3" : ""} shrink-0 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Mode assistant</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {activeAssistantMode === "launch_structure_sell" ? "Lancer, Structurer, Vendre" : "Mode general KORYXA"}
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  {activeAssistantMode === "launch_structure_sell"
                    ? "Reponses limitees au corpus dedie a cette fonctionnalite."
                    : "Reponses avec le contexte produit habituel de ChatLAYA."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ASSISTANT_MODE_OPTIONS.map((option) => {
                  const active = option.value === activeAssistantMode;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!selectedConversationId || assistantModeSaving || streaming}
                      onClick={() => void updateConversationMode(option.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-sky-400 bg-sky-50 text-sky-700"
                          : "border-slate-300 bg-white text-slate-600 hover:border-sky-400 hover:text-sky-600"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                      title={option.hint}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            ref={messagesViewportRef}
            className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y rounded-[26px] border border-slate-200 bg-slate-50/60 px-4 py-4 [scrollbar-gutter:stable] [-webkit-overflow-scrolling:touch] sm:px-5"
          >
            {messagesLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-[22px] bg-white/8" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full min-h-[220px] items-center justify-center">
                <div className="w-full max-w-xl rounded-[26px] border border-dashed border-slate-300 bg-white px-6 py-8 text-center shadow-sm">
                  <p className="text-xl font-semibold text-slate-950">Partez d’une question simple.</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    ChatLAYA vous aide à clarifier, cadrer et décider avant d’ouvrir la bonne suite dans KORYXA.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {starterPrompts.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => applyStarterPrompt(item.prompt)}
                        className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`w-full rounded-[26px] border px-5 py-4 shadow-sm ${
                          isUser
                            ? "max-w-2xl border-slate-200 bg-[#edf2f7]"
                            : "max-w-3xl border-slate-200 bg-slate-50"
                        }`}
                      >
                        {message.pending && !message.content ? (
                          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
                            ChatLAYA est en train de répondre...
                          </span>
                        ) : isUser ? (
                          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-900">{message.content}</div>
                        ) : (
                          <AssistantContent content={message.content} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="mt-3 shrink-0 rounded-[20px] border border-slate-200 bg-white px-3 py-3 sm:rounded-[24px] sm:px-4">
            <div className="flex items-end gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3 sm:rounded-[22px] sm:px-4">
              <textarea
                ref={composerRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder={streaming ? "Patientez pendant la réponse..." : "Posez votre question à ChatLAYA"}
                rows={1}
                aria-label="Message pour ChatLAYA"
                className="min-h-[48px] w-full resize-none bg-transparent text-sm leading-7 text-slate-800 placeholder:text-slate-400 focus:outline-none"
                disabled={streaming}
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                <span className="sr-only">Envoyer</span>
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-left text-xs text-slate-400 sm:text-right">Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</p>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function ChatlayaPage() {
  return (
    <Suspense>
      <ChatlayaContent />
    </Suspense>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
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
    if (id === selectedConversationId) return;
    setError(null);
    setMessages([]);
    setSelectedConversationId(id);
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
      setConversations((prev) => prev.filter((c) => c.conversation_id !== id));
      if (selectedConversationId === id) {
        const remaining = conversations.filter((c) => c.conversation_id !== id);
        setSelectedConversationId(remaining[0]?.conversation_id ?? null);
        setMessages([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || !input.trim()) return;
    setError(null);

    const userEntry: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: input,
      pending: false,
    };
    const assistantPlaceholder: ChatMessage = {
      id: `pending-${Date.now()}`,
      role: "assistant",
      content: "",
      pending: true,
    };

    setMessages((prev) => [...prev, userEntry, assistantPlaceholder]);
    const prompt = input;
    setInput("");
    setStreaming(true);

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

  return (
    <main className="flex h-[calc(100vh-5.5rem)] w-full overflow-hidden bg-slate-50/60">
      <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white shadow-sm lg:flex">
        <header className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Conversations</h2>
          <p className="mt-1 text-xs text-slate-500">
            Historique personnel · synchronisé par compte
          </p>
          <button
            onClick={handleCreateConversation}
            className="mt-4 w-full rounded-2xl bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
          >
            Nouvelle conversation
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {conversationsLoading ? (
            <p className="px-3 py-2 text-sm text-slate-500">Chargement...</p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">
              Aucune conversation pour le moment. Lancez-vous !

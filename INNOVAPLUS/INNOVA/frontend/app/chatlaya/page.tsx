"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CHATLAYA_API_BASE } from "@/lib/env";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  pending?: boolean;
};

const API_BASE = CHATLAYA_API_BASE;

export default function ChatlayaPage() {
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void bootstrapConversation();
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    void loadMessages(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function bootstrapConversation() {
    try {
      const res = await fetch(`${API_BASE}/chatlaya/session`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Impossible de creer la session");
      setConversationId(data.conversation_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    }
  }

  async function loadMessages(id: string) {
    try {
      const res = await fetch(`${API_BASE}/chatlaya/messages?conversation_id=${encodeURIComponent(id)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Impossible de recuperer les messages");
      setMessages(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !input.trim()) return;
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
    setLoading(true);

    try {
      await streamAssistant(conversationId, prompt);
      await loadMessages(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur pendant la generation");
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("pending-")));
    } finally {
      setLoading(false);
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

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col gap-4 px-4 py-6">
      <section className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex h-full flex-col">
          <header className="border-b border-slate-100 px-6 py-4">
            <h1 className="text-xl font-semibold text-slate-900">CHATLAYA</h1>
            <p className="text-sm text-slate-500">Discute avec le copilote IA de la plateforme INNOVA+.</p>
          </header>
          <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    msg.role === "user"
                      ? "max-w-[80%] rounded-2xl bg-sky-600 px-4 py-3 text-sm text-white"
                      : "max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow"
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content || (msg.pending ? "..." : "")}
                  </div>
                  {msg.pending && <div className="mt-2 text-xs text-slate-400">Reponse en cours...</div>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <textarea
            rows={3}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pose ta question"
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{conversationId ? "Session active" : "Initialisation"}</span>
            <button
              type="submit"
              disabled={!input.trim() || loading || !conversationId}
              className="rounded-full bg-sky-600 px-5 py-2 font-medium text-white shadow-sky-600/20 transition hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    </main>
  );
}

// Use the Next.js proxy to attach cookie-based auth in production

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type ChatRequest = {
  question: string;
  temperature?: number;
  max_tokens?: number;
  top_k?: number;
  provider?: "cohere";
};

export type ChatSource = {
  id: string;
  score?: number;
  payload?: Record<string, unknown> | null;
};

export type ChatTokenUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
};

export type ChatResponse = {
  answer: string;
  provider: string;
  model: string;
  latency_ms?: number;
  tokens?: ChatTokenUsage | null;
  sources?: ChatSource[];
  rag_error?: string;
};

export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch("/api/proxy/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
  return (await res.json()) as ChatResponse;
}

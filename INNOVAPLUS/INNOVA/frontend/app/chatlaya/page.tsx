"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SVGProps } from "react";

/** Base API */
const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

/** Types */
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

type ChatTurn = { 
  role: "user" | "assistant"; 
  text: string; 
  sources?: Hit[];
  timestamp: number;
  id: string;
};

type Thread = {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  pinned: boolean;
};

type IconProps = SVGProps<SVGSVGElement>;

/** Utils */
const generateId = () => Math.random().toString(36).substr(2, 9);

/** Icons */
function IconPlus(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 5v14m-7-7h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function IconChat(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPin(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M12 17l5-5H7l5 5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUpload(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l4-4 4 4m-4-4v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconThumbsUp(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M7 10v12m0 0l-3-3m3 3l3-3m-3 3V7a4 4 0 0 1 8 0v3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconThumbsDown(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M17 14V2m0 0l3 3m-3-3l-3 3m3-3v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCopy(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronLeft(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Main Component */
export default function ChatLayaPage() {
  // State
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Current thread data
  const currentThreadData = threads.find(t => t.id === currentThread);
  const currentTurns = turns.filter(t => t.role === "user" || t.role === "assistant");

  // Auto-collapse main sidebar when entering CHATLAYA
  useEffect(() => {
    // Force collapse of main sidebar by setting CSS variable
    document.documentElement.style.setProperty('--sidebar-w', '0px');
    return () => {
      // Restore sidebar width when leaving
      document.documentElement.style.setProperty('--sidebar-w', '280px');
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [turns, thinking]);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedThreads = localStorage.getItem("chatlaya.threads");
      const storedTurns = localStorage.getItem("chatlaya.turns");
      const storedCurrent = localStorage.getItem("chatlaya.currentThread");
      
      if (storedThreads) setThreads(JSON.parse(storedThreads));
      if (storedTurns) setTurns(JSON.parse(storedTurns));
      if (storedCurrent) setCurrentThread(storedCurrent);
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("chatlaya.threads", JSON.stringify(threads));
      localStorage.setItem("chatlaya.turns", JSON.stringify(turns));
      if (currentThread) localStorage.setItem("chatlaya.currentThread", currentThread);
    } catch {}
  }, [threads, turns, currentThread]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && prompt) setPrompt("");
      if (e.key === "Enter" && !e.shiftKey && prompt.trim()) {
        e.preventDefault();
        handleSendMessage();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prompt]);

  // Actions
  const createNewThread = () => {
    const newThread: Thread = {
      id: generateId(),
      title: "Nouvelle conversation",
      lastMessage: "",
      timestamp: Date.now(),
      pinned: false
    };
    setThreads(prev => [newThread, ...prev]);
    setCurrentThread(newThread.id);
    setTurns([]);
  };

  const selectThread = (threadId: string) => {
    setCurrentThread(threadId);
    const threadTurns = turns.filter(t => t.role === "user" || t.role === "assistant");
    setTurns(threadTurns);
  };

  const deleteThread = (threadId: string) => {
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (currentThread === threadId) {
      setCurrentThread(null);
      setTurns([]);
    }
  };

  const togglePin = (threadId: string) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, pinned: !t.pinned } : t
    ));
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || thinking) return;
    
    const message = prompt.trim();
    setPrompt("");
    
    // Add user message
    const userTurn: ChatTurn = {
      id: generateId(),
      role: "user",
      text: message,
      timestamp: Date.now()
    };
    
    setTurns(prev => [...prev, userTurn]);
    setThinking(true);

    try {
      const resp = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message }),
      });
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      
      const assistantTurn: ChatTurn = {
        id: generateId(),
        role: "assistant",
        text: data.answer ?? "",
        sources: data.sources ?? [],
        timestamp: Date.now()
      };
      
      setTurns(prev => [...prev, assistantTurn]);
      
      // Update thread title if first message
      if (currentThreadData && !currentThreadData.lastMessage) {
        setThreads(prev => prev.map(t => 
          t.id === currentThread 
            ? { ...t, title: message.slice(0, 50) + (message.length > 50 ? "..." : ""), lastMessage: message }
            : t
        ));
      }
    } catch (error) {
      const errorTurn: ChatTurn = {
        id: generateId(),
        role: "assistant",
        text: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        timestamp: Date.now()
      };
      setTurns(prev => [...prev, errorTurn]);
    } finally {
      setThinking(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadErr(null);

    try {
      const form = new FormData();
      Array.from(files).forEach(file => form.append("files", file));
      const resp = await fetch(`${API}/documents`, { method: "POST", body: form });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    } catch (error) {
      setUploadErr(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const filteredThreads = useMemo(() => {
    let filtered = threads;
    if (searchQuery) {
      filtered = threads.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [threads, searchQuery]);

  return (
    <div className="flex h-screen bg-slate-50 w-full">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} flex flex-col border-r border-slate-200 bg-white transition-all duration-200`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {!sidebarCollapsed && (
            <h2 className="text-lg font-semibold text-slate-900">CHATLAYA</h2>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {sidebarCollapsed ? <IconChevronRight className="h-4 w-4" /> : <IconChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* New Thread Button */}
            <div className="p-4">
              <button
                onClick={createNewThread}
                className="w-full flex items-center gap-3 rounded-xl bg-sky-600 px-4 py-3 text-white font-medium hover:bg-sky-700 transition-colors"
              >
                <IconPlus className="h-4 w-4" />
                Nouvelle conversation
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-4">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher dans les conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* Threads List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-1">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => selectThread(thread.id)}
                    className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      currentThread === thread.id
                        ? "bg-sky-50 border border-sky-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {thread.pinned && <IconPin className="h-3 w-3 text-sky-600" />}
                        <h3 className="text-sm font-medium text-slate-900 truncate">
                          {thread.title}
                        </h3>
                      </div>
                      {thread.lastMessage && (
                        <p className="text-xs text-slate-500 truncate mt-1">
                          {thread.lastMessage}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatTime(thread.timestamp)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(thread.id);
                        }}
                        className="p-1 rounded hover:bg-slate-200"
                        title={thread.pinned ? "Désépingler" : "Épingler"}
                      >
                        <IconPin className={`h-3 w-3 ${thread.pinned ? 'text-sky-600' : 'text-slate-400'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id);
                        }}
                        className="p-1 rounded hover:bg-red-100 text-red-500"
                        title="Supprimer"
                      >
                        <IconTrash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area - Full Width */}
      <div className="flex-1 flex flex-col w-full">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">
              {currentThreadData?.title || "Sélectionnez une conversation"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium cursor-pointer hover:bg-sky-700 transition-colors">
              <IconUpload className="h-4 w-4" />
              {uploading ? "Import..." : "Uploader"}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {currentTurns.length === 0 && !thinking && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center mb-4">
                <IconChat className="h-8 w-8 text-sky-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Commencez une conversation
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Posez des questions sur vos documents ou explorez vos sources avec l'assistant IA.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Résumez mes documents",
                  "Quels sont les points clés ?",
                  "Comparez les versions"
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:border-sky-300 hover:text-sky-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentTurns.map((turn) => (
            <MessageBubble
              key={turn.id}
              turn={turn}
              onCopy={copyToClipboard}
            />
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                  <span className="text-sm">L'assistant réfléchit...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tapez votre message... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 pr-12 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-slate-100 text-slate-400"
                  title="Enregistrement vocal (bientôt)"
                >
                  <IconUpload className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || thinking}
              className="px-4 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Envoyer
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>Entrée pour envoyer • Shift+Entrée pour nouvelle ligne</span>
            <span>Jusqu'à 50 messages conservés</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Message Bubble Component */
function MessageBubble({ 
  turn, 
  onCopy 
}: { 
  turn: ChatTurn; 
  onCopy: (text: string) => void;
}) {
  const isUser = turn.role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
        isUser 
          ? "bg-sky-600 text-white" 
          : "bg-white border border-slate-200 shadow-sm"
      }`}>
        <div className="text-sm leading-relaxed">
          {turn.text}
        </div>
        
        {/* Sources integrated in chat */}
        {turn.sources && turn.sources.length > 0 && (
          <div className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            isUser 
              ? "bg-white/20 text-white" 
              : "bg-slate-50 text-slate-600"
          }`}>
            <div className="font-medium mb-2">📚 Sources utilisées:</div>
            <div className="space-y-2">
              {turn.sources.slice(0, 3).map((source, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {source.payload?.title || "Source"}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      Score: {(source.score * 100).toFixed(0)}%
                    </div>
                  </div>
                  {source.payload?.url && (
                    <a
                      href={String(source.payload.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:text-sky-700 text-xs underline"
                    >
                      Ouvrir
                    </a>
                  )}
                </div>
              ))}
              {turn.sources.length > 3 && (
                <div className="text-xs opacity-75">
                  +{turn.sources.length - 3} autres sources
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={`mt-3 flex items-center gap-2 ${
          isUser ? "text-white/80" : "text-slate-500"
        }`}>
          <span className="text-xs">
            {new Date(turn.timestamp).toLocaleTimeString("fr-FR", { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </span>
          {!isUser && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCopy(turn.text)}
                className="p-1 rounded hover:bg-slate-200 transition-colors"
                title="Copier"
              >
                <IconCopy className="h-3 w-3" />
              </button>
              <button
                className="p-1 rounded hover:bg-slate-200 transition-colors"
                title="Utile"
              >
                <IconThumbsUp className="h-3 w-3" />
              </button>
              <button
                className="p-1 rounded hover:bg-slate-200 transition-colors"
                title="Pas utile"
              >
                <IconThumbsDown className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
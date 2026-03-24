"use client";

import { useState } from "react";

const STARTERS = [
  "Comprendre ma trajectoire actuelle",
  "Cadrer un nouveau besoin entreprise",
  "Trouver des opportunités adaptées",
  "Choisir le bon produit KORYXA",
];

export default function PlatformChatlayaPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Bonjour ! Je suis LAYA, votre assistant intelligent KORYXA. Comment puis-je vous aider aujourd'hui ?" },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((current) => [
      ...current,
      { role: "user", content: input },
      { role: "assistant", content: "Je comprends votre question. Basé sur votre profil et votre trajectoire Data Analyst, je vous recommande de..." },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-1 flex-col">
        <div className="border-b border-slate-200 p-4">
          <h1 className="font-semibold">ChatLAYA</h1>
          <p className="text-sm text-slate-500">Assistant intelligent KORYXA</p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 1 ? (
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold">Bienvenue sur ChatLAYA</h2>
                <p className="mt-2 text-lg text-slate-500">Posez-moi vos questions sur KORYXA, votre trajectoire, vos opportunités ou vos projets.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {STARTERS.map((starter) => (
                  <button key={starter} type="button" onClick={() => setInput(starter)} className="rounded-2xl border border-slate-200 p-4 text-left transition hover:shadow-lg">
                    <p className="text-sm font-medium">{starter}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl rounded-2xl px-6 py-4 text-sm leading-relaxed ${message.role === "user" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-3">
            <textarea
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400"
              placeholder="Posez votre question à LAYA..."
            />
            <button type="button" onClick={send} className="rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white">
              Envoyer
            </button>
          </div>
        </div>
      </div>
      <aside className="hidden w-80 border-l border-slate-200 bg-slate-50 p-6 lg:block">
        <h3 className="font-semibold">Contexte actif</h3>
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium">Trajectoire</p>
            <p className="text-xs text-slate-500">Data Analyst - 72% progression</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium">Formateur</p>
            <p className="text-xs text-slate-500">Amadou Diallo</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium">Opportunités</p>
            <p className="text-xs text-slate-500">3 correspondances actives</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

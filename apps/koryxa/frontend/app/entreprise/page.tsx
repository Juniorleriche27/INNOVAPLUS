"use client";

import { useState } from "react";
import { AUTH_API_BASE, IS_V1_SIMPLE } from "@/lib/env";

const MISSION_TYPES = ["analyse", "pipeline", "modele", "dashboard", "autre"] as const;

export default function EntreprisePage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      organisation: String(data.get("organisation") || "").trim(),
      country: String(data.get("country") || "").trim(),
      domain: String(data.get("domain") || "").trim(),
      description: String(data.get("description") || "").trim(),
      mission_type: String(data.get("mission_type") || "").trim(),
      contact: String(data.get("contact") || "").trim(),
      source: "entreprise_v1",
    };

    setStatus("sending");
    setMessage(null);
    try {
      const res = await fetch(`${AUTH_API_BASE}/plusbook/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setStatus("sent");
      setMessage("Merci, votre besoin a bien ete transmis.");
      form.reset();
    } catch (err) {
      console.error("Entreprise form error", err);
      setStatus("error");
      setMessage("Envoi impossible pour le moment. Merci de reessayer.");
    }
  }

  return (
    <main className="px-4 py-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Entreprise</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Entreprise</h1>
          <p className="mt-2 text-base text-slate-600">
            KORYXA vous aide a exploiter vos donnees et transforme vos besoins en missions.
          </p>
          <div className="mt-6">
            <a href="#deposer" className="btn-primary">Etre accompagne</a>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Ce que KORYXA fait pour vous</h2>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>structurer et nettoyer les donnees</li>
            <li>analyse et tableaux de bord</li>
            <li>aide a la decision</li>
            <li>accompagnement data (equipe KORYXA)</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Ce que vous apportez</h2>
          <p className="mt-3 text-sm text-slate-600">
            Vous decrivez des besoins reels, vous proposez des missions concretes (meme petites),
            et vous participez au developpement des talents.
          </p>
        </section>

        <section id="deposer" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Deposer un besoin</h2>
          <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Nom organisation
                <input name="organisation" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-slate-700">
                Pays
                <input name="country" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-slate-700">
                Domaine
                <input name="domain" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm text-slate-700">
                Type de mission
                <select name="mission_type" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <option value="">Selectionner</option>
                  {MISSION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-sm text-slate-700">
              Description du besoin
              <textarea name="description" required rows={5} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm text-slate-700">
              Contact (email / whatsapp)
              <input name="contact" required className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </label>

            {message && (
              <p className={`text-sm ${status === "sent" ? "text-emerald-600" : "text-red-600"}`}>{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary w-fit disabled:opacity-60"
            >
              {status === "sending" ? "Envoi..." : "Envoyer"}
            </button>
          </form>
          {!IS_V1_SIMPLE && (
            <p className="mt-3 text-xs text-slate-500">Mode V1 simple inactive.</p>
          )}
        </section>
      </div>
    </main>
  );
}

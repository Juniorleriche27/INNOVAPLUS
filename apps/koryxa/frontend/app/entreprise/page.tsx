"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { AUTH_API_BASE, IS_V1_SIMPLE } from "@/lib/env";

const MISSION_TYPES = ["analyse", "pipeline", "modele", "dashboard", "autre"] as const;

const VALUE_POINTS = [
  "Besoins data transformes en missions plus claires",
  "Execution accompagnee par KORYXA du cadrage au livrable",
  "Formation reliee a des cas utiles pour l'organisation",
];

const ENTERPRISE_BLOCKS = [
  {
    title: "Cadrer le besoin",
    text: "Tu pars d'un enjeu concret: reporting, structuration, analyse, dashboard, automatisation ou modele.",
  },
  {
    title: "Transformer en mission",
    text: "KORYXA formalise le besoin pour qu'il devienne une mission plus nette, plus suivable et plus productive.",
  },
  {
    title: "Recevoir un resultat exploitable",
    text: "L'organisation recupere un rendu mieux structure, et les apprenants gagnent une vraie experience.",
  },
];

const GUARANTEES = [
  "Besoin reformule de maniere exploitable",
  "Mission suivie avec un cadre KORYXA",
  "Livrables plus lisibles pour l'organisation",
  "Experience utile pour les talents en formation",
];

export default function EntreprisePage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
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
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_62%)]" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.92fr] lg:items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                  Entreprise
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  besoins, missions, livrables
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Transforme un besoin data en mission plus claire et plus exploitable.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  KORYXA aide les organisations a formaliser leurs besoins, structurer les missions et encadrer
                  l'execution. L'objectif est simple: sortir un resultat utile, pas une simple intention.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a href="#deposer" className="btn-primary">
                  Deposer un besoin
                </a>
                <Link href="/about" className="btn-secondary">
                  Comprendre KORYXA
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {VALUE_POINTS.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/80 bg-white/78 px-4 py-4 text-sm font-medium leading-6 text-slate-700 shadow-[0_12px_28px_rgba(148,163,184,0.14)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_22px_54px_rgba(15,23,42,0.2)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Ce que KORYXA garantit</p>
              <div className="mt-5 grid gap-3">
                {GUARANTEES.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mode de travail</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Comment KORYXA travaille avec une organisation</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Il faut que le besoin soit lisible, que la mission soit suivable et que le resultat puisse etre reutilise par l'entreprise.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {ENTERPRISE_BLOCKS.map((item, index) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
              >
                <div className="absolute right-5 top-5 text-5xl font-semibold tracking-[-0.08em] text-slate-200">
                  0{index + 1}
                </div>
                <div className="relative max-w-xs">
                  <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Ce que vous apportez</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Un besoin reel, meme petit, mais concret.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Le meilleur point de depart n'est pas un grand discours. C'est un probleme clair, un contexte, un objectif
              et quelques contraintes pour transformer l'intention en travail utile.
            </p>
            <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-700">
              <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Organisation, pays et domaine</li>
              <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Type de mission attendu</li>
              <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Description du besoin et contact</li>
            </ul>
          </article>

          <section id="deposer" className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Demande d'accompagnement</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Deposer un besoin</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Donne le contexte, le type de mission et un contact. KORYXA pourra ensuite reformuler le besoin de maniere plus exploitable.
            </p>

            <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-700">
                  Nom organisation
                  <input
                    name="organisation"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Pays
                  <input
                    name="country"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Domaine
                  <input
                    name="domain"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Type de mission
                  <select
                    name="mission_type"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">Selectionner</option>
                    {MISSION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-sm text-slate-700">
                Description du besoin
                <textarea
                  name="description"
                  required
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="text-sm text-slate-700">
                Contact (email / whatsapp)
                <input
                  name="contact"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              {message ? (
                <p className={`text-sm font-medium ${status === "sent" ? "text-emerald-600" : "text-red-600"}`}>{message}</p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-primary w-fit disabled:opacity-60"
                >
                  {status === "sending" ? "Envoi..." : "Envoyer le besoin"}
                </button>
                <Link href="/school" className="btn-secondary">
                  Voir la logique School
                </Link>
              </div>
            </form>

            {!IS_V1_SIMPLE ? (
              <p className="mt-4 text-xs text-slate-500">Mode V1 simple inactive.</p>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}

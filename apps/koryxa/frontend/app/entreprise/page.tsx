"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useState } from "react";
import { AUTH_API_BASE } from "@/lib/env";

const NEED_SIGNAL_ITEMS = [
  "Besoin qualifié dès le départ",
  "Mission structurée et exploitable",
  "Publication optionnelle ou traitement privé",
  "Exécution suivie jusqu'au résultat utile",
];

const ENTERPRISE_OFFER = [
  {
    title: "Qualification du besoin",
    text: "KORYXA aide à clarifier l'objectif, le contexte, l'urgence, le livrable attendu et le type de mission pour éviter les demandes floues.",
  },
  {
    title: "Transformation en mission",
    text: "Le besoin devient une mission claire, un lot de travail exploitable, un mini-projet ou une demande accompagnée.",
  },
  {
    title: "Orientation vers les bonnes ressources",
    text: "Le besoin peut être relié à des trajectoires, des profils, des outils et à un cadre d'exécution. MyPlanningAI et ChatLAYA peuvent soutenir le pilotage et la clarification.",
  },
  {
    title: "Suivi et restitution",
    text: "Le besoin ne flotte pas. Il avance avec plus de visibilité, de suivi et une restitution finale plus utile pour l'organisation.",
  },
];

const NEED_TYPES = [
  "Reporting",
  "Automatisation",
  "Structuration de données",
  "Analyse",
  "Tableau de bord",
  "Support opérationnel",
  "Recherche",
  "Coordination",
  "Besoin de stage",
  "Besoin de mission",
  "Besoin de collaboration",
];

const TREATMENT_MODES = [
  {
    title: "Privé",
    text: "Le besoin reste interne, non public, et KORYXA aide à le qualifier puis à le structurer proprement.",
  },
  {
    title: "Publié",
    text: "Le besoin devient une opportunité visible, déjà clarifiée et prête à être lue comme une mission exploitable.",
  },
  {
    title: "Accompagné",
    text: "KORYXA structure le besoin et suit l'exécution de façon plus encadrée jusqu'au résultat attendu.",
  },
];

const OPPORTUNITIES = [
  {
    title: "Mission data",
    text: "Structuration et analyse de données terrain pour une organisation en croissance.",
  },
  {
    title: "Stage en analyse",
    text: "Besoin encadré pour support d'analyse, suivi de données et restitution claire.",
  },
  {
    title: "Projet d'automatisation",
    text: "Processus à clarifier puis à automatiser avec un livrable attendu et un cadre précis.",
  },
  {
    title: "Support reporting",
    text: "Besoin de tableau de bord et de suivi opérationnel pour une équipe métier.",
  },
  {
    title: "Collaboration opérationnelle",
    text: "Mission courte ou ponctuelle avec périmètre défini, pilotage et restitution attendue.",
  },
];

const PROCESS_STEPS = [
  {
    title: "Déposer un besoin",
    text: "Décrire l'objectif, le contexte, les contraintes et le résultat attendu.",
  },
  {
    title: "Le structurer avec KORYXA",
    text: "Transformer la demande en mission plus claire, exploitable et mieux cadrée.",
  },
  {
    title: "Choisir son mode de traitement",
    text: "Privé, publié ou accompagné selon le niveau d'ouverture et d'encadrement souhaité.",
  },
  {
    title: "Suivre l'exécution et récupérer le résultat",
    text: "Piloter l'avancement, garder de la visibilité et récupérer un livrable utile.",
  },
];

const MISSION_TYPES = [
  { value: "reporting", label: "Reporting" },
  { value: "automatisation", label: "Automatisation" },
  { value: "structuration", label: "Structuration de données" },
  { value: "analyse", label: "Analyse" },
  { value: "dashboard", label: "Tableau de bord" },
  { value: "support", label: "Support opérationnel" },
  { value: "recherche", label: "Recherche" },
  { value: "coordination", label: "Coordination" },
  { value: "stage", label: "Besoin de stage" },
  { value: "mission", label: "Besoin de mission" },
  { value: "collaboration", label: "Besoin de collaboration" },
  { value: "autre", label: "Autre" },
] as const;

const URGENCY_LEVELS = ["Faible", "Modérée", "Élevée", "Prioritaire"] as const;

const TREATMENT_OPTIONS = [
  { value: "prive", label: "Privé" },
  { value: "publie", label: "Publié" },
  { value: "accompagne", label: "Accompagné" },
] as const;

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
      context: String(data.get("context") || "").trim(),
      deliverable: String(data.get("deliverable") || "").trim(),
      urgency: String(data.get("urgency") || "").trim(),
      treatment_mode: String(data.get("treatment_mode") || "").trim(),
      source: "entreprise_v2",
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
      setMessage("Merci, votre besoin a bien été transmis.");
      form.reset();
    } catch (err) {
      console.error("Entreprise form error", err);
      setStatus("error");
      setMessage("Envoi impossible pour le moment. Merci de réessayer.");
    }
  }

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_62%)]" aria-hidden />
          <div className="relative grid gap-8 lg:grid-cols-[1.32fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                  Entreprise
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  besoin qualifié • mission structurée
                </span>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                  Déposez un besoin, KORYXA le structure en mission claire et exploitable.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  KORYXA aide les organisations à qualifier un besoin, préciser le contexte, choisir son mode de
                  traitement, suivre l'exécution et récupérer un résultat utile. Le besoin peut rester privé, être
                  accompagné, ou devenir une opportunité visible une fois structuré.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href="#deposer" className="btn-primary w-full justify-center sm:w-auto">
                  Déposer un besoin
                </a>
                <a href="#fonctionnement" className="btn-secondary w-full justify-center sm:w-auto">
                  Comprendre le fonctionnement
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                {NEED_SIGNAL_ITEMS.map((item) => (
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
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Ce que vous qualifiez dès le départ</p>
              <div className="mt-5 grid gap-3">
                {["Objectif", "Contexte", "Livrable attendu", "Niveau d'urgence", "Mode de traitement"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-300">
                Une entreprise ne publie pas juste une offre. Elle dépose un besoin et KORYXA le transforme en mission
                plus claire, publiable et exécutable.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Offre produit</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Ce que nous proposons aux entreprises</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              KORYXA Entreprise n'est pas une simple page d'annonces. C'est un système de qualification, de
              structuration, de publication optionnelle et de pilotage.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {ENTERPRISE_OFFER.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
              >
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Types de besoins</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Des besoins concrets que les organisations reconnaissent vite</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              KORYXA peut structurer différents formats de besoins opérationnels, du support ponctuel au mini-projet
              mieux cadré.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {NEED_TYPES.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Orientation</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Le besoin peut ensuite être orienté vers le bon cadre</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Une fois qualifié, le besoin peut être relié à une trajectoire, à des profils, à un outil de pilotage ou à
              une exécution plus accompagnée selon la nature du travail.
            </p>
            <div className="mt-6 grid gap-3">
              {["Trajectoires guidées", "Profils adaptés", "MyPlanningAI pour le pilotage", "ChatLAYA pour la clarification"].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Modes de traitement</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Choisir le bon niveau d'ouverture et d'accompagnement</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Un même besoin ne suit pas toujours le même chemin. KORYXA propose trois modes lisibles dès le départ.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {TREATMENT_MODES.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
              >
                <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Opportunités visibles</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Besoins transformés en opportunités</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Ces cartes représentent des besoins déjà structurés et publiés. Elles montrent le résultat d'un cadrage,
              pas de simples annonces brutes.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {OPPORTUNITIES.map((item) => (
              <article
                key={item.title}
                className="rounded-[26px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] p-5"
              >
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="fonctionnement"
          className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a,#0b2742)] p-6 text-white shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Processus</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">Comment ça marche côté entreprise</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-300">
              La logique est simple: déposer un besoin, le structurer, choisir le bon mode de traitement puis suivre
              l'exécution jusqu'au résultat.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PROCESS_STEPS.map((item, index) => (
              <article key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">0{index + 1}</p>
                <p className="mt-3 text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="deposer"
          className="rounded-[34px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8"
        >
          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Passer à l'action</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                  Déposez un besoin clair ou laissez KORYXA vous aider à le structurer.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  Donnez le contexte, le type de besoin, le livrable attendu et le mode de traitement souhaité. KORYXA
                  pourra ensuite le reformuler en mission plus claire et plus exploitable.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  Réponse attendue: besoin qualifié, mode de traitement choisi et cadre de mission plus lisible.
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  Besoin de parler avant de déposer ?{" "}
                  <a className="font-semibold text-sky-700 hover:text-sky-800" href="mailto:hello@koryxa.africa">
                    Parler à l'équipe
                  </a>
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
                  Vous pouvez aussi relire le fonctionnement de KORYXA sur la page{" "}
                  <Link className="font-semibold text-sky-700 hover:text-sky-800" href="/about">
                    À propos
                  </Link>
                  .
                </div>
              </div>
            </div>

            <form className="grid gap-4 rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-5 shadow-sm" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-slate-700">
                  Organisation
                  <input
                    name="organisation"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Pays
                  <input
                    name="country"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Secteur / domaine
                  <input
                    name="domain"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <label className="text-sm text-slate-700">
                  Type de besoin
                  <select
                    name="mission_type"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">Sélectionner</option>
                    {MISSION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-700">
                  Niveau d'urgence
                  <select
                    name="urgency"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">Sélectionner</option>
                    {URGENCY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-700">
                  Mode de traitement souhaité
                  <select
                    name="treatment_mode"
                    required
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="">Sélectionner</option>
                    {TREATMENT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-sm text-slate-700">
                Contexte et problème à résoudre
                <textarea
                  name="context"
                  required
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="text-sm text-slate-700">
                Livrable attendu
                <input
                  name="deliverable"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="text-sm text-slate-700">
                Description libre
                <textarea
                  name="description"
                  required
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              <label className="text-sm text-slate-700">
                Contact (email / WhatsApp)
                <input
                  name="contact"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                />
              </label>

              {message ? (
                <p className={`text-sm font-medium ${status === "sent" ? "text-emerald-600" : "text-red-600"}`}>{message}</p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={status === "sending"} className="btn-primary w-fit disabled:opacity-60">
                  {status === "sending" ? "Envoi..." : "Déposer un besoin"}
                </button>
                <a
                  href="mailto:hello@koryxa.africa"
                  className="btn-secondary"
                >
                  Parler à l'équipe
                </a>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

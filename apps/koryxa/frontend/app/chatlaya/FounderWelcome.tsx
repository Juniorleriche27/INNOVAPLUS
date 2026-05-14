"use client";

import {
  Users, Target, Package, DollarSign, BarChart2, MessageCircle,
  FileText, ArrowRight, ChevronLeft, Sparkles,
} from "lucide-react";

const STEPS = [
  { id: "client",   icon: Users,          step: "01", label: "Client cible",    desc: "Qui achète, pourquoi, comment l'atteindre" },
  { id: "probleme", icon: Target,         step: "02", label: "Problème",        desc: "La douleur réelle que vous résolvez" },
  { id: "offre",    icon: Package,        step: "03", label: "Offre",           desc: "Ce que vous vendez, précisément" },
  { id: "prix",     icon: DollarSign,     step: "04", label: "Prix & Modèle",   desc: "Tarification et ce qu'elle inclut" },
  { id: "modele",   icon: BarChart2,      step: "05", label: "Business Model",  desc: "Comment votre activité génère des revenus" },
  { id: "message",  icon: MessageCircle, step: "06", label: "Message de vente", desc: "Ce que vous dites pour convaincre" },
];

const OUTPUT_TAGS = [
  "Clarté stratégique",
  "6 sections rédigées",
  "Export PDF premium",
  "Votre voix, pas celle de l'IA",
];

export default function FounderWelcome({
  firstName,
  onStart,
  onBack,
  starting = false,
}: {
  firstName?: string;
  onStart: () => void;
  onBack: () => void;
  starting?: boolean;
}) {
  return (
    <main className="h-full min-h-0 overflow-hidden">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_16px_rgba(15,23,42,0.06)]">

        {/* ── Top bar ── */}
        <div className="shrink-0 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Revenir au mode général
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="sidebar-nav flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-6 py-10 sm:px-10 sm:py-14">

            {/* ── Hero ──────────────────────────────────────────────── */}
            <div className="mb-12">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-500 shadow-sm ring-1 ring-slate-100/60">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-bold text-white">
                  F
                </span>
                ChatLAYA Founder
              </div>

              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[32px]">
                {firstName ? `${firstName}, cadrez` : "Cadrez"} votre projet.<br />
                <span className="bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
                  Construisez un dossier premium.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-500">
                Founder est un espace de travail guidé pour les porteurs de projet. En 6 étapes structurées, vous clarifiez ce qui compte — et vous repartez avec un dossier rédigé dans vos propres mots.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Pour porteurs de projet", "Outil de cadrage guidé", "Dossier exportable"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Modules ───────────────────────────────────────────── */}
            <div className="mb-12">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Ce que vous allez construire
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {STEPS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.id}
                      className="group flex items-start gap-3.5 rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm transition-all hover:border-sky-200 hover:shadow-[0_2px_8px_rgba(14,165,233,0.10)]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 ring-1 ring-sky-100 transition-colors group-hover:bg-sky-100">
                        <Icon className="h-4 w-4 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300">{s.step}</span>
                          <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-slate-400">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Output block ──────────────────────────────────────── */}
            <div className="mb-10 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-violet-50/50">
              <div className="flex items-start gap-4 px-5 py-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 shadow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">Ce que vous obtenez à la fin</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    Un dossier projet exportable — entièrement rédigé dans vos propres mots, structuré autour de votre réalité business. Prêt à partager avec des partenaires, des investisseurs ou votre équipe.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {OUTPUT_TAGS.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onStart}
                disabled={starting}
                className="flex items-center justify-center gap-2.5 rounded-full bg-sky-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {starting ? "Ouverture du workspace…" : "Commencer mon parcours"}
                {!starting && <ArrowRight className="h-4 w-4" />}
              </button>
              <p className="text-xs text-slate-400">
                Votre travail est sauvegardé automatiquement.
              </p>
            </div>

            <div className="h-12" />
          </div>
        </div>
      </div>
    </main>
  );
}

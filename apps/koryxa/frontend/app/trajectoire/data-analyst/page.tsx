import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Clock3, ExternalLink, PlayCircle, Sparkles, TerminalSquare } from "lucide-react";

import { FORMATION_DATA_ANALYST_URL } from "@/lib/env";
import { getFormationTrack } from "@/lib/formation";

export const metadata: Metadata = {
  title: "Data Analyst | Formation IA | KORYXA",
  description: "Sous-page dédiée au projet Data Analyst KORYXA Formation, sans remplacer la page principale Formation IA.",
};

export default async function DataAnalystLandingPage() {
  const track = await getFormationTrack("data_analyst");
  const externalUrl = FORMATION_DATA_ANALYST_URL || null;

  return (
    <main className="space-y-10 pb-12">
      <section className="relative overflow-hidden rounded-[36px] border border-sky-200/20 bg-[linear-gradient(135deg,#071225_0%,#0c1a31_48%,#191735_100%)] px-6 py-14 text-white shadow-[0_40px_100px_rgba(2,12,27,0.34)] sm:px-10 lg:px-14">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.08) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        <div aria-hidden className="absolute -right-20 top-8 h-64 w-64 rounded-full bg-fuchsia-500/18 blur-3xl" />
        <div aria-hidden className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-200 shadow-[0_0_30px_rgba(251,146,60,0.14)]">
              <span>🔥</span>
              Offre de lancement
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="text-lg text-slate-400 line-through">55 000 F</span>
              <span className="rounded-2xl bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-2 text-2xl font-black tracking-tight text-white">
                29 000 FCFA
              </span>
              <span className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-300">
                -47%
              </span>
            </div>
            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.07em] sm:text-6xl lg:text-7xl">
              De <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">zéro</span> à
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent"> professionnel</span>
              <span className="block text-orange-300">de la data</span>
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-9 text-slate-300 sm:text-2xl">
              {track.description} Cette sous-page est dédiée à ton projet prêt, sans écraser la page principale Formation IA.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href={`/trajectoire/parcours/${track.track_key}`}
                className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-4 text-lg font-bold text-white shadow-[0_20px_50px_rgba(14,165,233,0.34)] transition hover:scale-[1.02]"
              >
                Voir le parcours intégré
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              {externalUrl ? (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-3xl border border-white/18 bg-white/6 px-7 py-4 text-lg font-semibold text-white backdrop-blur transition hover:bg-white/12"
                >
                  Ouvrir la version Vercel
                  <ExternalLink className="ml-2 h-5 w-5" />
                </a>
              ) : (
                <Link
                  href="/trajectoire/demarrer"
                  className="inline-flex items-center justify-center rounded-3xl border border-white/18 bg-white/6 px-7 py-4 text-lg font-semibold text-white backdrop-blur transition hover:bg-white/12"
                >
                  Démarrer le diagnostic
                  <PlayCircle className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>

          <div className="relative rounded-[30px] border border-white/10 bg-[#06101f]/84 p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Projet prêt</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{track.title}</h2>
            <p className="mt-3 text-base leading-8 text-slate-300">{track.summary}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-center">
                <BookOpen className="mx-auto h-5 w-5 text-sky-300" />
                <p className="mt-2 text-2xl font-black text-white">{track.module_count}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Modules</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-center">
                <Clock3 className="mx-auto h-5 w-5 text-sky-300" />
                <p className="mt-2 text-xl font-black text-white">{track.estimated_duration || "-"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Durée</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-sky-300" />
                <p className="mt-2 text-xl font-black text-white">{track.skills.length}+</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Compétences</p>
              </div>
            </div>
            <div className="mt-8 rounded-2xl border border-white/8 bg-white/4 p-4">
              <p className="text-sm text-slate-400">Aperçu des premiers modules :</p>
              <ul className="mt-3 space-y-2 text-sm text-white">
                {track.modules.slice(0, 4).map((module) => (
                  <li key={module.id} className="flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4 text-cyan-300" />
                    <span>{module.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-[#050c1a] px-6 py-12 text-white shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">Programme complet</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Tes 8 modules sont déjà là</h2>
            <p className="mt-3 max-w-3xl text-base leading-8 text-slate-400">
              Cette sous-page regroupe ton projet Data Analyst, avec les notebooks et datasets déjà branchés sur KORYXA.
            </p>
          </div>
          <Link
            href={`/trajectoire/parcours/${track.track_key}`}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
          >
            Ouvrir le parcours
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {track.modules.map((module, index) => (
            <Link
              key={module.id}
              href={`/trajectoire/modules/${module.id}`}
              className="group overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03] transition hover:-translate-y-1 hover:border-cyan-300/28"
            >
              <div
                className={`h-28 bg-gradient-to-br ${
                  index % 4 === 0
                    ? "from-blue-500 to-cyan-600"
                    : index % 4 === 1
                      ? "from-cyan-500 to-teal-600"
                      : index % 4 === 2
                        ? "from-violet-500 to-fuchsia-600"
                        : "from-orange-500 to-pink-600"
                }`}
              />
              <div className="p-5">
                <div className="-mt-12 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Module {module.order_index}</p>
                <h3 className="mt-2 text-xl font-bold text-white">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{module.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

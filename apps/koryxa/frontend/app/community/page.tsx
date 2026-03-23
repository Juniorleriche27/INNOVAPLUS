import type { Metadata } from "next";
import Link from "next/link";
import CommunityComposer from "./_components/CommunityComposer";
import { getCommunityOverview } from "./data";

export const metadata: Metadata = {
  title: "Réseau IA | KORYXA",
  description:
    "Discutez des métiers IA, des cas d'usage entreprise, des outils, des preuves et des opportunités dans le réseau professionnel KORYXA.",
};

const NETWORK_VALUES = [
  "Discussions à forte valeur sur les métiers IA et les cas d'usage réels.",
  "Groupes thématiques structurés, pas un fil social bruyant.",
  "Passerelles directes entre communauté, progression, validation et opportunités.",
];

export default async function CommunityPage() {
  const { groups, posts } = await getCommunityOverview();

  return (
    <main className="grid gap-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,247,255,0.96))] px-6 py-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_60%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                Réseau IA
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                communauté • expertise • carrières • cas d'usage
              </span>
            </div>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                Le réseau KORYXA pour discuter d'IA, de métiers IA et de cas d'usage réels.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                KORYXA intègre un réseau social professionnel orienté signal, conçu pour relier talents, formateurs,
                entreprises et équipes KORYXA autour de discussions utiles, de preuves, de missions et de progression.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/signup?redirect=%2Fcommunity" className="btn-primary w-full justify-center sm:w-auto">
                Rejoindre le réseau
              </Link>
              <Link href="/trajectoire" className="btn-secondary w-full justify-center sm:w-auto">
                Explorer les trajectoires
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {posts.slice(0, 3).map((item, index) => (
              <article key={item.title} className="rounded-[28px] border border-slate-200/80 bg-white/88 p-5 shadow-sm">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${
                    index === 0
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : index === 1
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.group_name || "Réseau IA"}
                </span>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{item.title}</h2>
                <p className="mt-3 text-sm text-slate-500">{item.author_name || "Membre du réseau"}</p>
                <Link href={`/community/posts/${item.id}`} className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800">
                  Voir la discussion
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {NETWORK_VALUES.map((value, index) => (
          <article key={value} className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Valeur {index + 1}</p>
            <p className="mt-4 text-base font-semibold leading-7 text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[32px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Groupes</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Groupes thématiques à forte valeur</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Chaque groupe doit ressembler à un cercle d'expertise exploitable, pas à un forum bruyant.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {groups.slice(0, 4).map((group) => (
              <article key={group.id} className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                  {group.members_count || 0} membres
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{group.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{group.description}</p>
                <Link href={`/community/groups/${group.id}`} className="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-800">
                  Ouvrir le groupe
                </Link>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Réseau intégré</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Le réseau n'est pas un module à part.</h2>
          <div className="mt-6 grid gap-3 text-sm leading-7 text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Les discussions doivent alimenter l'orientation, les preuves, les missions et les opportunités.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Les formateurs y partagent des standards, des cas d'usage et des feedbacks contextualisés.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              Les entreprises peuvent y publier des besoins, lancer des échanges ciblés et repérer des signaux de qualité.
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/formateurs" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
              Voir les formateurs
            </Link>
            <Link href="/talents" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Voir les profils
            </Link>
            <Link href="/community/messages" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Ouvrir les messages
            </Link>
          </div>
        </article>
      </section>

      <CommunityComposer groups={groups.map((group) => ({ id: group.id, name: group.name }))} />
    </main>
  );
}

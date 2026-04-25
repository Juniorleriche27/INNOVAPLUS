import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialite | KORYXA",
  description:
    "Principes de confidentialite KORYXA sur la collecte, l'usage et la protection des donnees.",
  openGraph: {
    title: "Confidentialite | KORYXA",
    description:
      "Principes de confidentialite KORYXA sur la collecte, l'usage et la protection des donnees.",
    url: "/legal/confidentialite",
  },
  twitter: {
    title: "Confidentialite | KORYXA",
    description:
      "Principes de confidentialite KORYXA sur la collecte, l'usage et la protection des donnees.",
  },
};

const PRIVACY_POINTS = [
  "KORYXA collecte uniquement les donnees utiles au fonctionnement du produit et a son amelioration.",
  "Les metriques techniques servent a comprendre les usages, pas a exposer inutilement des informations sensibles.",
  "Les preferences de contact, de notifications et de pilotage doivent rester lisibles et controlables.",
];

export default function PrivacyPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Confidentialite</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Une politique simple, lisible et proportionnee.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Le produit doit rester clair sur ce qu'il collecte, pourquoi il le fait et comment ces donnees servent
            l'usage. L'objectif n'est pas de remplir une page, mais de poser un cadre propre et defendable.
          </p>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="grid gap-4">
            {PRIVACY_POINTS.map((item, index) => (
              <article
                key={item}
                className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Point {index + 1}</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_22px_54px_rgba(15,23,42,0.2)] sm:p-8">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Continuer la lecture</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Pour comprendre le cadre global du produit, tu peux revenir a la presentation generale ou consulter les mentions legales.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/a-propos" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
              Aller sur A propos
            </Link>
            <Link href="/legal/mentions" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Voir les mentions legales
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

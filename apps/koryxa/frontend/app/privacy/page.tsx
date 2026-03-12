import Link from "next/link";

const PRIVACY_POINTS = [
  "KORYXA collecte uniquement les donnees utiles au fonctionnement du produit et a son amelioration.",
  "Les metriques techniques servent a comprendre l'usage global, pas a exposer des informations sensibles inutilement.",
  "Les preferences de notifications, de contact et d'usage doivent rester controlables par l'utilisateur.",
];

export default function PrivacyPage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[34px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">Confidentialite</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            La protection des donnees doit rester simple, lisible et proportionnee.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            Cette page resume la logique generale de confidentialite du produit. Elle sera completee par la documentation
            legale detaillee, mais le principe reste deja clair: collecter le necessaire, limiter le superflu et garder
            une utilisation responsable des donnees.
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
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Besoin d'un autre point d'entree ?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Pour comprendre le cadre global du produit, tu peux revenir a la presentation generale ou consulter les informations legales.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/about" className="inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-50">
              Aller sur A propos
            </Link>
            <Link href="/terms" className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
              Voir les mentions
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

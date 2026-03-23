import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "À propos | KORYXA",
  description:
    "Découvrez la mission, les principes et l'architecture produit de KORYXA entre besoins IA, trajectoires IA et exécution réelle.",
};

const PILLARS = [
  {
    title: "Orchestrer plutôt qu'empiler",
    text: "KORYXA relie des besoins, des capacités humaines, des produits, des validations et des opportunités au lieu d'empiler des modules isolés.",
  },
  {
    title: "Rendre l'IA achetable",
    text: "Le langage produit doit rester ancré dans l'analyse, l'automatisation, la structuration et les livrables utiles.",
  },
  {
    title: "Rendre la progression défendable",
    text: "Les trajectoires doivent produire des preuves, des validations et des profils vérifiés qui ont une valeur réelle.",
  },
];

const NOT_THIS = [
  "Pas une promesse vague autour de l'IA.",
  "Pas une école générique déconnectée du terrain.",
  "Pas un cabinet RH ou une marketplace de coachs sans gouvernance.",
  "Pas un simple dashboard rebadgé.",
];

export default function AboutPage() {
  return (
    <main className="grid gap-8">
      <section className="relative overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,247,255,0.98))] px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_60%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.22fr_0.78fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-700">
                À propos
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                mission • cadre • architecture
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                KORYXA organise la rencontre entre besoins IA, trajectoires IA et exécution réelle.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Le projet n'a pas vocation à être un simple site vitrine. KORYXA doit devenir une plateforme capable
                de cadrer un besoin, d'orienter une progression, de valider un niveau et d'activer une exécution crédible.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/entreprise" className="btn-primary">
                Voir l'offre entreprise
              </Link>
              <Link href="/trajectoire" className="btn-secondary">
                Voir Trajectoire
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">KORYXA n'est pas</p>
            <div className="mt-5 grid gap-3">
              {NOT_THIS.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <article key={pillar.title} className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">{pillar.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{pillar.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

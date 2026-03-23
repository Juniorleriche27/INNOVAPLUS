import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Entreprise | KORYXA",
  description:
    "Cadrez vos besoins IA/data, transformez-les en cas d'usage exécutables et pilotez la livraison avec KORYXA.",
  openGraph: {
    title: "Entreprise | KORYXA",
    description:
      "Cadrez vos besoins IA/data, transformez-les en cas d'usage exécutables et pilotez la livraison avec KORYXA.",
    url: "/entreprise",
  },
};

const OFFER_BLOCKS = [
  {
    title: "Analyse de données",
    text: "Tableaux de bord, lecture métier, analyses descriptives et recommandations d'aide à la décision.",
  },
  {
    title: "Modèles explicatifs & prédictifs",
    text: "Comprendre les facteurs d'une situation, projeter des scénarios et identifier les bons leviers.",
  },
  {
    title: "Chatbots & assistants intelligents",
    text: "FAQ, assistants documentaires, copilotes internes et interfaces de clarification métier.",
  },
  {
    title: "Automatisation & workflows",
    text: "Traitements répétitifs, reporting, collecte, transformation et diffusion plus fluides.",
  },
];

const DELIVERY_SYSTEM = [
  "L'entreprise entre par un besoin métier clair, pas par une logique RH vague.",
  "KORYXA qualifie le besoin et produit un résumé structuré défendable.",
  "Le système recommande un mode de traitement et ouvre un cockpit d'exécution.",
  "Le besoin peut ensuite être relié à des talents certifiés, des formateurs superviseurs ou des missions.",
];

const STEPS = [
  {
    step: "01",
    title: "Qualifier le besoin",
    text: "Objectif, contexte, urgence, données disponibles, livrable attendu et préférences de support.",
  },
  {
    step: "02",
    title: "Structurer le cas d'usage",
    text: "KORYXA reformule le besoin, clarifie la mission, recommande le bon mode de traitement et les prochaines actions.",
  },
  {
    step: "03",
    title: "Ouvrir le cockpit entreprise",
    text: "L'exécution se pilote dans un cockpit qui suit les tâches, les étapes, les livrables et les affectations.",
  },
  {
    step: "04",
    title: "Activer la capacité",
    text: "Selon le cas, KORYXA peut mobiliser des partenaires formateurs ou des talents validés pour soutenir l'exécution.",
  },
];

export default function EntreprisePage() {
  return (
    <main className="grid gap-8">
      <section className="relative overflow-hidden rounded-[38px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(238,246,255,0.98))] px-6 py-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:px-8 lg:px-10">
        <div className="absolute inset-y-0 right-0 w-[35%] bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_62%)]" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Entreprise
              </span>
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                besoins IA • cadrage • exécution
              </span>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                Vous avez un besoin IA ou data dans votre activité ?
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                KORYXA structure les besoins IA/data des organisations, les transforme en cas d'usage exécutables,
                ouvre un cockpit d'exécution et peut activer la bonne capacité humaine et produit au bon moment.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/entreprise/demarrer" className="btn-primary w-full justify-center sm:w-auto">
                Décrire mon besoin
              </Link>
              <Link href="/products" className="btn-secondary w-full justify-center sm:w-auto">
                Voir les produits
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Règle entreprise</p>
            <div className="mt-5 grid gap-3">
              {DELIVERY_SYSTEM.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {OFFER_BLOCKS.map((block) => (
          <article key={block.title} className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Cas d'usage</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{block.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{block.text}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[34px] border border-slate-200/80 bg-white/92 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Mode opératoire</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">De l'objectif métier à l'exécution pilotée</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            Le produit doit montrer un vrai passage du besoin au cockpit, avec une logique claire de traitement, de capacité et de restitution.
          </p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {STEPS.map((item) => (
            <article key={item.step} className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-700">
                {item.step}
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

const ACTION_AREAS = [
  {
    title: "Trajectoire",
    description:
      "Diagnostic, orientation, matching formateur, preuves, validation et activation d'opportunités.",
    primaryHref: "/trajectoire/demarrer",
    primaryLabel: "Commencer un diagnostic",
    secondaryHref: "/myplanning/app/koryxa",
    secondaryLabel: "Ouvrir le cockpit",
  },
  {
    title: "Entreprise",
    description:
      "Cadrage du besoin, mission structurée, étapes d'exécution, livrables et activation de capacité.",
    primaryHref: "/entreprise/demarrer",
    primaryLabel: "Décrire un besoin",
    secondaryHref: "/myplanning/app/koryxa-enterprise",
    secondaryLabel: "Ouvrir l'espace entreprise",
  },
  {
    title: "Réseau IA",
    description:
      "Groupes, discussions, signal métier, formateurs partenaires et circulation d'opportunités autour de l'IA.",
    primaryHref: "/community",
    primaryLabel: "Explorer le réseau",
    secondaryHref: "/opportunities",
    secondaryLabel: "Voir les opportunités",
  },
];

const COMMAND_CARDS = [
  "Revenir dans le bon contexte KORYXA sans passer par un dashboard générique.",
  "Identifier la prochaine action prioritaire sur trajectoire, entreprise ou communauté.",
  "Faire circuler progression, validation, capacité et opportunités dans un seul univers produit.",
];

export default function KoryxaConnectedHomePage() {
  return (
    <main className="grid gap-5">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(135deg,rgba(14,116,144,0.12),rgba(255,255,255,0.98))] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="max-w-3xl">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
              Accueil connecté KORYXA
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Le bon centre de commandement pour vos capacités IA.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Ici, KORYXA choisit le bon contexte métier: trajectoire, entreprise, réseau IA, opportunités et
              validations. Le moteur d'exécution reste en arrière-plan, mais l'univers visible reste KORYXA.
            </p>
          </div>

          <div className="grid gap-3">
            {COMMAND_CARDS.map((item) => (
              <div key={item} className="rounded-[24px] border border-slate-200/80 bg-white/92 px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {ACTION_AREAS.map((area) => (
          <article key={area.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{area.title}</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{area.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={area.primaryHref} className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700">
                {area.primaryLabel}
              </Link>
              <Link href={area.secondaryHref} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
                {area.secondaryLabel}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Navigation connectée</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { href: "/myplanning/app/koryxa", label: "Cockpit Trajectoire" },
              { href: "/myplanning/app/koryxa-enterprise", label: "Cockpit Entreprise" },
              { href: "/chatlaya", label: "ChatLAYA" },
              { href: "/community", label: "Réseau IA" },
              { href: "/opportunities", label: "Opportunités" },
              { href: "/myplanning/profile", label: "Profil vérifié" },
            ].map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-white hover:text-sky-700"
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Règle d'usage</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <p>
              <span className="font-semibold text-white">KORYXA</span> reste la couche visible pour l'orientation, la
              progression, la validation, les besoins entreprise, les opportunités et les partenaires.
            </p>
            <p>
              L'exécution peut s'appuyer sur un moteur derrière la plateforme, mais l'expérience ne doit jamais
              ressembler à un simple basculement vers un autre produit sans contexte.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}

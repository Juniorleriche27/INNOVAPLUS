import Link from "next/link";

const ACTION_AREAS = [
  {
    title: "Trajectoire",
    description:
      "Démarrez ou reprenez une progression KORYXA : diagnostic, trajectoire recommandée, cockpit et validations.",
    primaryHref: "/trajectoire/demarrer",
    primaryLabel: "Commencer un diagnostic",
    secondaryHref: "/myplanning/app/koryxa",
    secondaryLabel: "Ouvrir Trajectoire",
  },
  {
    title: "Entreprise",
    description:
      "Exprimez un objectif ou un problème business, structurez le besoin et ouvrez le cockpit d’exécution entreprise.",
    primaryHref: "/entreprise/demarrer",
    primaryLabel: "Exprimer un besoin",
    secondaryHref: "/myplanning/app/koryxa-enterprise",
    secondaryLabel: "Ouvrir Entreprise",
  },
  {
    title: "ChatLAYA",
    description:
      "Clarifiez une prochaine étape, un besoin entreprise ou une trajectoire avant de passer à l’action dans le bon cockpit.",
    primaryHref: "/chatlaya",
    primaryLabel: "Ouvrir ChatLAYA",
    secondaryHref: "/myplanning/opportunities",
    secondaryLabel: "Voir mes opportunités",
  },
];

export default function KoryxaConnectedHomePage() {
  return (
    <main className="grid gap-4">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,rgba(14,116,144,0.10),rgba(255,255,255,0.98))] p-6 shadow-sm">
        <div className="max-w-3xl">
          <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
            Accueil connecté KORYXA
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Choisissez la bonne zone de travail KORYXA.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Ici, vous entrez d’abord dans l’univers de travail KORYXA. Choisissez directement entre votre trajectoire,
            votre espace entreprise et ChatLAYA, sans être jeté dans un dashboard générique qui n’a pas le bon contexte.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
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

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Navigation connectée</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { href: "/myplanning/app/koryxa", label: "Trajectoire" },
              { href: "/myplanning/app/koryxa-enterprise", label: "Entreprise" },
              { href: "/chatlaya", label: "ChatLAYA" },
              { href: "/myplanning/opportunities", label: "Opportunités" },
              { href: "/myplanning/profile", label: "Profil" },
              { href: "/myplanning/settings", label: "Paramètres" },
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

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Règle d’usage</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              <span className="font-semibold text-slate-950">KORYXA</span> choisit le bon contexte métier :
              trajectoire, entreprise, opportunités et validations.
            </p>
            <p>
              Le moteur d’exécution existe en arrière-plan pour les tâches, la planification et le suivi, mais
              l’entrée visible reste KORYXA.
            </p>
            <p>
              Vous n’êtes donc plus renvoyé par défaut vers un dashboard MyPlanning brut lorsque vous entrez dans la
              plateforme depuis le site public KORYXA.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}

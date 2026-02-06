import Link from "next/link";

export const revalidate = 3600;

const TIERS = [
  {
    name: "Free",
    price: "0",
    desc: "Pour demarrer et structurer ton quotidien.",
    items: ["Tâches + Kanban", "Vue jour/semaine", "Priorités (Eisenhower)", "Export basique"],
  },
  {
    name: "Pro",
    price: "Bêta",
    desc: "Pour ceux qui veulent mesurer, decider et progresser.",
    items: ["Coaching IA", "Templates universels", "Stats & graphiques", "Automatisations (bientôt)"],
  },
  {
    name: "Team",
    price: "À venir",
    desc: "Pour equipes & organisations (a venir).",
    items: ["Collaborateurs", "Assignation", "Reporting", "Admin (à venir)"],
  },
];

export default function MyPlanningPricingPage({
  searchParams,
}: {
  searchParams?: { message?: string; upgrade?: string; feature?: string };
}) {
  const upgradeMessage =
    searchParams?.message ||
    (searchParams?.upgrade === "pro" ? "Fonctionnalite Pro - debloque le pilotage avance." : "");

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Tarifs</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">Tu peux commencer gratuitement. Les plans payants arrivent apres la phase MVP.</p>
          <p className="mt-2 max-w-2xl text-xs font-medium text-slate-500">
            Early users: un prix preferentiel sera propose au lancement officiel.
          </p>
        </div>
        <Link
          href="/myplanning/app"
          className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 hover:bg-sky-700"
        >
          Commencer gratuitement
        </Link>
      </div>

      {upgradeMessage ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">{upgradeMessage}</p>
          {searchParams?.feature ? <p className="mt-1 text-amber-800">Fonction demandee: {searchParams.feature}</p> : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div key={tier.name} className="rounded-3xl border border-slate-200 bg-white p-9 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              {tier.name}
              {tier.name === "Pro" ? (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">BÊTA</span>
              ) : null}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{tier.price}</p>
            <p className="mt-2 text-sm text-slate-600">{tier.desc}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {tier.items.map((it) => (
                <li key={it} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

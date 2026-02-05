import Link from "next/link";

export const revalidate = 3600;

const TIERS = [
  {
    name: "Free",
    price: "0",
    desc: "Pour démarrer et tester le cockpit.",
    items: ["Tâches + Kanban", "Vue jour/semaine", "Priorités (Eisenhower)", "Export basique"],
  },
  {
    name: "Pro",
    price: "À venir",
    desc: "Coaching IA + statistiques (bêta).",
    items: ["Coaching IA", "Templates universels", "Stats & graphiques", "Automatisations"],
  },
  {
    name: "Team",
    price: "À venir",
    desc: "Pour équipes et collaboration.",
    items: ["Collaborateurs", "Assignation", "Reporting", "Admin"],
  },
];

export default function MyPlanningPricingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Tarifs</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-700">Tu peux commencer gratuitement. Les plans payants arriveront après la phase MVP.</p>
        </div>
        <Link href="/myplanning/app" className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
          Ouvrir l’app
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div key={tier.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{tier.name}</p>
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


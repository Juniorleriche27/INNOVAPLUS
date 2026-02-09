import Link from "next/link";

export default function TeamComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Team</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">{description}</p>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Fonctionnalité Team — Disponible prochainement.
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/myplanning/team" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Retour Team
          </Link>
          <a
            href="mailto:hello@innova.plus?subject=MyPlanningAI%20Team%20-%20Liste%20d%27attente"
            className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Rejoindre la liste d’attente
          </a>
        </div>
      </section>
    </div>
  );
}

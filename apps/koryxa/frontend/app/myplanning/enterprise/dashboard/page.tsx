import Link from "next/link";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default function MyPlanningEnterpriseDashboardPage() {
  return (
    <div className="w-full space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Enterprise Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Organisation activée</h1>
        <p className="mt-2 text-sm text-slate-700">
          Votre socle Entreprise est prêt. Continuez avec la présence, les alertes et les intégrations.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/myplanning/team"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Ouvrir Espaces
          </Link>
          <Link
            href="/myplanning/app/integrations"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Configurer les intégrations
          </Link>
        </div>
      </section>
    </div>
  );
}


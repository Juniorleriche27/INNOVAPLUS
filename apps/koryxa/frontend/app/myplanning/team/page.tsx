import Link from "next/link";

export const revalidate = 3600;

export default function MyPlanningTeamPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Team</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Pour les équipes (bientôt).</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          L’architecture est prête, mais les actions sont bloquées : pas d’activation backend, pas d’assignation réelle pour le moment.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">Fonctionnalité en préparation. Disponible bientôt pour les équipes.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/myplanning/pricing" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Voir les tarifs
          </Link>
          <Link href="/myplanning/app" className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Ouvrir l’app
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Collaborateurs", desc: "Inviter et gérer les membres." },
          { title: "Assignation", desc: "Assigner des tâches et suivre l’avancement." },
          { title: "Reporting", desc: "Vue globale et rapports d’exécution." },
          { title: "Admin", desc: "Rôles, permissions, paramètres d’équipe." },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            <p className="mt-4 text-xs font-semibold text-slate-500">Fonctionnalité en préparation</p>
          </div>
        ))}
      </section>
    </div>
  );
}

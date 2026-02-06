import Link from "next/link";

export default function MyPlanningTeamPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Team</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Pour les equipes (bientot).</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          L’architecture est prete, mais les actions sont bloquees : pas d’activation backend, pas d’assignation reelle pour le moment.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">Fonctionnalite en preparation. Disponible bientot pour les equipes.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/myplanning/pricing" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Voir les tarifs
          </Link>
          <span className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Fonctionnalite Team (a venir)</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Collaborateurs", desc: "Inviter et gerer les membres." },
          { title: "Assignation", desc: "Assigner des taches et suivre l’avancement." },
          { title: "Reporting", desc: "Vue globale et rapports d’execution." },
          { title: "Admin", desc: "Roles, permissions, parametres d’equipe." },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm">
            <p className="text-sm font-semibold text-slate-900">🔒 {item.title}</p>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            <p className="mt-4 text-xs font-semibold text-slate-500">Fonctionnalite Team — Disponible prochainement</p>
          </div>
        ))}
      </section>
    </div>
  );
}

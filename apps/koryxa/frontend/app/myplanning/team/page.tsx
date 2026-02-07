import Link from "next/link";

export default function MyPlanningTeamPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanning Team</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Pour les équipes (à venir).</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          L’architecture Team est prête, mais les actions restent bloquées pour cette phase MVP.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-700">Fonctionnalité Team — Disponible prochainement.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/myplanning/pricing" className="inline-flex rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Voir les tarifs
          </Link>
          <a
            href="mailto:hello@innova.plus?subject=MyPlanning%20Team%20-%20Liste%20d%27attente"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Rejoindre la liste d’attente
          </a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { href: "/myplanning/team/collaborateurs", title: "Collaborateurs", desc: "Inviter et gérer les membres." },
          { href: "/myplanning/team/assignation", title: "Assignation", desc: "Assigner des tâches et suivre l’avancement." },
          { href: "/myplanning/team/reporting", title: "Reporting", desc: "Vue globale et rapports d’exécution." },
          { href: "/myplanning/team/admin", title: "Admin", desc: "Rôles, permissions et paramètres d’équipe." },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-sky-200 hover:bg-sky-50/30">
            <p className="text-sm font-semibold text-slate-900">🔒 {item.title}</p>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            <p className="mt-4 text-xs font-semibold text-slate-500">Fonctionnalité Team — Disponible prochainement</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

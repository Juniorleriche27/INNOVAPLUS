export default function SpecialisationsPage() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Specialisations</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Parcours de specialisation</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Data Analyst",
            modules: [
              "Module 1 — Cadrage & KPIs",
              "Module 2 — Collecte",
              "Module 3 — Nettoyage",
              "Module 4 — Preparation",
              "Module 5 — EDA",
              "Module 6 — Reporting & Dashboards",
              "Module 7 — Recommandations + capstone",
            ],
          },
          {
            title: "Data Engineer",
            modules: ["Module 1 — Fondations data engineering", "Module 2 — Orchestration & qualité"],
          },
          {
            title: "Data Scientist",
            modules: ["Module 1 — Fondations data science"],
          },
          {
            title: "ML Engineer",
            modules: ["Module 1 — ML Engineering"],
          },
        ].map((track) => (
          <div key={track.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-sm font-semibold text-slate-900">{track.title}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {track.modules.map((mod) => (
                <li key={mod}>{mod}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PlatformTrajectoirePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[linear-gradient(135deg,#0284c7,#0369a1)] p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cockpit Trajectoire</h1>
            <p className="mt-2 text-lg text-sky-100">Data Analyst</p>
          </div>
          <span className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold">En progression</span>
        </div>
        <p className="mt-4 text-sky-100">Vous progressez avec rigueur vers la validation complète de votre trajectoire Data Analyst.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        {[
          ["72%", "Progression"],
          ["85%", "Préparation"],
          ["8/12", "Preuves validées"],
          ["92%", "Score opportunités"],
        ].map(([value, label]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-4xl font-bold text-sky-600">{value}</div>
            <p className="mt-2 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold">Progression par compétence</h2>
            <div className="space-y-4">
              {[
                ["Python & Pandas", 90],
                ["SQL", 85],
                ["Visualisation (Power BI / Tableau)", 75],
                ["Statistiques", 60],
                ["Machine Learning de base", 40],
              ].map(([label, percent]) => (
                <div key={label}>
                  <div className="mb-2 flex justify-between text-sm"><span>{label}</span><span>{percent}%</span></div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div className="h-2.5 rounded-full bg-sky-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Référent trajectoire</h3>
            <p className="mt-4 font-semibold">Attribution dynamique</p>
            <p className="text-sm text-slate-500">Selon votre cohorte et votre niveau d'avancement</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Apprenants</span><span>12 actifs</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Taux validation</span><span className="text-emerald-600">94%</span></div>
            </div>
          </article>

          <article className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
            <h3 className="font-semibold text-sky-900">Prochaines étapes</h3>
            <div className="mt-4 space-y-3 text-sm text-sky-900">
              <p>Compléter la preuve de visualisation Matplotlib</p>
              <p>Renforcer les compétences en statistiques</p>
              <p>Soumettre 4 preuves restantes pour la validation finale</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

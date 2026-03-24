export default function PlatformEntreprisePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-[linear-gradient(135deg,#059669,#065f46)] p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cockpit Entreprise</h1>
            <p className="mt-2 text-lg text-emerald-100">Dashboard analytique - Ventes & Performance</p>
          </div>
          <span className="rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold">En exécution</span>
        </div>
        <p className="mt-4 text-emerald-100">Votre besoin IA est structuré, qualifié et en cours d'exécution avec notre équipe.</p>
      </section>

      <section className="grid gap-6 md:grid-cols-4">
        {[
          ["95%", "Qualification"],
          ["60%", "Avancement"],
          ["3/5", "Étapes complétées"],
          ["12j", "Livraison estimée"],
        ].map(([value, label]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="text-4xl font-bold text-emerald-600">{value}</div>
            <p className="mt-2 text-sm text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold">Brief structuré</h2>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <h3 className="font-semibold">Objectif</h3>
                <p className="mt-2 text-sm text-slate-500">Créer un dashboard interactif pour analyser les ventes mensuelles, identifier les tendances et générer des recommandations métier.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <h3 className="font-semibold">Contexte</h3>
                <p className="mt-2 text-sm text-slate-500">E-commerce B2B, 5000 transactions/mois, données dans PostgreSQL et fichiers CSV. Besoin de visualisations claires pour la direction.</p>
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Capacités activées</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold">Référent supervision</p>
                <p className="text-xs text-slate-500">Affectation selon le besoin qualifié</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold">Talent certifié</p>
                <p className="text-xs text-slate-500">Sélectionné selon disponibilité et compétences</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="font-semibold text-emerald-900">Prochaines actions</h3>
            <div className="mt-4 space-y-3 text-sm text-emerald-900">
              <p>Revue de mi-parcours prévue le 25 mars</p>
              <p>Prototype dashboard disponible le 28 mars</p>
              <p>Formation équipe interne le 2 avril</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

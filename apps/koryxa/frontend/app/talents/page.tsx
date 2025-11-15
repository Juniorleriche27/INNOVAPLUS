export default function TalentsPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Talents</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Profils & disponibilités</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            La base de profils (prestataires, PME, communautés) sera bientôt connectée au moteur IA. Vous pourrez
            filtrer par pays, expertise et disponibilité pour répondre rapidement aux missions.
          </p>
        </section>

        <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          L’intégration backend arrive prochainement. Proposez votre profil ou celui de votre collectif via{" "}
          <a href="mailto:talents@koryxa.africa" className="font-semibold text-sky-600">
            talents@koryxa.africa
          </a>{" "}
          pour être contacté en priorité.
        </section>
      </div>
    </main>
  );
}

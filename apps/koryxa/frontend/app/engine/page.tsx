export default function EnginePage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Moteur IA</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Règles RAG & équité</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Visualisez prochainement les paramètres de matching, les quotas d&apos;équité actifs et le suivi des
            modèles utilisés par Chatlaya. Cette page présentera la configuration des filtres, la pondération des
            besoins et le journal des décisions.
          </p>
        </section>

        <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Les métriques détaillées et la configuration arriveront bientôt. Pour une démonstration ou une demande
          spécifique, écrivez à <a href="mailto:hello@koryxa.africa" className="font-semibold text-sky-600">hello@koryxa.africa</a>.
        </section>
      </div>
    </main>
  );
}

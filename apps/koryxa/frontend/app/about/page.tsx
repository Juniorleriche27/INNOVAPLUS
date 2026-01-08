import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="px-4 py-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">À propos</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">À propos de KORYXA</h1>
          <p className="mt-2 text-base text-slate-600">
            KORYXA relie formation et besoins réels des organisations pour créer des opportunités concrètes.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Notre mission</h2>
          <p className="mt-3 text-sm text-slate-600">
            Réduire le décalage entre compétences et emploi, en formant sur des besoins réels et en produisant des
            livrables utiles aux entreprises.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Pourquoi KORYXA</h2>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>Beaucoup de formations restent théoriques.</li>
            <li>Beaucoup d’entreprises ont des données mais peu de structure et peu de temps.</li>
            <li>KORYXA met les deux ensemble : apprendre en produisant.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Ce que KORYXA n’est pas</h2>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>Ce n’est pas un site de jobs classique.</li>
            <li>Ce n’est pas une promesse d’embauche automatique.</li>
            <li>C’est un système de formation + missions + validation de livrables.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Nos principes</h2>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>Simplicité</li>
            <li>Transparence</li>
            <li>Équité</li>
            <li>Impact réel</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Aller plus loin</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/school" className="btn-primary">
              Découvrir KORYXA School
            </Link>
            <Link href="/entreprise" className="btn-secondary">
              Devenir entreprise partenaire
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

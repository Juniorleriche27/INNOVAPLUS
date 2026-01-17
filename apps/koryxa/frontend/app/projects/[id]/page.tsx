import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Opportunité</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Détail en cours de construction</h1>
        <p className="mt-2 text-sm text-slate-600">
          Identifiant : <span className="font-mono text-slate-900">{params.id}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/opportunities" className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            Retour au pipeline
          </Link>
          <Link href="/projects" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Voir les projets
          </Link>
        </div>
      </section>
    </main>
  );
}

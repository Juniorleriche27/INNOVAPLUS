import Link from "next/link";

export default function BientotDisponiblePage() {
  return (
    <main className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">KORYXA</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Bientot disponible</h1>
        <p className="mt-2 text-sm text-slate-600">
          Cette section sera active dans une prochaine version.
        </p>
        <Link href="/school" className="btn-secondary mt-6 inline-flex">Retour a KORYXA School</Link>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";

export default function MyFinancePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Produit</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">MyFinance</h1>
        <p className="mt-2 text-sm text-slate-600">
          Module finance & reporting. En cours de reactivation.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Retour accueil
          </Link>
          <Link
            href="/about"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            En savoir plus
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Bientot disponible. Dis-moi quelles pages MyFinance tu veux rebrancher en premier.
      </section>
    </div>
  );
}


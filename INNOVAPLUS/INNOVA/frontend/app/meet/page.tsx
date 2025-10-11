// app/meet/page.tsx
import Link from "next/link";
import { track } from "@/lib/telemetry";
import { Suspense } from "react";

function ClientPing() {
  // small client ping to record view
  // eslint-disable-next-line react-hooks/rules-of-hooks
  require("react").useEffect(() => { track("view_meet"); }, []);
  return null;
}

export default function MeetPage() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6">
      <Suspense>
        {/* @ts-expect-error Server/Client mix for ping */}
        <ClientPing />
      </Suspense>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">INNOVA-MEET</h1>
          <p className="text-sm text-slate-500">Réseau social intégré — besoins, solutions, succès.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/meet/new" className="btn-primary" onClick={() => track("post_create", { intent: true })}>Créer un post</Link>
        </div>
      </header>

      {/* Filtres */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input placeholder="Pays" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
          <input placeholder="Compétences" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
          <input placeholder="Tags" className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm" />
        </div>
      </section>

      {/* Métriques */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Posts/semaine", value: "128" },
          { label: "Créateurs actifs", value: "64" },
          { label: "Taux d’engagement", value: "12%" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="mt-1 text-xl font-semibold text-sky-600">{k.value}</p>
          </div>
        ))}
      </section>

      {/* Onglets */}
      <nav className="mb-4 flex flex-wrap gap-2">
        {[
          { href: "/meet", label: "Feed" },
          { href: "/meet/profiles", label: "Profils" },
          { href: "/meet/groups", label: "Groupes" },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-200 hover:text-sky-700">
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Cartes placeholder */}
      <section className="space-y-3">
        {[1, 2, 3].map((i) => (
          <article key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Auteur {i}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">CI • #agritech #pricing</span>
            </header>
            <p className="text-sm text-slate-700">Besoin terrain: optimisation des prix pour coopératives — vos retours?</p>
          </article>
        ))}
      </section>
    </main>
  );
}


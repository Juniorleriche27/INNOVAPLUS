import { Suspense } from "react";
import type { SkillItem } from "@/lib/api";
import { INNOVA_API_BASE } from "@/lib/env";

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
      <span className="h-2 w-2 rounded-full bg-sky-400" />
      {label}: {value}
    </span>
  );
}

function SkillsList({ items }: { items: SkillItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-sm text-slate-600">
        Aucune compétence enregistrée pour le moment.
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((s) => (
        <div key={s.slug} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{s.label}</p>
              <p className="text-xs text-slate-500">{s.slug}</p>
            </div>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">Total {s.total}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <StatChip label="Certificats" value={s.certificates} />
            <StatChip label="Utilisateurs" value={s.users} />
            <StatChip label="Offres marketplace" value={s.offers} />
          </div>
        </div>
      ))}
    </div>
  );
}

async function SkillsData() {
  // Récupération côté serveur (pas de cache pour garder la vue à jour)
  const res = await fetch(`${INNOVA_API_BASE}/skills`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Impossible de récupérer les compétences");
  }
  const data = (await res.json()) as { items: SkillItem[] };
  return <SkillsList items={data.items} />;
}

export default function SkillsPage() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Compétences & secteurs</h1>
        <p className="text-slate-600">Cartographie dynamique des compétences, certificats et offres.</p>
      </div>
      <Suspense fallback={<div className="text-sm text-slate-500">Chargement des compétences…</div>}>
        <SkillsData />
      </Suspense>
    </main>
  );
}

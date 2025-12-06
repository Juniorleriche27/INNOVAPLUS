import type { PublicProfile } from "@/lib/api";
import { INNOVA_API_BASE } from "@/lib/env";

async function TalentsData() {
  const res = await fetch(`${INNOVA_API_BASE}/profiles/public`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Impossible de récupérer les profils");
  }
  const data = (await res.json()) as { items: PublicProfile[]; total: number };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.items.map((p) => (
        <div key={p.user_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Profil</p>
              <p className="text-xs text-slate-500">{p.country || "Pays ND"} · {p.remote ? "Remote" : "Sur place"}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Disponibilité{" "}
              {p.last_active_at ? new Date(p.last_active_at).toLocaleDateString() : "récente"}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(p.skills || []).slice(0, 8).map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {s}
              </span>
            ))}
          </div>
          {p.languages && p.languages.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">Langues : {p.languages.join(", ")}</p>
          )}
        </div>
      ))}
      {data.items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
          Aucun profil pour le moment. Proposez votre collectif via{" "}
          <a href="mailto:talents@koryxa.africa" className="font-semibold text-sky-600">
            talents@koryxa.africa
          </a>
          .
        </div>
      )}
    </div>
  );
}

export default function TalentsPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Talents</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Profils & disponibilités</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Base de profils connectée au moteur IA. Filtrez par pays, expertise et disponibilité pour répondre aux missions.
          </p>
        </section>

        <TalentsData />
      </div>
    </main>
  );
}

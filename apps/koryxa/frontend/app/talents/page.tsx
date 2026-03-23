import type { PublicProfile } from "@/lib/api";
import type { Metadata } from "next";
import { INNOVA_API_BASE } from "@/lib/env";

export const metadata: Metadata = {
  title: "Talents | KORYXA",
  description:
    "Explorez les profils talents, disponibilités, compétences et signaux de validation dans l'écosystème KORYXA.",
};

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
    <main className="grid gap-8">
      <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(242,248,255,0.98))] px-6 py-8 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Talents vérifiables</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Profils, disponibilité et signaux de qualité dans l'écosystème KORYXA.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Les talents KORYXA ne sont pas de simples profils déclaratifs. La logique produit vise à relier
              trajectoire, preuves, validation, disponibilité et activation sur opportunités ou missions.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Ce que l'entreprise voit</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">Disponibilité, compétences, langue, pays, signaux de sérieux.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Ce que KORYXA pilote</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Validation, trajectoire, progression, orientation et adéquation aux besoins entreprise.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TalentsData />
    </main>
  );
}

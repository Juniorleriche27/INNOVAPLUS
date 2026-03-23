import Link from "next/link";
import {
  formatOpportunitySource,
  formatOpportunityStatus,
  listOpportunities,
  opportunityReadiness,
} from "../opportunities/data";

export const metadata = {
  title: "Pipeline mission & activation | KORYXA",
  description:
    "Suivez les opportunités KORYXA, leur niveau de clarté, leur source et leur potentiel d'activation côté mission, talent ou supervision.",
};

export default async function ProjectsLanding() {
  const items = await listOpportunities({ limit: 12 });
  const openCount = items.filter((item) => item.status === "open").length;
  const productCount = items.filter((item) => item.product_slug).length;
  const missionCount = items.filter((item) => item.mission_id).length;

  return (
    <main className="grid gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Pipeline d'activation</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              L’espace où besoin, mission, capacité et opportunité deviennent enfin lisibles.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Cette surface KORYXA relie source produit, besoin métier, opportunité ouverte, mission liée et
              niveau d’activation. Elle ne sert pas uniquement à lister des cartes: elle doit préparer une
              décision plus propre côté entreprise, talents et partenaires.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "Chaque opportunité doit expliquer clairement d'où elle vient et comment elle sera traitée.",
              "Les profils certifiés et les formateurs partenaires doivent pouvoir se brancher sur une activation réelle.",
              "Une mission déjà créée doit rester visible pour éviter les doublons entre pilotage et communication.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-slate-200/80 bg-white/88 px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/missions/new" className="btn-primary">
            Poster un besoin
          </Link>
          <Link href="/projects/new" className="btn-secondary">
            Déposer une capacité
          </Link>
          <Link href="/community" className="btn-secondary">
            Voir le réseau IA
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
        {[
          { label: "Opportunités ouvertes", value: openCount, detail: "Dossiers activables immédiatement." },
          { label: "Reliées à un produit", value: productCount, detail: "Issues de l'écosystème KORYXA." },
          { label: "Avec mission liée", value: missionCount, detail: "Déjà structurées côté exécution." },
        ].map((item) => (
          <article key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{item.value}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Opportunités récentes</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Le pipeline doit raconter un mode d’activation, pas juste un inventaire.
              </h2>
            </div>
            <Link href="/opportunities" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
              Ouvrir le hub complet
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {items.slice(0, 6).map((item) => {
              const readiness = opportunityReadiness(item);
              return (
                <Link
                  key={item.id}
                  href={`/opportunities/${item.id}`}
                  className="rounded-[26px] border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {formatOpportunitySource(item.source)}
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700">
                      {readiness.label}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.problem || "Aucun résumé disponible pour le moment."}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{formatOpportunityStatus(item.status)}</span>
                    {item.country ? <span>• {item.country}</span> : null}
                    {item.product_slug ? <span>• Produit {item.product_slug}</span> : null}
                    {item.mission_id ? <span>• Mission liée</span> : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Règle de pilotage</p>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
            <p>
              Une opportunité KORYXA peut venir d’un besoin entreprise, d’une mission, d’un produit ou d’une
              activation manuelle. Ce qui compte est sa capacité à produire une action réelle.
            </p>
            <p>
              Le pipeline doit ensuite pouvoir orienter vers un talent validé, un formateur partenaire, une
              supervision ou une mission structurée.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              "Vérifier le niveau de clarté du besoin",
              "Croiser avec les profils vérifiés disponibles",
              "Activer une mission ou une supervision si nécessaire",
              "Faire remonter les signaux utiles dans le réseau IA",
            ].map((item, index) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Étape {index + 1}</p>
                <p className="mt-2 text-sm text-white">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

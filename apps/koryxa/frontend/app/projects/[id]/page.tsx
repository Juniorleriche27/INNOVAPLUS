import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatOpportunitySource,
  formatOpportunityStatus,
  getOpportunityById,
  opportunityReadiness,
  relatedActivationSteps,
} from "../../opportunities/data";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function ProjectDetailPage({ params }: Props) {
  const resolved = await Promise.resolve(params);
  const opportunity = await getOpportunityById(resolved.id);

  if (!opportunity) {
    notFound();
  }

  const readiness = opportunityReadiness(opportunity);
  const activationSteps = relatedActivationSteps(opportunity);

  return (
    <main className="grid gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(237,247,255,0.98))] p-6 shadow-[0_24px_72px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.16fr_0.84fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-700">
                Opportunité KORYXA
              </span>
              <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                {formatOpportunitySource(opportunity.source)}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              {opportunity.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {opportunity.problem || "Cette opportunité existe déjà dans le pipeline, mais sa synthèse détaillée reste à compléter."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {opportunity.mission_id ? (
                <Link href={`/missions/track/${opportunity.mission_id}`} className="btn-primary">
                  Ouvrir la mission liée
                </Link>
              ) : (
                <Link href="/missions/new" className="btn-primary">
                  Générer une mission liée
                </Link>
              )}
              <Link href="/myplanning/profile" className="btn-secondary">
                Voir le profil vérifié
              </Link>
              <Link href="/community" className="btn-secondary">
                Passer par le réseau IA
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {[
              { label: "Statut", value: formatOpportunityStatus(opportunity.status), detail: "État actuel du dossier" },
              { label: "Readiness", value: `${readiness.score}/100 • ${readiness.label}`, detail: "Capacité estimée d’activation" },
              { label: "Pays", value: opportunity.country || "Multi-zone / non précisé", detail: "Zone principale de lecture" },
              { label: "Produit", value: opportunity.product_slug || "Aucun produit explicite", detail: "Point d’entrée ou produit lié" },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Compétences attendues</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(opportunity.skills_required || []).length > 0 ? (
              opportunity.skills_required?.map((skill) => (
                <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  {skill}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500">
                Compétences à préciser
              </span>
            )}
          </div>

          <div className="mt-6 grid gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Étapes d’activation</p>
            {activationSteps.map((step, index) => (
              <div key={step} className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Étape {index + 1}</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_62px_rgba(15,23,42,0.18)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Boucle KORYXA</p>
          <div className="mt-5 grid gap-3">
            {[
              "Le besoin doit rester lisible pour l’entreprise et pour l’équipe d’orchestration.",
              "La trajectoire et le profil validé doivent permettre une activation crédible, pas seulement théorique.",
              "Le réseau IA et les formateurs partenaires servent à accélérer supervision, montée en compétence et delivery.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/talents" className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-50">
              Explorer les talents
            </Link>
            <Link href="/formateurs" className="inline-flex rounded-full border border-white/14 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15">
              Voir les formateurs
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

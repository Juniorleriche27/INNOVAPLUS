import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, MapPin, Sparkles } from "lucide-react";
import { PublishedHero } from "@/components/marketing/PublishedSiteSections";
import { formatOpportunityStatus, listOpportunities, opportunityReadiness } from "./data";

export const metadata: Metadata = {
  title: "Opportunités | KORYXA",
  description: "Missions, stages et postes adaptés à votre trajectoire et votre progression.",
};

export default async function OpportunitiesPage() {
  const opportunities = await listOpportunities({ limit: 9 });

  return (
    <main>
      <PublishedHero
        title="Opportunités IA"
        description="Missions, stages et postes adaptés à votre trajectoire et votre progression"
        actions={[{ href: "/trajectoire/demarrer", label: "Démarrer ma trajectoire" }]}
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((item) => {
            const readiness = opportunityReadiness(item);

            return (
              <article key={item.id} className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
                <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.problem || "Le cadrage détaillé de cette opportunité est encore en cours."}
                </p>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" />{item.source || "KORYXA"}</p>
                  <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{item.country || "Non précisé"}</p>
                  <p className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />{formatOpportunityStatus(item.status)}</p>
                  <p className="text-xs font-semibold text-emerald-600">{readiness.score}/100 • {readiness.label}</p>
                </div>
                <Link href={`/opportunites/${item.id}`} className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">
                  Voir l'offre
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

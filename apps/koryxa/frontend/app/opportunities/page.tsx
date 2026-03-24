import type { Metadata } from "next";
import { BriefcaseBusiness, MapPin, Sparkles } from "lucide-react";
import { PublishedHero } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Opportunités | KORYXA",
  description: "Missions, stages et postes adaptés à votre trajectoire et votre progression.",
};

const OPPORTUNITIES = [
  { title: "Data Analyst Junior", company: "Tech Startup", location: "Dakar", type: "CDI" },
  { title: "Stage Data Engineering", company: "Fintech", location: "Lagos", type: "Stage" },
  { title: "ML Engineer", company: "AI Company", location: "Abidjan", type: "CDI" },
];

export default function OpportunitiesPage() {
  return (
    <main>
      <PublishedHero
        title="Opportunités IA"
        description="Missions, stages et postes adaptés à votre trajectoire et votre progression"
        actions={[{ href: "/trajectoire/demarrer", label: "Démarrer ma trajectoire" }]}
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-6 md:grid-cols-2 lg:grid-cols-3">
          {OPPORTUNITIES.map((item) => (
            <article key={`${item.title}-${item.company}`} className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
              <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
              <div className="mt-4 space-y-2 text-sm text-slate-500">
                <p className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" />{item.company}</p>
                <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{item.location}</p>
                <p className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" />{item.type}</p>
              </div>
              <button type="button" className="mt-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">
                Voir l'offre
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

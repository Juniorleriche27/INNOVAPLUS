import type { Metadata } from "next";
import { BarChart3, BrainCircuit, Database, CheckCircle2 } from "lucide-react";
import { PublishedCard, PublishedGradientBand, PublishedHero, PublishedSectionHeading } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Trajectoire | KORYXA",
  description: "KORYXA vous accompagne avec diagnostic, formateurs partenaires, validation par preuves et accès aux opportunités.",
};

const TRACKS = [
  {
    icon: <BarChart3 className="h-7 w-7 text-slate-800" />,
    title: "Data Analyst",
    description: "Analyse, visualisation, insights et recommandations métier.",
    skills: ["Python", "SQL", "Power BI", "Excel avancé", "Statistiques"],
    gradient: "from-sky-500 to-sky-700",
  },
  {
    icon: <Database className="h-7 w-7 text-slate-800" />,
    title: "Data Engineer",
    description: "Structuration, pipelines, infrastructure et qualité des données.",
    skills: ["Python", "SQL", "ETL", "Cloud", "Data warehousing"],
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    icon: <BrainCircuit className="h-7 w-7 text-slate-800" />,
    title: "ML / IA appliquée",
    description: "Modèles prédictifs, explicatifs, automatisation et IA opérationnelle.",
    skills: ["Python", "Machine Learning", "Deep Learning", "MLOps", "NLP"],
    gradient: "from-amber-500 to-amber-700",
  },
];

const FLOW = [
  "Diagnostic de votre profil",
  "Recommandation de trajectoire",
  "Matching avec formateur partenaire",
  "Plan de progression personnalisé",
  "Soumission de preuves",
  "Validation et certification",
  "Profil vérifié",
  "Accès aux opportunités",
];

export default function TrajectoirePage() {
  return (
    <main>
      <PublishedHero
        title="Montez en compétence vers les métiers IA"
        description="KORYXA vous accompagne avec diagnostic, formateurs partenaires, validation par preuves et accès aux opportunités."
        actions={[{ href: "/trajectoire/demarrer", label: "Démarrer le diagnostic" }]}
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading
            title="Trois trajectoires dès le départ"
            description="Choisissez votre voie après un diagnostic personnalisé."
          />
          <div className="grid gap-8 md:grid-cols-3">
            {TRACKS.map((track) => (
              <article key={track.title} className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
                <div className={`h-32 bg-gradient-to-br ${track.gradient}`} />
                <div className="p-6">
                  <div className="-mt-14 mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-lg">
                    {track.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950">{track.title}</h3>
                  <p className="mt-3 text-sm text-slate-500">{track.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {track.skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[var(--marketing-max-w)]">
          <PublishedSectionHeading title="De la progression à la mission" />
          <div className="grid gap-6 md:grid-cols-4">
            {FLOW.map((item, index) => (
              <div key={item} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-xl font-bold text-white">
                  {index + 1}
                </div>
                <p className="text-sm font-medium text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublishedGradientBand
        title="Prêt à démarrer votre trajectoire IA ?"
        description="Un diagnostic de 5 minutes pour identifier la meilleure voie pour vous."
        actionHref="/trajectoire/demarrer"
        actionLabel="Lancer le diagnostic"
      />
    </main>
  );
}

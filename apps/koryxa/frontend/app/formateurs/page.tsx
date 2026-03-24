import type { Metadata } from "next";
import { BadgeCheck, MapPin } from "lucide-react";
import { PublishedHero } from "@/components/marketing/PublishedSiteSections";

export const metadata: Metadata = {
  title: "Formateurs | KORYXA",
  description: "Experts qui supervisent les trajectoires et valident les progressions avec rigueur.",
};

const TRAINERS = [
  {
    id: "1",
    name: "Amadou Diallo",
    trajectory: "Formateur Data Analyst",
    location: "Dakar, Sénégal",
    level: "8 ans d'expérience",
    skills: ["Python", "SQL", "Power BI", "Statistiques"],
    availability: "12 apprenants actifs",
    readinessScore: 98,
  },
  {
    id: "2",
    name: "Aïcha Traoré",
    trajectory: "Formatrice Data Engineer",
    location: "Abidjan, Côte d'Ivoire",
    level: "10 ans d'expérience",
    skills: ["Python", "AWS", "Airflow", "Spark"],
    availability: "8 apprenants actifs",
    readinessScore: 96,
  },
];

export default function FormateursPage() {
  return (
    <main>
      <PublishedHero
        title="Formateurs partenaires"
        description="Experts qui supervisent les trajectoires et valident les progressions avec rigueur"
      />

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[var(--marketing-max-w)] gap-6 md:grid-cols-2">
          {TRAINERS.map((trainer) => (
            <article key={trainer.id} className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-lg font-semibold text-sky-700">
                  {trainer.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                    {trainer.name}
                    <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  </h3>
                  <p className="mt-1 text-sm font-medium text-sky-600">{trainer.trajectory}</p>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                    <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{trainer.location}</p>
                    <p>{trainer.level}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {trainer.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{skill}</span>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4 text-sm">
                <p className="text-slate-500">{trainer.availability}</p>
                <p className="font-semibold text-sky-600">{trainer.readinessScore}/100</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

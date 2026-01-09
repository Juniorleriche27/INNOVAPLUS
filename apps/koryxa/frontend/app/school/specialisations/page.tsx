import Link from "next/link";
import { specialisations } from "@/app/school/v1/content";

export default function SpecialisationsPage() {
  const items = Object.values(specialisations);
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Specialisations</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Parcours de specialisation</h1>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {items.map((program) => (
          <div key={program.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <p className="text-sm font-semibold text-slate-900">{program.title}</p>
            <p className="mt-2 text-sm text-slate-600">{program.objective}</p>
            <Link href={`/school/parcours/specialisations/${program.id}`} className="mt-4 inline-flex text-sm font-semibold text-sky-700">
              Ouvrir la specialisation →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

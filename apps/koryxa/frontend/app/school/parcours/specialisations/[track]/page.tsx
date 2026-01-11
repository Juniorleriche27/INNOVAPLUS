import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { specialisations } from "@/app/school/v1/content";

export function generateStaticParams() {
  return Object.keys(specialisations).map((track) => ({ track }));
}

export default function SpecialisationEntryPage({ params }: { params: { track: string } }) {
  if (params.track === "data-analyst") {
    redirect("/school/data-analyst/module-1");
  }
  const program = specialisations[params.track];
  if (!program) {
    notFound();
  }
  const firstModule = program.modules[0];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Specialisation</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">{program.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{program.objective}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-slate-200 px-2 py-1">{program.duration}</span>
        <span className="rounded-full border border-slate-200 px-2 py-1">{program.modules.length} modules</span>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Structure</p>
        <p className="mt-2">Texte principal + ressources + mini-test obligatoire.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/school/parcours/specialisations/${program.id}/${firstModule.id}`} className="btn-primary">
          Commencer la specialisation
        </Link>
        <Link href="/school/specialisations" className="btn-secondary">
          Retour aux specialisations
        </Link>
      </div>
    </section>
  );
}

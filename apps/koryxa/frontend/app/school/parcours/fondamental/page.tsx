import Link from "next/link";
import { foundationalProgram } from "@/app/school/v1/content";

export default function FundamentalEntryPage() {
  const firstModule = foundationalProgram.modules[0];
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Parcours</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">{foundationalProgram.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{foundationalProgram.objective}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-slate-200 px-2 py-1">{foundationalProgram.duration}</span>
        <span className="rounded-full border border-slate-200 px-2 py-1">{foundationalProgram.modules.length} modules</span>
      </div>
      <Link href={`/school/parcours/fondamental/${firstModule.id}`} className="btn-primary mt-6 inline-flex">
        Commencer le parcours
      </Link>
    </section>
  );
}

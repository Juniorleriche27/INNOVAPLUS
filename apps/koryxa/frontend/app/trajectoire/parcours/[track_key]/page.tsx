import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, Download, Files, Sparkles } from "lucide-react";

import { getFormationTrack } from "@/lib/formation";

export async function generateMetadata({ params }: { params: Promise<{ track_key: string }> }): Promise<Metadata> {
  const { track_key } = await params;
  return {
    title: `${track_key} | Formation IA | KORYXA`,
  };
}

export default async function FormationTrackPage({ params }: { params: Promise<{ track_key: string }> }) {
  const { track_key } = await params;
  let track;
  try {
    track = await getFormationTrack(track_key);
  } catch {
    notFound();
  }

  return (
    <main className="space-y-8 pb-12">
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:px-8">
        <Link href="/trajectoire" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900">
          <ArrowLeft className="h-4 w-4" />
          Retour à Formation IA
        </Link>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Parcours actif</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">{track.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{track.description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <BookOpen className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-2xl font-black text-slate-950">{track.module_count}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Modules</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <Clock3 className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-xl font-black text-slate-950">{track.estimated_duration || "-"}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Durée</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-xl font-black text-slate-950">{track.skills.length}+</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Compétences</p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {track.skills.map((skill) => (
            <span key={skill} className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
              {skill}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {track.modules.map((module) => {
          const notebook = module.resources.find((item) => item.resource_type === "notebook");
          const datasets = module.resources.filter((item) => item.resource_type === "dataset");
          return (
            <article key={module.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Module {module.order_index}</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{module.title}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{module.duration || "Module"}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{module.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {module.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Leçons</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{module.lesson_count}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ressources</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{module.resources.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Datasets</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{datasets.length}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/trajectoire/modules/${module.id}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Ouvrir le module
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                {notebook ? (
                  <a
                    href={notebook.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Télécharger le notebook
                    <Download className="ml-2 h-4 w-4" />
                  </a>
                ) : null}
              </div>

              {module.resources.length ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Files className="h-4 w-4" />
                    Ressources liées
                  </div>
                  <div className="space-y-2">
                    {module.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-sky-300"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-semibold text-slate-900">{resource.title}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                            {resource.resource_type}
                          </span>
                        </div>
                        {resource.description ? <p className="mt-1 text-slate-500">{resource.description}</p> : null}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </main>
  );
}

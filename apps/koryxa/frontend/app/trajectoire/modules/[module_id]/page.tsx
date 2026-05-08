import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Clock3, Download, Files, TerminalSquare } from "lucide-react";

import { getFormationModule, getNotebookCellsFromResource } from "@/lib/formation";

export async function generateMetadata({ params }: { params: Promise<{ module_id: string }> }): Promise<Metadata> {
  const { module_id } = await params;
  return {
    title: `Module ${module_id} | Formation IA | KORYXA`,
  };
}

export default async function FormationModulePage({ params }: { params: Promise<{ module_id: string }> }) {
  const { module_id } = await params;

  let module;
  try {
    module = await getFormationModule(module_id);
  } catch {
    notFound();
  }

  const notebookResource = module.resources.find((resource) => resource.resource_type === "notebook");
  const notebookCells = notebookResource ? await getNotebookCellsFromResource(notebookResource.url) : [];

  return (
    <main className="space-y-8 pb-12">
      <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:px-8">
        <Link href={`/trajectoire/parcours/${module.track_key}`} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition hover:text-sky-900">
          <ArrowLeft className="h-4 w-4" />
          Retour au parcours
        </Link>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Module {module.order_index}</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">{module.title}</h1>
            <p className="mt-4 text-base leading-8 text-slate-600">{module.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {module.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <Clock3 className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-lg font-black text-slate-950">{module.duration || "-"}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Durée</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <BookOpen className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-lg font-black text-slate-950">{module.lesson_count}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Leçons</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <Files className="mx-auto h-5 w-5 text-sky-600" />
              <p className="mt-2 text-lg font-black text-slate-950">{module.resources.length}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ressources</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.72fr_0.28fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Contenu du notebook</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Cours intégré</h2>
            </div>
            {notebookResource ? (
              <a
                href={notebookResource.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Télécharger
                <Download className="ml-2 h-4 w-4" />
              </a>
            ) : null}
          </div>

          {notebookCells.length ? (
            <div className="space-y-6">
              {notebookCells.map((cell, index) => (
                <article key={`${cell.cell_type}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{cell.cell_type}</span>
                    <TerminalSquare className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="p-4">
                    {cell.cell_type === "markdown" ? (
                      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{cell.source}</div>
                    ) : (
                      <pre className="overflow-x-auto rounded-xl bg-[#050c1a] p-4 text-sm leading-7 text-sky-100">
                        <code>{cell.source}</code>
                      </pre>
                    )}

                    {cell.text_outputs.length ? (
                      <div className="mt-4 space-y-2">
                        {cell.text_outputs.map((output, outputIndex) => (
                          <pre key={outputIndex} className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-emerald-200">
                            <code>{output}</code>
                          </pre>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Le notebook n’a pas encore été rendu dans l’interface, mais il est bien disponible dans les ressources du module.
            </div>
          )}
        </div>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-600">Ressources du module</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">Tout ce qui est lié</h2>
          <div className="mt-6 space-y-3">
            {module.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-sky-300 hover:bg-sky-50/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-slate-900">{resource.title}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                    {resource.resource_type}
                  </span>
                </div>
                {resource.description ? <p className="mt-2 text-sm leading-6 text-slate-500">{resource.description}</p> : null}
              </a>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

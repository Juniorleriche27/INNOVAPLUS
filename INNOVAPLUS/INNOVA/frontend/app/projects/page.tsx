// src/app/projects/page.tsx
import Link from "next/link";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { apiProjects, type Project } from "@/lib/api";

export default async function ProjectsPage() {
  let projects: Project[] = [];
  try {
    projects = await apiProjects.list();
  } catch (e) {
    projects = [];
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projets</h1>
        <Link href="/projects/new" className="rounded-lg bg-black px-4 py-2 text-white hover:opacity-90">
          Nouveau projet
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-600">Aucun projet pour le moment.</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id} className="rounded-xl border p-4 transition hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium">
                    {p.title ?? p.name}
                    <span className="ml-2 text-gray-500">({p.slug})</span>
                  </h2>
                  {p.description ? <p className="text-sm text-gray-600">{p.description}</p> : null}
                </div>
                <div className="flex gap-3">
                  {p.live_url ? (
                    <a className="text-sm underline" href={p.live_url} target="_blank" rel="noreferrer">
                      Live
                    </a>
                  ) : null}
                  {p.repo_url ? (
                    <a className="text-sm underline" href={p.repo_url} target="_blank" rel="noreferrer">
                      Repo
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


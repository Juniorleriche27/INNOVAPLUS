"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const WORKSPACE_LINKS = [
  { href: "/opportunities", label: "Opportunités", description: "Pipeline et statut" },
  { href: "/skills", label: "Compétences & secteurs", description: "Cartographie dynamique" },
  { href: "/talents", label: "Talents", description: "Profils et disponibilité" },
  { href: "/engine", label: "Moteur IA", description: "Règles RAG & équité" }
];

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={clsx(
        "sticky top-28 hidden w-72 flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-lg shadow-slate-900/5 backdrop-blur lg:flex",
        className
      )}
    >
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 p-5 text-white shadow-md shadow-sky-500/30">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-100">Workspace AI</p>
        <h3 className="mt-2 text-lg font-semibold">Gouvernez vos opportunités</h3>
        <p className="mt-2 text-sm text-sky-50">
          Suivez le matching, les quotas pays et l’impact en temps réel.
        </p>
      </div>

      <nav className="space-y-2">
        {WORKSPACE_LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "block rounded-2xl border px-4 py-3 transition",
                active
                  ? "border-sky-300 bg-sky-50 text-sky-700 shadow-sm shadow-sky-100"
                  : "border-transparent text-slate-600 hover:border-sky-100 hover:bg-slate-50"
              )}
            >
              <p className="text-sm font-semibold">{link.label}</p>
              <p className="text-xs text-slate-500">{link.description}</p>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const WORKSPACE_LINKS = [
  { href: "/opportunities", label: "Opportunités", description: "Pipeline et statut" },
  { href: "/skills", label: "Compétences & secteurs", description: "Cartographie dynamique" },
  { href: "/talents", label: "Talents", description: "Profils et disponibilité" },
  { href: "/engine", label: "Moteur IA", description: "Règles RAG & équité" }
];

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("innova.sidebar.collapsed");
    setCollapsed(saved === "1");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("innova.sidebar.collapsed", next ? "1" : "0");
  }

  return (
    <aside
      className={clsx(
        "sticky top-28 hidden shrink-0 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg shadow-slate-900/5 backdrop-blur lg:flex",
        collapsed ? "w-16" : "w-72",
        className
      )}
    >
      <div className={clsx("flex w-full flex-col gap-3", collapsed && "items-center")}> 
        <div className={clsx("rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 p-5 text-white shadow-md shadow-sky-500/30", collapsed && "p-3 text-center")}> 
          <div className="flex items-center justify-between gap-2">
            <p className={clsx("text-xs uppercase tracking-[0.3em] text-sky-100", collapsed && "sr-only")}>Workspace AI</p>
            <button onClick={toggle} aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"} className="rounded-full bg-white/20 px-2 py-1 text-xs font-semibold">
              {collapsed ? "›" : "‹"}
            </button>
          </div>
          <h3 className={clsx("mt-2 text-lg font-semibold", collapsed && "sr-only")}>Gouvernez vos opportunités</h3>
          <p className={clsx("mt-2 text-sm text-sky-50", collapsed && "sr-only")}>Suivez le matching, les quotas pays et l’impact en temps réel.</p>
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
                    : "border-transparent text-slate-600 hover:border-sky-100 hover:bg-slate-50",
                  collapsed && "px-2 text-center"
                )}
              >
                <p className={clsx("text-sm font-semibold", collapsed && "text-[0.75rem]")}>{link.label}</p>
                {!collapsed && <p className="text-xs text-slate-500">{link.description}</p>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}


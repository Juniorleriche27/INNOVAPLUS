"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function IconTarget(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  );
}
function IconLayers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4-8 4-8-4 8-4zm0 8l8 4-8 4-8-4 8-4z" />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m14-10a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function IconChip(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M7 7V3m10 4V3M7 21v-4m10 4v-4M3 12h18" />
    </svg>
  );
}
function IconChat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconStore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l1.5-3h15L21 7M5 7h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
    </svg>
  );
}

const WORKSPACE_LINKS = [
  { href: "/opportunities", label: "Opportunités", description: "Pipeline et statut" },
  { href: "/skills", label: "Compétences & secteurs", description: "Cartographie dynamique" },
  { href: "/talents", label: "Talents", description: "Profils et disponibilité" },
  { href: "/engine", label: "Moteur IA", description: "Règles RAG & équité" },
  { href: "/meet", label: "INNOVA-MEET", description: "Réseau social intégré" },
  { href: "/marketplace", label: "Marketplace", description: "Talents, services, bundles" },
];

export default function Sidebar({ className, style }: { className?: string; style?: React.CSSProperties }) {
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
        "max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain sidebar-scroll",
        collapsed ? "w-16" : "w-72",
        className
      )}
      style={style}
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
                <div className={clsx("flex items-center gap-2", collapsed && "justify-center")}> 
                  {link.href === "/opportunities" && <IconTarget className="h-4 w-4" />}
                  {link.href === "/skills" && <IconLayers className="h-4 w-4" />}
                  {link.href === "/talents" && <IconUsers className="h-4 w-4" />}
                  {link.href === "/engine" && <IconChip className="h-4 w-4" />}
                  {link.href === "/meet" && <IconChat className="h-4 w-4" />}
                  {link.href === "/marketplace" && <IconStore className="h-4 w-4" />}
                  <p className={clsx("text-sm font-semibold", collapsed && "text-[0.75rem]")}>{link.label}</p>
                </div>
                {!collapsed && <p className="text-xs text-slate-500">{link.description}</p>}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

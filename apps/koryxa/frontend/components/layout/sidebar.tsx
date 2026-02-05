"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IS_V1_SIMPLE } from "@/lib/env";

const ENABLE_SCHOOL = process.env.NEXT_PUBLIC_ENABLE_SCHOOL === "true";
const IS_V1 = IS_V1_SIMPLE;

function IconTarget(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M12 22a10 10 0 110-20 10 10 0 010 20z" />
    </svg>
  );
}
function IconLayers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4-8 4-8-4 8-4zm0 8l8 4-8 4-8-4 8-4z" />
    </svg>
  );
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m14-10a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function IconChip(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M7 7V3m10 4V3M7 21v-4m10 4v-4M3 12h18" />
    </svg>
  );
}
function IconChat(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function IconStore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l1.5-3h15L21 7M5 7h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function IconBriefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m4 0h-14a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-8a2 2 0 00-2-2z" />
    </svg>
  );
}
function IconBook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h9a4 4 0 014 4v10a3 3 0 01-3-3 3 3 0 01-3 3H6a2 2 0 01-2-2V5z" />
    </svg>
  );
}
function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2m8-2v2M4 7h16M6 21h12a2 2 0 002-2V7H4v12a2 2 0 002 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h2m4 0h2M8 15h2m4 0h2" />
    </svg>
  );
}
function IconChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
    </svg>
  );
}
function IconChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
    </svg>
  );
}

const WORKSPACE_LINKS = [
  { href: "/opportunities", label: "Opportunités", description: "Pipeline & statut", icon: IconTarget },
  { href: "/skills", label: "Compétences & secteurs", description: "Cartographie dynamique", icon: IconLayers },
  { href: "/talents", label: "Talents", description: "Profils et disponibilité", icon: IconUsers },
  { href: "/engine", label: "Moteur IA", description: "Règles RAG & équité", icon: IconChip },
  { href: "/meet", label: "KORYXA Meet", description: "Réseau social KORYXA", icon: IconChat },
  { href: "/missions/offers", label: "Mes offres", description: "Suivi et exécution", icon: IconBriefcase },
  { href: "/marketplace", label: "Marketplace", description: "Talents, services, bundles", icon: IconStore },
  // KORYXA School est caché par défaut pour préparer le module en coulisses.
  ...(ENABLE_SCHOOL
    ? [{ href: "/school", label: "KORYXA School", description: "Certificats & parcours", icon: IconBook } as const]
    : []),
];

const V1_LINKS = [
  { href: "/school", label: "KORYXA School", description: "Programme de formation", icon: IconBook },
  { href: "/entreprise", label: "Entreprise", description: "Besoins data & missions", icon: IconBriefcase },
  { href: "/school/planning", label: "Mon planning d’apprentissage", description: "Planning guidé par parcours", icon: IconCalendar },
];

type NavNode = { href: string; label: string; children?: NavNode[] };

const V1_SCHOOL_TREE: NavNode[] = [
  { href: "/school/parcours/fondamental", label: "Parcours fondamentaux" },
  {
    href: "/school/specialisations",
    label: "Specialisations",
  },
  { href: "/school/validations", label: "Projets & validations" },
];

export default function Sidebar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const pathname = usePathname();
  const hideForSchool = pathname.startsWith("/school");
  const hideForMyPlanning = pathname.startsWith("/myplanning");
  const [collapsed, setCollapsed] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);

  useEffect(() => {
    if (hideForSchool) return;
    const saved = localStorage.getItem("innova.sidebar.collapsed");
    if (saved === null) {
      // Default: collapsed on tablets, expanded on desktop
      const defaultCollapsed = window.matchMedia("(min-width: 640px) and (max-width: 1023.98px)").matches;
      setCollapsed(defaultCollapsed);
      return;
    }
    setCollapsed(saved === "1");
  }, [hideForSchool]);

  useEffect(() => {
    if (hideForSchool) return;
    if (pathname.startsWith("/school")) {
      setSchoolOpen(true);
    }
  }, [hideForSchool, pathname]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("innova.sidebar.collapsed", next ? "1" : "0");
  }

  const isExpanded = !collapsed;

  if (hideForSchool || hideForMyPlanning) {
    return null;
  }

  return (
    <aside
      className={clsx(
        // Modern sticky sidebar with glass effect
        "z-30 h-full shrink-0 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl overflow-visible",
        "transition-all duration-300 ease-in-out",
        // Smooth width transitions
        collapsed ? "w-[72px]" : "w-[280px]",
        className
      )}
      style={style}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center gap-3 p-3 border-b border-slate-200/60">
          {isExpanded && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <span className="text-white font-semibold text-xs">{IS_V1 ? "K" : "AI"}</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">KORYXA</h2>
                <p className="text-[11px] text-slate-500">{IS_V1 ? "School & Entreprise" : "IA • Opportunités"}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={toggle}
            className={clsx(
              "absolute right-2 top-2 z-[80] p-2 rounded-lg transition-colors pointer-events-auto",
              "bg-white/90 backdrop-blur border border-slate-200/70 shadow-sm",
              "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            )}
            aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
          >
            {collapsed ? <IconChevronRight className="h-4 w-4" /> : <IconChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex-1 p-4 space-y-2 overflow-y-auto overscroll-contain">
          {(IS_V1 ? V1_LINKS : WORKSPACE_LINKS).map((link) => {
            const active = pathname.startsWith(link.href);
            const Icon = link.icon;
            const isSchoolLink = IS_V1 && link.href === "/school";
            const showSchoolSubs = isSchoolLink && isExpanded && schoolOpen;
            
            return (
              <div key={link.href} className="space-y-2">
                <Link
                  href={link.href}
                  onClick={() => {
                    if (isSchoolLink) {
                      setSchoolOpen((prev) => !prev);
                    }
                  }}
                  className={clsx(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                    "hover:bg-slate-50 hover:shadow-sm",
                    active
                      ? "bg-sky-50 text-sky-700 shadow-sm border border-sky-200/60 ring-1 ring-sky-100"
                  : "text-slate-600 hover:text-slate-900",
                    // Collapsed state
                    collapsed && "justify-center px-2"
                  )}
                >
                  <div className={clsx(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                    active 
                      ? "bg-sky-100 text-sky-600" 
                      : "bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {isExpanded && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold truncate">{link.label}</span>
                        <div className="flex items-center gap-2">
                          {active && <div className="w-2 h-2 rounded-full bg-sky-500" />}
                          {isSchoolLink && (
                            <span className="text-[10px] font-semibold text-slate-500">
                              {schoolOpen ? "−" : "+"}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{link.description}</p>
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {link.label}
                    </div>
                  )}
                </Link>

                {showSchoolSubs ? (
                  <div className="ml-10 rounded-xl border border-slate-200/70 bg-white/80 p-2 shadow-sm">
                    <div className="space-y-1">
                      {V1_SCHOOL_TREE.map((sub) => {
                        const subActive = pathname.startsWith(sub.href);
                        const hasChildren = Boolean(sub.children?.length);
                        return (
                          <div key={sub.href} className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <Link
                                href={sub.href}
                                className={clsx(
                                  "flex-1 rounded-lg px-3 py-2 text-[12px] font-semibold transition",
                                  subActive
                                    ? "bg-sky-50 text-sky-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                {sub.label}
                              </Link>
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={() => setSpecialOpen((prev) => !prev)}
                                className="rounded-lg px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                              >
                                  {specialOpen ? "−" : "+"}
                                </button>
                              ) : null}
                            </div>
                            {hasChildren && specialOpen ? (
                              <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                                {sub.children?.map((child) => {
                                  const childActive = pathname.startsWith(child.href);
                                  const hasGrand = Boolean(child.children?.length);
                                  return (
                                    <div key={child.href} className="space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <Link
                                          href={child.href}
                                          className={clsx(
                                            "flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition",
                                            childActive
                                              ? "bg-sky-50 text-sky-700"
                                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                          )}
                                        >
                                          {child.label}
                                        </Link>
                                        {hasGrand ? (
                                          <button
                                            type="button"
                                            onClick={() => setAnalystOpen((prev) => !prev)}
                                            className="rounded-lg px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                                          >
                                            {analystOpen ? "−" : "+"}
                                          </button>
                                        ) : null}
                                      </div>
                                      {hasGrand && analystOpen ? (
                                        <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                                          {child.children?.map((module) => {
                                            const moduleActive = pathname.startsWith(module.href);
                                            const moduleHasChildren = Boolean(module.children?.length);
                                            return (
                                              <div key={module.href} className="space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                  <Link
                                                    href={module.href}
                                                    className={clsx(
                                                      "flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition",
                                                      moduleActive
                                                        ? "bg-sky-50 text-sky-700"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                    )}
                                                  >
                                                    {module.label}
                                                  </Link>
                                                  {moduleHasChildren ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => setModule1Open((prev) => !prev)}
                                                      className="rounded-lg px-2 text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                                                    >
                                                      {module1Open ? "−" : "+"}
                                                    </button>
                                                  ) : null}
                                                </div>
                                                {moduleHasChildren && module1Open ? (
                                                  <div className="ml-3 space-y-1 border-l border-slate-200 pl-3">
                                                    {module.children?.map((theme) => {
                                                      const themeActive = pathname.startsWith(theme.href);
                                                      return (
                                                        <Link
                                                          key={theme.href}
                                                          href={theme.href}
                                                          className={clsx(
                                                            "block rounded-lg px-2 py-1 text-[11px] font-semibold transition",
                                                            themeActive
                                                              ? "bg-sky-50 text-sky-700"
                                                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                          )}
                                                        >
                                                          {theme.label}
                                                        </Link>
                                                      );
                                                    })}
                                                  </div>
                                                ) : null}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60">
          {isExpanded ? (
            <div className="space-y-3">
              {!IS_V1 && (
                <div className="rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-slate-700">Système actif</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    IA en temps réel • Matching intelligent
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>v2.1.0</span>
                <span>•</span>
                <span>{IS_V1 ? "V1 simple active" : "Dernière mise à jour"}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

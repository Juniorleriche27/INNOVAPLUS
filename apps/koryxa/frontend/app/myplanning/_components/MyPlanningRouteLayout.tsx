"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";

type NavEntry = {
  href: string;
  label: string;
  icon?: string;
  prefix?: string;
  badge?: string;
};

const MARKETING_LINKS: NavEntry[] = [
  { href: "/myplanning", label: "Accueil" },
  { href: "/myplanning/pricing", label: "Tarifs" },
  { href: "/myplanning/enterprise", label: "Entreprise" },
];

const MARKETING_ROUTES = new Set(["/myplanning", "/myplanning/pricing"]);

const PRODUCT_SIDEBAR: Array<{ title: string; links: NavEntry[] }> = [
  {
    title: "Vues",
    links: [
      { href: "/myplanning/app", label: "Dashboard quotidien", icon: "📅", prefix: "/myplanning/app" },
      { href: "/myplanning/app/pro/stats", label: "Stats & graphiques", icon: "📈", prefix: "/myplanning/app/pro/stats", badge: "PRO" },
      { href: "/myplanning/team", label: "Espaces", icon: "👥", prefix: "/myplanning/team" },
    ],
  },
  {
    title: "Actions",
    links: [
      { href: "/myplanning/app", label: "Nouvelle tâche", icon: "➕", prefix: "/myplanning/app" },
      { href: "/myplanning/team", label: "Membres & rôles", icon: "🧩", prefix: "/myplanning/team" },
      { href: "/myplanning/app/integrations", label: "Intégrations", icon: "🔌", prefix: "/myplanning/app/integrations" },
    ],
  },
  {
    title: "Pro",
    links: [
      { href: "/myplanning/app/pro/coaching", label: "Coaching IA", icon: "🤖", prefix: "/myplanning/app/pro/coaching", badge: "PRO" },
      { href: "/myplanning/app/pro/templates", label: "Templates", icon: "📐", prefix: "/myplanning/app/pro/templates", badge: "PRO" },
      { href: "/myplanning/app/pro/automations", label: "Automatisations", icon: "⚡", prefix: "/myplanning/app/pro/automations", badge: "PRO" },
    ],
  },
  {
    title: "Team / Enterprise",
    links: [
      { href: "/myplanning/enterprise", label: "Organisation", icon: "🏢", prefix: "/myplanning/enterprise" },
      { href: "/myplanning/enterprise/demo", label: "Démo enterprise", icon: "🧪", prefix: "/myplanning/enterprise/demo" },
      { href: "/myplanning/pricing", label: "Tarifs", icon: "💳", prefix: "/myplanning/pricing" },
    ],
  },
];

const PRODUCT_FULLSCREEN_QUICK_LINKS: NavEntry[] = [
  { href: "/myplanning/app", label: "App" },
  { href: "/myplanning/pricing", label: "Tarifs" },
  { href: "/myplanning/team", label: "Espaces" },
  { href: "/myplanning/enterprise", label: "Organisation" },
  { href: "/myplanning/app/pro/stats", label: "Stats" },
];

function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/myplanning/login") || pathname.startsWith("/myplanning/signup");
}

function isMarketingRoute(pathname: string): boolean {
  return MARKETING_ROUTES.has(pathname) || isAuthRoute(pathname);
}

function isProductRoute(pathname: string): boolean {
  if (!pathname.startsWith("/myplanning")) return false;
  return !isMarketingRoute(pathname);
}

function isStandaloneWorkspace(pathname: string): boolean {
  // /myplanning/app* already ships with an internal shell component.
  return pathname.startsWith("/myplanning/app");
}

function isActive(pathname: string, entry: NavEntry): boolean {
  if (entry.href === "/myplanning/enterprise") {
    return pathname.startsWith("/myplanning/enterprise") || pathname.startsWith("/myplanning/orgs");
  }
  if (entry.prefix) return pathname.startsWith(entry.prefix);
  if (entry.href === "/myplanning") return pathname === "/myplanning";
  return pathname.startsWith(entry.href);
}

function breadcrumbTitle(pathname: string): string {
  if (pathname.startsWith("/myplanning/team")) return "MyPlanning / Espaces";
  if (pathname.startsWith("/myplanning/orgs")) return "MyPlanning / Organisations";
  if (pathname.startsWith("/myplanning/enterprise")) return "MyPlanning / Enterprise";
  if (pathname.startsWith("/myplanning/pro")) return "MyPlanning / Pro";
  if (pathname.startsWith("/myplanning/app")) return "MyPlanning / App";
  return "MyPlanning";
}

function FullscreenIcon({ active }: { active: boolean }) {
  return <span aria-hidden className="text-sm leading-none">{active ? "🗗" : "⛶"}</span>;
}

function ProductSidebar({ pathname, collapsed, onToggle }: { pathname: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className="hidden h-screen shrink-0 border-r border-slate-200 bg-white/95 p-3 pl-4 lg:flex lg:flex-col"
      style={{ width: collapsed ? "var(--sidebar-w-collapsed)" : "var(--sidebar-w)" }}
    >
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
        {!collapsed ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">MyPlanningAI</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">App Shell</p>
          </div>
        ) : (
          <p className="w-full text-center text-xs font-semibold text-slate-500">MP</p>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:border-sky-200 hover:text-sky-700"
          title={collapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
          aria-label={collapsed ? "Étendre la sidebar" : "Réduire la sidebar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
        {PRODUCT_SIDEBAR.map((group) => (
          <section key={group.title}>
            {!collapsed ? <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{group.title}</p> : null}
            <div className="mt-2 space-y-1">
              {group.links.map((entry) => {
                const active = isActive(pathname, entry);
                return (
                  <Link
                    key={`${group.title}-${entry.href}-${entry.label}`}
                    href={entry.href}
                    prefetch
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    title={entry.label}
                    className={clsx(
                      "flex items-center rounded-xl px-2 py-2 text-sm font-medium transition",
                      collapsed ? "justify-center" : "justify-between",
                      active ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span className={clsx("inline-flex items-center gap-2", collapsed ? "justify-center" : "")}>{entry.icon ? <span>{entry.icon}</span> : null}{collapsed ? null : <span>{entry.label}</span>}</span>
                    {!collapsed && entry.badge ? (
                      <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold", active ? "bg-white/20" : "bg-sky-100 text-sky-700")}>{entry.badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}

function ProductTopbar({
  pathname,
  onToggleFullscreen,
  isFullscreen,
}: {
  pathname: string;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-2 py-3 backdrop-blur sm:px-3" style={{ minHeight: "var(--topbar-h)" }}>
      <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" prefetch className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
            ← Site KORYXA
          </Link>
          <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{breadcrumbTitle(pathname)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/myplanning/pricing"
            prefetch
            scroll={false}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
          >
            Tarifs
          </Link>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Quitter le plein écran (Esc)" : "Activer le plein écran"}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
          >
            <FullscreenIcon active={isFullscreen} />
            {isFullscreen ? "Quitter le plein écran" : "Plein écran"}
          </button>
        </div>
      </div>
    </header>
  );
}

function MarketingHeader({ ctaHref, ctaLabel, pathname }: { ctaHref: string; ctaLabel: string; pathname: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-[var(--content-pad-sm)] py-3 backdrop-blur sm:px-[var(--content-pad)] lg:px-8">
      <div className="mx-auto flex w-full items-center justify-between gap-3" style={{ maxWidth: "var(--marketing-max-w)" }}>
        <Link href="/myplanning" className="flex min-w-0 items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <span className="text-xs font-semibold text-white">MP</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black tracking-wide text-slate-900">MyPlanningAI</p>
            <p className="hidden truncate text-[11px] text-slate-500 md:block">Organisation universelle • Powered by KORYXA</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {MARKETING_LINKS.map((link) => {
            const active = link.href === "/myplanning" ? pathname === "/myplanning" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                scroll={false}
                className={clsx(
                  "inline-flex min-w-[110px] justify-center rounded-xl border px-3 py-2 text-[12px] font-semibold shadow-sm transition",
                  active
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50/70 hover:text-sky-700"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link href={ctaHref} prefetch scroll={false} className="inline-flex min-w-[132px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}

export default function MyPlanningRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, initialLoggedIn } = useAuth();
  const isAuthenticated = initialLoggedIn || Boolean(user?.email);
  const productRoute = isProductRoute(pathname);
  const standaloneWorkspace = isStandaloneWorkspace(pathname);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"expanded" | "collapsed">("expanded");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const raw = (new URLSearchParams(window.location.search).get("fullscreen") || "").toLowerCase();
      setIsFullscreen(raw === "1" || raw === "true" || raw === "yes" || raw === "on");
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("myplanning:querychange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("myplanning:querychange", sync);
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("myplanning.sidebar");
    if (saved === "collapsed" || saved === "expanded") {
      setSidebarMode(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("myplanning.sidebar", sidebarMode);
  }, [sidebarMode]);

  const isSidebarCollapsed = sidebarMode === "collapsed";

  const toggleFullscreen = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (isFullscreen) url.searchParams.delete("fullscreen");
    else url.searchParams.set("fullscreen", "1");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setIsFullscreen(!isFullscreen);
    window.dispatchEvent(new Event("myplanning:querychange"));
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const url = new URL(window.location.href);
      url.searchParams.delete("fullscreen");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      setIsFullscreen(false);
      window.dispatchEvent(new Event("myplanning:querychange"));
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [isFullscreen]);

  const ctaHref = isAuthenticated ? "/myplanning/app" : "/myplanning/login?redirect=/myplanning/app";
  const ctaLabel = isAuthenticated ? "Ouvrir l'app" : "Commencer";

  if (!productRoute) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <MarketingHeader ctaHref={ctaHref} ctaLabel={ctaLabel} pathname={pathname} />
        <main className="w-full px-[var(--content-pad-sm)] py-6 sm:px-[var(--content-pad)] lg:px-8">
          <div className="mx-auto w-full" style={{ maxWidth: "var(--marketing-max-w)" }}>
            {children}
          </div>
        </main>
        <footer className="border-t border-slate-200 bg-white px-[var(--content-pad-sm)] py-4 text-xs text-slate-500 sm:px-[var(--content-pad)] lg:px-8">
          <div className="mx-auto flex w-full flex-wrap items-center justify-between gap-3" style={{ maxWidth: "var(--marketing-max-w)" }}>
            <p>MyPlanningAI • Produit SaaS de pilotage quotidien.</p>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-sky-700">
                Confidentialité
              </Link>
              <Link href="/terms" className="hover:text-sky-700">
                Mentions légales
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (standaloneWorkspace) {
    return <div className="min-h-screen w-full bg-slate-100">{children}</div>;
  }

  if (isFullscreen) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-slate-100">
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 p-2 sm:p-3">
          <div className="pointer-events-auto mx-auto flex w-full max-w-[var(--app-max-w)] items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/95 px-2 py-2 shadow-md backdrop-blur">
            <div className="flex flex-wrap items-center gap-1">
              {PRODUCT_FULLSCREEN_QUICK_LINKS.map((entry) => {
                const active = isActive(pathname, entry);
                return (
                  <Link
                    key={`fullscreen-${entry.href}`}
                    href={entry.href}
                    prefetch
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition",
                      active
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700"
                    )}
                  >
                    {entry.label}
                  </Link>
                );
              })}
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              title="Quitter le plein écran (Esc)"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:border-sky-200 hover:text-sky-700"
            >
              <FullscreenIcon active />
              Quitter (Esc)
            </button>
          </div>
        </div>
        <main className="min-h-screen w-full overflow-y-auto px-2 pb-2 pt-16 sm:px-3 sm:pb-3 sm:pt-20">
          <div className="mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-100">
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <ProductSidebar pathname={pathname} collapsed={isSidebarCollapsed} onToggle={() => setSidebarMode((prev) => (prev === "expanded" ? "collapsed" : "expanded"))} />
        <div className="flex min-w-0 flex-1 flex-col">
          <ProductTopbar pathname={pathname} onToggleFullscreen={toggleFullscreen} isFullscreen={isFullscreen} />
          <main className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3 sm:py-3">
            <div className="mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      <nav className="fixed bottom-4 left-1/2 z-40 w-[min(640px,calc(100vw-20px))] -translate-x-1/2 lg:hidden">
        <div className="grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur">
          {[
            { href: "/myplanning/app", label: "App" },
            { href: "/myplanning/team", label: "Espaces" },
            { href: "/myplanning/enterprise", label: "Org" },
            { href: "/myplanning/app/pro/stats", label: "Stats" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              scroll={false}
              className={clsx(
                "rounded-xl px-2 py-2 text-center text-xs font-semibold",
                pathname.startsWith(item.href) ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

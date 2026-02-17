"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";

type NavEntry = {
  href: string;
  label: string;
  prefix?: string;
  badge?: string;
};

const MARKETING_LINKS: NavEntry[] = [
  { href: "/myplanning", label: "Accueil" },
  { href: "/myplanning/pricing", label: "Tarifs" },
  { href: "/myplanning/enterprise", label: "Entreprise" },
];

const PRODUCT_ROUTE_PREFIXES = [
  "/myplanning/app",
  "/myplanning/team",
  "/myplanning/orgs",
  "/myplanning/workspaces",
  "/myplanning/enterprise/app",
  "/myplanning/enterprise/dashboard",
  "/myplanning/enterprise/onboarding",
  "/myplanning/pro",
  "/myplanning/stats",
  "/myplanning/coaching-ia",
  "/myplanning/automatisations",
];

const PRODUCT_SIDEBAR: Array<{ title: string; links: NavEntry[] }> = [
  {
    title: "Vues",
    links: [
      { href: "/myplanning/app", label: "Dashboard quotidien", prefix: "/myplanning/app" },
      { href: "/myplanning/app/pro/stats", label: "Stats & graphiques", prefix: "/myplanning/app/pro/stats", badge: "PRO" },
      { href: "/myplanning/team", label: "Espaces", prefix: "/myplanning/team" },
    ],
  },
  {
    title: "Actions",
    links: [
      { href: "/myplanning/app", label: "Nouvelle tâche", prefix: "/myplanning/app" },
      { href: "/myplanning/team", label: "Membres & rôles", prefix: "/myplanning/team" },
      { href: "/myplanning/app/integrations", label: "Intégrations", prefix: "/myplanning/app/integrations" },
    ],
  },
  {
    title: "Pro",
    links: [
      { href: "/myplanning/app/pro/coaching", label: "Coaching IA", prefix: "/myplanning/app/pro/coaching", badge: "PRO" },
      { href: "/myplanning/app/pro/templates", label: "Templates", prefix: "/myplanning/app/pro/templates", badge: "PRO" },
      { href: "/myplanning/app/pro/automations", label: "Automatisations", prefix: "/myplanning/app/pro/automations", badge: "PRO" },
    ],
  },
  {
    title: "Team / Enterprise",
    links: [
      { href: "/myplanning/enterprise", label: "Organisation", prefix: "/myplanning/enterprise" },
      { href: "/myplanning/enterprise/demo", label: "Démo enterprise", prefix: "/myplanning/enterprise/demo" },
    ],
  },
];

function isProductRoute(pathname: string): boolean {
  if (!pathname.startsWith("/myplanning")) return false;
  if (pathname.startsWith("/myplanning/login") || pathname.startsWith("/myplanning/signup")) return false;
  return PRODUCT_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isStandaloneWorkspace(pathname: string): boolean {
  // /myplanning/app* already ships with its own product shell.
  return pathname.startsWith("/myplanning/app");
}

function isActive(pathname: string, entry: NavEntry): boolean {
  if (entry.prefix) return pathname.startsWith(entry.prefix);
  if (entry.href === "/myplanning") return pathname === "/myplanning";
  return pathname.startsWith(entry.href);
}

function ProductSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white/95 p-4 lg:flex lg:flex-col">
      <Link href="/myplanning" className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">MyPlanningAI</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">App Shell</p>
      </Link>

      <nav className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
        {PRODUCT_SIDEBAR.map((group) => (
          <section key={group.title}>
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{group.title}</p>
            <div className="mt-2 space-y-1">
              {group.links.map((entry) => {
                const active = isActive(pathname, entry);
                return (
                  <Link
                    key={`${group.title}-${entry.href}-${entry.label}`}
                    href={entry.href}
                    className={clsx(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                      active ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <span>{entry.label}</span>
                    {entry.badge ? (
                      <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold", active ? "bg-white/20" : "bg-sky-100 text-sky-700")}>
                        {entry.badge}
                      </span>
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
  fullscreenHref,
  isFullscreen,
}: {
  pathname: string;
  fullscreenHref: string;
  isFullscreen: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
            ← Site KORYXA
          </Link>
          <Link
            href="/myplanning"
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              pathname === "/myplanning" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700"
            )}
          >
            Accueil MyPlanning
          </Link>
          <Link
            href="/myplanning/enterprise"
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              pathname.startsWith("/myplanning/enterprise") || pathname.startsWith("/myplanning/orgs")
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700"
            )}
          >
            Enterprise
          </Link>
        </div>

        <Link
          href={fullscreenHref}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
        >
          {isFullscreen ? "Quitter le plein écran" : "Plein écran"}
        </Link>
      </div>
    </header>
  );
}

function MarketingHeader({
  ctaHref,
  ctaLabel,
  pathname,
  isAuthenticated,
}: {
  ctaHref: string;
  ctaLabel: string;
  pathname: string;
  isAuthenticated: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between gap-3">
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
            const href = link.href === "/myplanning/enterprise" && isAuthenticated ? "/myplanning/enterprise/onboarding" : link.href;
            const active = link.href === "/myplanning" ? pathname === "/myplanning" : pathname.startsWith(link.href);
            return (
              <Link
                key={`${link.href}-${href}`}
                href={href}
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

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700 md:inline-flex"
          >
            Site KORYXA
          </Link>
          <Link href={ctaHref} className="inline-flex min-w-[132px] items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function MyPlanningRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, initialLoggedIn } = useAuth();
  const isAuthenticated = initialLoggedIn || Boolean(user?.email);
  const productRoute = isProductRoute(pathname);
  const standaloneWorkspace = isStandaloneWorkspace(pathname);
  const isFullscreen = searchParams.get("fullscreen") === "1";

  const fullscreenHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (isFullscreen) params.delete("fullscreen");
    else params.set("fullscreen", "1");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [isFullscreen, pathname, searchParams]);

  const ctaHref = isAuthenticated ? "/myplanning/app" : "/myplanning/login?redirect=/myplanning/app";
  const ctaLabel = isAuthenticated ? "Ouvrir l'app" : "Commencer";

  if (!productRoute) {
    return (
      <div className="min-h-screen w-full bg-slate-50">
        <MarketingHeader ctaHref={ctaHref} ctaLabel={ctaLabel} pathname={pathname} isAuthenticated={isAuthenticated} />
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
      <div className="min-h-screen w-full bg-slate-100">
        <main className="min-h-screen w-full overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <div className="flex min-h-screen w-full">
        <ProductSidebar pathname={pathname} />
        <div className="flex min-w-0 flex-1 flex-col">
          <ProductTopbar pathname={pathname} fullscreenHref={fullscreenHref} isFullscreen={isFullscreen} />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
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

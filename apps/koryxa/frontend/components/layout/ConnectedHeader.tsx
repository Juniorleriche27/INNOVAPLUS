"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

type ConnectedNavLink = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const CONNECTED_NAV_LINKS: ConnectedNavLink[] = [
  {
    href: "/myplanning/app",
    label: "Accueil",
    match: (pathname) => pathname === "/myplanning/app" || pathname.startsWith("/myplanning/app/pro") || pathname.startsWith("/myplanning/team"),
  },
  {
    href: "/myplanning/app/koryxa",
    label: "Trajectoire",
    match: (pathname) => pathname.startsWith("/myplanning/app/koryxa") && !pathname.startsWith("/myplanning/app/koryxa-enterprise"),
  },
  {
    href: "/myplanning/app/koryxa-enterprise",
    label: "Entreprise",
    match: (pathname) => pathname.startsWith("/myplanning/app/koryxa-enterprise"),
  },
  {
    href: "/chatlaya",
    label: "ChatLAYA",
    match: (pathname) => pathname.startsWith("/chatlaya"),
  },
  {
    href: "/myplanning/opportunities",
    label: "Opportunités",
    match: (pathname) => pathname.startsWith("/myplanning/opportunities"),
  },
  {
    href: "/myplanning/profile",
    label: "Profil",
    match: (pathname) => pathname.startsWith("/myplanning/profile"),
  },
  {
    href: "/myplanning/settings",
    label: "Paramètres",
    match: (pathname) => pathname.startsWith("/myplanning/settings"),
  },
];

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function ConnectedHeader() {
  const pathname = usePathname();
  const { user, initialLoggedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = initialLoggedIn || Boolean(user?.email);
  const displayName = useMemo(() => {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    return fullName || user?.email || "Plateforme connectée";
  }, [user]);
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white shadow-[0_18px_48px_rgba(2,6,23,0.34)]">
      <div className="mx-auto flex w-full max-w-[var(--app-max-w)] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/myplanning/app" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#0f172a,#0ea5e9)]">
              <span className="text-sm font-black tracking-[0.18em] text-white">K</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-wide">KORYXA</p>
              <p className="hidden truncate text-[11px] text-slate-300 md:block">Plateforme connectée • KORYXA × MyPlanningAI</p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-2 xl:flex">
          {CONNECTED_NAV_LINKS.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "border-sky-400/60 bg-sky-500/15 text-white"
                    : "border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-900 hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200">
            Connecté
          </span>
          <Link
            href={isAuthenticated ? "/myplanning/profile" : "/myplanning/login?redirect=/chatlaya"}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-400/60 hover:text-sky-100"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-100">
              {userInitial}
            </span>
            <span>{isAuthenticated ? "Profil" : "Se connecter"}</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-white xl:hidden"
          aria-label={mobileOpen ? "Fermer le menu connecté" : "Ouvrir le menu connecté"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 xl:hidden">
          <div className="mx-auto flex w-full max-w-[var(--app-max-w)] flex-col gap-2">
            {CONNECTED_NAV_LINKS.map((link) => {
              const active = link.match(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-sky-400/60 bg-sky-500/15 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-200 hover:border-sky-400/60 hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}

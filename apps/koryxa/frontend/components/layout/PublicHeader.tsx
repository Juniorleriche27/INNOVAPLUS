"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import LogoutButton from "@/components/auth/LogoutButton";

type PublicNavLink = {
  href: string;
  label: string;
};

const PUBLIC_NAV_LINKS: PublicNavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
  { href: "/entreprise", label: "Entreprise" },
  { href: "/about", label: "À propos" },
  { href: "/myplanning/pricing", label: "Tarifs" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

export default function PublicHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = Boolean(user?.email);
  const platformHref = isAuthenticated ? "/myplanning/app" : "/signup";
  const accountHref = isAuthenticated ? "/myplanning/profile" : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[var(--marketing-max-w)] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#082f49,#0284c7)] shadow-[0_18px_40px_rgba(2,132,199,0.24)]">
            <span className="text-sm font-black tracking-[0.18em] text-white">K</span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-black tracking-wide text-slate-950">KORYXA</p>
            <p className="hidden text-[11px] text-slate-500 md:block">Site public • trajectoires, besoins et produits</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {PUBLIC_NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  active
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href={accountHref}
            className="inline-flex min-w-[124px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
          >
            {isAuthenticated ? "Mon profil" : "Se connecter"}
          </Link>
          {isAuthenticated ? (
            <LogoutButton
              redirectTo={pathname}
              className="inline-flex min-w-[124px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
            />
          ) : null}
          <Link
            href={platformHref}
            className="inline-flex min-w-[148px] items-center justify-center rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            {isAuthenticated ? "Ouvrir la plateforme" : "S’inscrire"}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="mx-auto flex w-full max-w-[var(--marketing-max-w)] flex-col gap-2">
            {PUBLIC_NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:text-sky-700",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                href={accountHref}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                {isAuthenticated ? "Mon profil" : "Se connecter"}
              </Link>
              {isAuthenticated ? (
                <LogoutButton
                  redirectTo={pathname}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                />
              ) : null}
              <Link
                href={platformHref}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white",
                  isAuthenticated ? "sm:col-span-2" : "",
                )}
              >
                {isAuthenticated ? "Ouvrir la plateforme" : "S’inscrire"}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

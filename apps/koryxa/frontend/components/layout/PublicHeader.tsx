"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import LogoutButton from "@/components/auth/LogoutButton";
import ThemeToggle from "@/components/theme/ThemeToggle";

type PublicNavLink = {
  href: string;
  label: string;
};

const PUBLIC_NAV_LINKS: PublicNavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/trajectoire", label: "Trajectoire" },
  { href: "/community", label: "Réseau IA" },
  { href: "/products", label: "Produits" },
  { href: "/entreprise", label: "Entreprise" },
  { href: "/about", label: "À propos" },
];

const KORYXA_CONNECTED_HOME = "/myplanning/app/koryxa-home";
const KORYXA_PUBLIC_HOME = "/";

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

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/reset") ||
    pathname.startsWith("/account/recover");
  const isAuthenticated = Boolean(user?.email) && !isAuthPage;
  const signupHref = `/signup?redirect=${encodeURIComponent(KORYXA_PUBLIC_HOME)}`;
  const loginHref = `/login?redirect=${encodeURIComponent(KORYXA_PUBLIC_HOME)}`;
  const platformHref = isAuthenticated ? KORYXA_CONNECTED_HOME : signupHref;

  return (
    <header className="sticky top-0 z-40 border-b border-white/55 bg-white/76 backdrop-blur-2xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/78">
      <div className="mx-auto flex w-full max-w-[var(--marketing-max-w)] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-12 w-6 items-center justify-center rounded-[14px] border border-white/75 bg-[linear-gradient(180deg,#05111d_0%,#08304f_55%,#0ea5e9_100%)] shadow-[0_16px_30px_rgba(2,132,199,0.18)]">
            <span className="text-[0.95rem] font-black tracking-[-0.08em] text-white">K</span>
          </div>
          <div className="min-w-0">
            <p className="kx-display text-[1.48rem] font-semibold leading-none text-slate-950 dark:text-white sm:text-[1.58rem]">KORYXA</p>
          </div>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex">
          {PUBLIC_NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "whitespace-nowrap rounded-full border px-4 py-2.5 text-[0.95rem] font-semibold transition",
                  active
                    ? "border-sky-200/90 bg-sky-50/95 text-sky-700 shadow-[0_12px_26px_rgba(14,165,233,0.08)] dark:border-sky-400/50 dark:bg-sky-500/15 dark:text-sky-100"
                    : "border-transparent text-slate-800 hover:border-slate-200/80 hover:bg-white/80 hover:text-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <ThemeToggle showLabel={false} />
          {!isAuthenticated ? (
            <Link
              href={loginHref}
              className="inline-flex whitespace-nowrap items-center justify-center rounded-full border border-slate-200/80 bg-white/92 px-4 py-2.5 text-[0.95rem] font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-400/60 dark:hover:text-sky-100"
            >
              Se connecter
            </Link>
          ) : null}
          {isAuthenticated ? (
            <LogoutButton
              redirectTo={pathname}
              className="inline-flex whitespace-nowrap items-center justify-center rounded-full border border-slate-200/80 bg-white/92 px-4 py-2.5 text-[0.95rem] font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-rose-400/50 dark:hover:text-rose-200"
            />
          ) : null}
          <Link
            href={platformHref}
            className={clsx(
              "inline-flex whitespace-nowrap items-center justify-center rounded-full px-6 py-3 text-[0.95rem] font-semibold text-white transition",
              isAuthenticated
                ? "bg-[linear-gradient(135deg,#082f49_0%,#0284c7_48%,#38bdf8_100%)] shadow-[0_18px_40px_rgba(2,132,199,0.24)] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(2,132,199,0.3)] dark:bg-[linear-gradient(135deg,#38bdf8_0%,#0ea5e9_52%,#0284c7_100%)] dark:text-white dark:shadow-[0_18px_42px_rgba(14,165,233,0.22)]"
                : "bg-[linear-gradient(135deg,#0f172a_0%,#0b4b6f_42%,#38bdf8_100%)] shadow-[0_18px_42px_rgba(2,132,199,0.28)] hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(2,132,199,0.34)] dark:bg-[linear-gradient(135deg,#38bdf8_0%,#0ea5e9_52%,#0284c7_100%)] dark:text-slate-950 dark:shadow-[0_18px_42px_rgba(14,165,233,0.22)]",
            )}
          >
            {isAuthenticated ? "Ouvrir la plateforme" : "S’inscrire"}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-700 xl:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200/80 bg-white/92 px-4 py-4 dark:border-slate-800 dark:bg-slate-950 xl:hidden">
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
                      ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/50 dark:bg-sky-500/15 dark:text-sky-100"
                      : "border-slate-200/80 bg-white/90 text-slate-700 hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-400/60 dark:hover:text-sky-100",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ThemeToggle showLabel={false} className="justify-center sm:col-span-2" />
              {!isAuthenticated ? (
                <Link
                  href={loginHref}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  Se connecter
                </Link>
              ) : null}
              {isAuthenticated ? (
                <LogoutButton
                  redirectTo={pathname}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              ) : null}
              <Link
                href={platformHref}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white",
                  isAuthenticated
                    ? "bg-[linear-gradient(135deg,#0ea5e9_0%,#0284c7_58%,#0369a1_100%)] shadow-[0_16px_36px_rgba(2,132,199,0.22)] dark:bg-[linear-gradient(135deg,#38bdf8_0%,#0ea5e9_52%,#0284c7_100%)] dark:text-white"
                    : "bg-[linear-gradient(135deg,#0f172a_0%,#0369a1_46%,#38bdf8_100%)] shadow-[0_16px_36px_rgba(2,132,199,0.24)] dark:bg-[linear-gradient(135deg,#38bdf8_0%,#0ea5e9_52%,#0284c7_100%)] dark:text-slate-950",
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

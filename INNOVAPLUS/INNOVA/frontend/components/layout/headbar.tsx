// innova-frontend/components/layout/headbar.tsx
"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type SVGProps } from "react";

const CHAT_ROUTE = "/chat-laya";

const PRIMARY_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/about", label: "A propos" },
  { href: "/contact", label: "Contact" },
];

const MORE_LINKS = [
  { href: "/community", label: "Communaute" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/blog", label: "Blog" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/help", label: "Aide" },
];

type IconProps = SVGProps<SVGSVGElement>;
type NavLinkProps = {
  href: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
};

function NavLink({ href, children, onClick, className }: NavLinkProps) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sky-100 text-sky-800 shadow-sm shadow-sky-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        className
      )}
    >
      {children}
    </Link>
  );
}

function MenuIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      {...props}
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx={11} cy={11} r={6} />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function SparklesIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3l1.2 3.5 3.5.3-2.7 2.3.8 3.7L12 11l-2.8 1.8.8-3.7-2.7-2.3 3.5-.3L12 3Z" />
      <path d="M5 14l.6 1.8L7 16l-1.4 1.2.4 1.9L5 18.3l-1 .8.4-1.9L3 16l1.4-.2L5 14Z" />
      <path d="M18.5 15.5l.6 1.6 1.6.2-1.2 1.1.4 1.7-1.4-.8-1.4.8.4-1.7-1.2-1.1 1.6-.2.6-1.6Z" />
    </svg>
  );
}

function ChevronDownIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function UserCircleIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx={12} cy={12} r={9} />
      <circle cx={12} cy={10} r={2.8} />
      <path d="M7.5 17c1.6-2.1 3.6-3 4.5-3s2.9.9 4.5 3" />
    </svg>
  );
}

export default function Headbar() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const authRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!authRef.current?.contains(event.target as Node)) {
        setAuthOpen(false);
      }
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function onLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoggingOut(false);
      setAuthOpen(false);
    }
  }

  return (
    <header
      className={clsx(
        "sticky top-0 z-50 border-b border-transparent bg-white/85 backdrop-blur-sm transition-shadow",
        scrolled ? "border-slate-200/80 shadow-[0_8px_20px_rgba(15,23,42,0.08)]" : "shadow-none"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => {
            setMobileOpen((value) => !value);
            setMoreOpen(false);
            setAuthOpen(false);
          }}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 md:hidden"
          aria-label="Ouvrir le menu"
          aria-expanded={mobileOpen}
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold uppercase tracking-wide text-white">
            IN
          </span>
          <span className="hidden text-sm font-semibold leading-tight sm:flex sm:flex-col">
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
              Innova+
            </span>
            <span>Collectif</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {PRIMARY_LINKS.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden w-full max-w-xs md:block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Rechercher"
              className="w-full rounded-full border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <Link
            href={CHAT_ROUTE}
            className="hidden items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-700 lg:inline-flex"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>Chat-LAYA</span>
          </Link>

          <div className="relative hidden md:block" ref={moreRef}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMoreOpen((value) => !value);
                setAuthOpen(false);
              }}
              className={clsx(
                "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition",
                moreOpen && "border-sky-200 text-sky-700 shadow-sm shadow-sky-100"
              )}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
            >
              <span>Ressources</span>
              <ChevronDownIcon
                className={clsx(
                  "h-4 w-4 transition-transform duration-200",
                  moreOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
              >
                {MORE_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={authRef}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setAuthOpen((value) => !value);
                setMoreOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              aria-haspopup="menu"
              aria-expanded={authOpen}
            >
              <UserCircleIcon className="h-5 w-5 text-slate-500" />
              <span className="hidden sm:inline">Compte</span>
              <ChevronDownIcon
                className={clsx(
                  "h-4 w-4 text-slate-400 transition-transform duration-200",
                  authOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </button>
            {authOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
              >
                <Link
                  href="/signup"
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
                  onClick={() => setAuthOpen(false)}
                >
                  Inscription
                </Link>
                <Link
                  href="/login"
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
                  onClick={() => setAuthOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/account/recover"
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
                  onClick={() => setAuthOpen(false)}
                >
                  Mot de passe oublie
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                  disabled={loggingOut}
                >
                  {loggingOut ? "Deconnexion..." : "Se deconnecter"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur-sm md:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Rechercher"
                className="w-full rounded-2xl border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>
            {PRIMARY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-700"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={CHAT_ROUTE}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700"
              onClick={() => setMobileOpen(false)}
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Chat-LAYA</span>
            </Link>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {MORE_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-sky-200 hover:text-sky-700"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2 text-sm font-medium text-slate-600">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Connexion
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)}>
                Inscription
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onLogout();
                }}
                className="text-left text-red-600"
              >
                {loggingOut ? "Se deconnecter..." : "Se deconnecter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

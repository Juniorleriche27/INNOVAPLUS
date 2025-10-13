"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiNotifications } from "@/lib/api";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/resources", label: "Ressources" },
  { href: "/about", label: "À propos" }
];

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.6 3.6a7.5 7.5 0 0013.05 13.05z" />
    </svg>
  );
}
function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.172V11a6 6 0 10-12 0v3.172a2 2 0 01-.6 1.428L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function Headbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Array<{ id: string; type: string; payload: any; created_at: string; read_at?: string }>>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Light login flag via non-HTTPOnly cookie
  useEffect(() => {
    const hasFlag = () => typeof document !== "undefined" && /(?:^|; )innova_logged_in=1/.test(document.cookie);
    setLoggedIn(hasFlag());
    const t = setInterval(() => setLoggedIn(hasFlag()), 3000);
    return () => clearInterval(t);
  }, []);

  // Keyboard shortcut: '/' opens search (except when typing in inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const editable = (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "/" && !editable && tag !== "input" && tag !== "textarea") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setAccountOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Try to fetch notifications count if backend exposes it
  useEffect(() => {
    const userId = "demo-user";
    apiNotifications
      .list(userId, true)
      .then((items) => {
        setNotifs(items);
        setNotifCount(items.length);
      })
      .catch(() => void 0);
  }, []);

  // Mark notifications as read when opening the dropdown
  useEffect(() => {
    if (!notifOpen) return;
    const unreadIds = notifs.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const userId = "demo-user";
    apiNotifications
      .markRead(userId, unreadIds)
      .then(() => {
        setNotifs((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        setNotifCount(0);
      })
      .catch(() => void 0);
  }, [notifOpen, notifs]);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-colors",
        scrolled ? "border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm" : "bg-transparent"
      )}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 py-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              IN
            </span>
            <div className="leading-tight hidden sm:block">
              <p className="text-lg font-semibold text-slate-900">INNOVA+</p>
              <p className="text-xs text-slate-500">Moteur IA d’opportunités · Transparence · Équité · Impact</p>
            </div>
          </Link>
        </div>

        {/* Center: Nav (aligné à gauche, pas centré) */}
        <nav className="hidden lg:flex items-center gap-4 flex-1 ml-6">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3 py-2 text-sm font-medium text-slate-600 transition",
                  "hover:text-slate-900",
                  active && "text-sky-700 underline decoration-2 underline-offset-8"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2">
          {/* Search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Recherche"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <IconSearch className="h-4 w-4" />
          </button>
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              aria-label="Notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <IconBell className="h-4 w-4" />
              {notifCount > 0 && <span className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">{Math.min(notifCount, 9)}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                <p className="px-2 py-1 text-xs text-slate-500">Notifications</p>
                {notifs.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-slate-400">Aucune notification.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto">
                    {notifs.map((n) => (
                      <li key={n.id} className="rounded-xl px-2 py-2 hover:bg-slate-50">
                        <p className="text-xs font-semibold text-slate-700">{n.type}</p>
                        <p className="text-xs text-slate-500">{n.payload?.title || n.payload?.message || "—"}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          {/* Account */}
          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white"
            >
              ME
            </button>
            {accountOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-lg shadow-slate-900/10">
                <Link className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/account">Profil</Link>
                <Link className="block rounded-xl px-3 py-2 hover:bg-slate-50" href="/opportunities">Mes opportunités</Link>
                <button onClick={async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } finally { setAccountOpen(false); location.href = '/'; } }} className="block w-full rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50">Déconnexion</button>
              </div>
            )}
          </div>
          {/* CTA */}
          <Link href="/opportunities/create" className="btn-primary hidden sm:inline-flex">
            Créer une opportunité
          </Link>
          <Link href="/chatlaya" className="btn-secondary hidden lg:inline-flex">
            CHATLAYA
          </Link>
          {/* Burger */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          >
            <IconMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4" onClick={() => setSearchOpen(false)}>
          <div
            className="container-shell mx-auto max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="flex items-center gap-2">
                <IconSearch className="h-5 w-5 text-slate-400" />
                <input
                  autoFocus
                  type="search"
                  placeholder="Besoin, compétence, pays…"
                  className="h-10 w-full rounded-md border-none text-base text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button onClick={() => setSearchOpen(false)} aria-label="Fermer" className="rounded-md p-1 hover:bg-slate-100">
                  <IconClose className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-[10px] font-semibold tracking-[0.3em] text-white">IN</span>
                <span className="text-base font-semibold">INNOVA+</span>
              </Link>
              <button aria-label="Fermer" onClick={() => setDrawerOpen(false)} className="rounded-full p-2 hover:bg-slate-100">
                <IconClose className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)} className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50">
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/opportunities/create" onClick={() => setDrawerOpen(false)} className="btn-primary">
                Créer une opportunité
              </Link>
              <Link href="/chatlaya" onClick={() => setDrawerOpen(false)} className="btn-secondary">
                CHATLAYA
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}



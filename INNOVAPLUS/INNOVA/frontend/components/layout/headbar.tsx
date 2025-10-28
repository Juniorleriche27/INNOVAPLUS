"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiNotifications } from "@/lib/api";
import { AUTH_API_BASE } from "@/lib/env";
import { useAuth } from "@/components/auth/AuthProvider";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/resources", label: "Ressources" },
  { href: "/about", label: "À propos" }
];

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.6 3.6a7.5 7.5 0 0013.05 13.05z" />
    </svg>
  );
}
function IconBell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.172V11a6 6 0 10-12 0v3.172a2 2 0 01-.6 1.428L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
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
function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}
function IconSparkles(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

export default function Headbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { user, initialLoggedIn, loading } = useAuth();
  const displayName = useMemo(() => {
    if (!user) return "";
    const parts = [user.first_name, user.last_name].filter(Boolean);
    if (parts.length) return parts.join(" ");
    return user.email ?? "";
  }, [user]);
  const userInitial = useMemo(() => (displayName ? displayName.charAt(0).toUpperCase() : "I"), [displayName]);
  const showAccount = loading || initialLoggedIn || Boolean(user);
  const accountTitle = displayName || (loading ? "Chargement..." : "Mon espace");
  const accountEmail = user?.email ?? (loading ? "Connexion en cours..." : "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Array<{ id: string; type: string; payload: Record<string, unknown> | null; created_at: string; read_at?: string }>>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Try to fetch notifications count if backend exposes it
  useEffect(() => {
    if (!showAccount) return;
    const userId = user?.id ?? "demo-user";
    let active = true;
    apiNotifications
      .list(userId, true)
      .then((items) => {
        if (!active) return;
        setNotifs(items);
        setNotifCount(items.length);
      })
      .catch(() => void 0);
    return () => {
      active = false;
    };
  }, [showAccount, user]);

  // Mark notifications as read when opening the dropdown
  useEffect(() => {
    if (!notifOpen || !showAccount) return;
    const unreadIds = notifs.filter((n) => !n.read_at).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const userId = user?.id ?? "demo-user";
    apiNotifications
      .markRead(userId, unreadIds)
      .then(() => {
        setNotifs((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
        setNotifCount(0);
      })
      .catch(() => void 0);
  }, [notifOpen, notifs, showAccount, user]);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled 
          ? "border-b border-slate-200/60 bg-white/90 backdrop-blur-xl shadow-sm shadow-slate-900/5" 
          : "bg-transparent"
      )}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-4">
          {/* Left: Brand */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-500/25 group-hover:shadow-xl group-hover:shadow-sky-500/30 transition-all duration-300">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="leading-tight hidden sm:block">
                <p className="text-lg font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                  INNOVA+
                </p>
                <p className="text-xs text-slate-500">
                  Intelligence Artificielle • Transparence • Équité
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 ml-8">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    "hover:bg-slate-50 hover:text-slate-900",
                    active 
                      ? "text-sky-700 bg-sky-50 shadow-sm" 
                      : "text-slate-600"
                  )}
                >
                  {link.label}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Recherche"
              className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:border-sky-300 hover:text-sky-600 transition-all duration-200"
            >
              <IconSearch className="h-4 w-4" />
              <div className="absolute -bottom-1 -right-1 text-xs text-slate-400 font-mono">/</div>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:border-sky-300 hover:text-sky-600 transition-all duration-200"
              >
                <IconBell className="h-4 w-4" />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white shadow-lg">
                    {Math.min(notifCount, 9)}
                  </span>
                )}
              </button>
              
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl p-4 shadow-xl shadow-slate-900/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <IconClose className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>
                  
                  {notifs.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                        <IconBell className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-500">Aucune notification</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {notifs.map((n) => (
                        <div key={n.id} className="rounded-xl p-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{n.type}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {n.payload?.title || n.payload?.message || "—"}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(n.created_at).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auth controls */}
            {showAccount ? (
              <div className="relative">
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all duration-200"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-xs font-bold">
                    {userInitial}
                  </div>
                  <span className="hidden sm:block">ME</span>
                  <IconChevronDown className="h-3 w-3 hidden sm:block" />
                </button>
                
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl p-2 shadow-xl shadow-slate-900/10">
                    <div className="px-3 py-2 border-b border-slate-200/60 mb-2">
                      <p className="text-sm font-medium text-slate-900">
                        {accountTitle}
                      </p>
                      <p className="text-xs text-slate-500">{accountEmail}</p>
                    </div>
                    <Link 
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors" 
                      href="/account"
                      onClick={() => setAccountOpen(false)}
                    >
                      <IconSparkles className="h-4 w-4" />
                      Profil
                    </Link>
                    <Link 
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors" 
                      href="/opportunities"
                      onClick={() => setAccountOpen(false)}
                    >
                      <IconSparkles className="h-4 w-4" />
                      Mes opportunités
                    </Link>
                    <button 
                      onClick={async () => { 
                        try { 
                          await fetch(`${AUTH_API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }); 
                        } finally { 
                          setAccountOpen(false); 
                          location.href = '/'; 
                        } 
                      }} 
                      className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <IconClose className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/login" 
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all duration-200"
                >
                  Se connecter
                </Link>
                <Link 
                  href="/signup" 
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <IconSparkles className="h-4 w-4" />
                  Créer un compte
                </Link>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Link 
                href="/opportunities/create" 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 hover:border-sky-300 transition-all duration-200"
              >
                <IconSparkles className="h-4 w-4" />
                Créer une opportunité
              </Link>
              <Link 
                href="/chatlaya" 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200"
              >
                <IconSparkles className="h-4 w-4" />
                CHATLAYA
              </Link>
            </div>

            {/* Mobile menu */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:border-sky-300 hover:text-sky-600 transition-all duration-200 lg:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div
            className="container mx-auto max-w-2xl p-4 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <IconSearch className="h-5 w-5 text-slate-400" />
                <input
                  autoFocus
                  type="search"
                  placeholder="Rechercher des opportunités, compétences, pays..."
                  className="h-12 w-full rounded-xl border-none text-base text-slate-700 outline-none placeholder:text-slate-400 bg-transparent"
                />
                <button 
                  onClick={() => setSearchOpen(false)} 
                  aria-label="Fermer" 
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <IconClose className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-lg font-semibold text-slate-900">INNOVA+</span>
              </Link>
              <button 
                aria-label="Fermer" 
                onClick={() => setDrawerOpen(false)} 
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <IconClose className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            
            <nav className="flex flex-col gap-2 mb-6">
              {NAV_LINKS.map((link) => {
                const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    onClick={() => setDrawerOpen(false)} 
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-all duration-200",
                      active 
                        ? "bg-sky-50 text-sky-700 border border-sky-200" 
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      active ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-500"
                    )}>
                      <IconSparkles className="h-4 w-4" />
                    </div>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            
            <div className="space-y-3">
              <Link 
                href="/opportunities/create" 
                onClick={() => setDrawerOpen(false)} 
                className="flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors"
              >
                <IconSparkles className="h-4 w-4" />
                Créer une opportunité
              </Link>
              <Link 
                href="/chatlaya" 
                onClick={() => setDrawerOpen(false)} 
                className="flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <IconSparkles className="h-4 w-4" />
                CHATLAYA
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


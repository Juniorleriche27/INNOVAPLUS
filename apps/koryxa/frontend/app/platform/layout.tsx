"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Bell,
  Bot,
  BriefcaseBusiness,
  FolderKanban,
  Home,
  MessageSquare,
  Settings,
  Target,
  Users,
  UserCircle2,
} from "lucide-react";

const MAIN_NAV = [
  { name: "Accueil", href: "/platform", icon: Home, exact: true },
  { name: "Trajectoire", href: "/platform/trajectoire", icon: Target },
  { name: "Entreprise", href: "/platform/entreprise", icon: BriefcaseBusiness },
  { name: "ChatLAYA", href: "/platform/chatlaya", icon: Bot },
  { name: "Opportunités", href: "/platform/opportunites", icon: BriefcaseBusiness },
  { name: "Missions", href: "/platform/missions", icon: FolderKanban },
  { name: "Communauté", href: "/platform/communaute", icon: Users },
  { name: "Messages", href: "/platform/messages", icon: MessageSquare, badge: 3 },
  { name: "Formateurs", href: "/platform/formateurs", icon: Users },
];

const SECONDARY_NAV = [
  { name: "Profil", href: "/platform/profil", icon: UserCircle2 },
  { name: "Notifications", href: "/platform/notifications", icon: Bell, badge: 5 },
  { name: "Paramètres", href: "/platform/parametres", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentTitle =
    MAIN_NAV.find((item) => isActive(pathname, item.href, item.exact))?.name ||
    SECONDARY_NAV.find((item) => isActive(pathname, item.href))?.name ||
    "Plateforme KORYXA";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fb] text-slate-900">
      <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900 text-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-4">
          <span className="kx-display bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-xl font-bold text-transparent">
            KORYXA
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge ? <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-slate-800 px-3 py-3">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge ? <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">{item.badge}</span> : null}
              </Link>
            );
          })}

          <div className="mt-4 border-t border-slate-800 px-3 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white">AM</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Amara Mensah</p>
                <p className="truncate text-xs text-slate-400">Data Analyst</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <h1 className="text-xl font-semibold">{currentTitle}</h1>
          <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:text-sky-700">
            Site public
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

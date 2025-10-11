"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/opportunities", label: "Opportunit\u00E9s" },
  { href: "/chat-laya", label: "Chat-LAYA" },
  { href: "/resources", label: "Ressources" },
  { href: "/about", label: "\u00C0 propos" },
  { href: "/account", label: "Compte" }
];

export default function Headbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-shell flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            IN
          </span>
          <div className="leading-tight">
            <p className="text-lg font-semibold text-slate-900">INNOVA+</p>
            <p className="text-xs text-slate-500">
              Moteur IA d\u2019opportunit\u00E9s \u00B7 Transparence \u00B7 \u00C9quit\u00E9 \u00B7 Impact
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-sky-100 text-sky-700 shadow-sm shadow-sky-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/opportunities/create" className="btn-primary">
            Cr\u00E9er une opportunit\u00E9
          </Link>
          <Link href="/chat-laya" className="btn-secondary">
            Essayer Chat-LAYA
          </Link>
        </div>
      </div>
    </header>
  );
}


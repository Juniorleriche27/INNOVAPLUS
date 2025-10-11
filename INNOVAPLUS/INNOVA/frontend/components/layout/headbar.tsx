"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/opportunities", label: "Opportunités" },
  { href: "/chat-laya", label: "CHATLAYA" },
  { href: "/resources", label: "Ressources" },
  { href: "/about", label: "À propos" },
  { href: "/account", label: "Compte" }
];

export default function Headbar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-shell flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            IN
          </span>
          <div className="leading-tight">
            <p className="text-lg font-semibold text-slate-900">INNOVA+</p>
            <p className="text-xs text-slate-500">
              Moteur IA d’opportunités · Transparence · Équité · Impact
            </p>
          </div>
        </Link>

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
            Créer une opportunité
          </Link>
          <Link href="/chat-laya" className="btn-secondary">
            CHATLAYA
          </Link>
        </div>
      </div>
    </header>
  );
}


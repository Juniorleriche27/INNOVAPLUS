"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IS_V1_SIMPLE } from "@/lib/env";

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/school")) return null;
  if (pathname.startsWith("/myplanning/app")) return null;
  const isMyPlanning = pathname.startsWith("/myplanning");
  const hasMyPlanningFloatingNav =
    isMyPlanning &&
    !pathname.startsWith("/myplanning/app") &&
    !pathname.startsWith("/myplanning/login") &&
    !pathname.startsWith("/myplanning/signup") &&
    !pathname.startsWith("/myplanning/stats");

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold uppercase tracking-wide text-white">
            {isMyPlanning ? "MA" : "IN"}
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-slate-800">{isMyPlanning ? "MyPlanningAI" : "KORYXA"}</p>
            <p className="text-xs text-slate-500">
              {isMyPlanning
                ? "Organisation universelle. Priorites, execution, impact."
                : IS_V1_SIMPLE
                ? "Formation et besoins reels, pour des resultats concrets."
                : "KORYXA — Moteur IA d’opportunités. Transparence · Équité · Impact."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 sm:text-sm">
          <Link href="/about" className="transition hover:text-sky-600">
            À propos
          </Link>
          <Link href="/privacy" className="transition hover:text-sky-600">
            Confidentialité
          </Link>
          <Link href="/terms" className="transition hover:text-sky-600">
            Mentions légales
          </Link>
          <span className="text-slate-400">v1.0.0</span>
        </div>

        <p className="text-xs text-slate-400 sm:text-sm">
          Copyright {year} {isMyPlanning ? "MyPlanningAI" : "KORYXA"}. Tous droits réservés.
        </p>
      </div>
      {hasMyPlanningFloatingNav ? <div className="h-20" aria-hidden="true" /> : null}
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IS_V1_SIMPLE } from "@/lib/env";

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/myplanning")) return null;
  if (pathname.startsWith("/school")) return null;
  const isMyPlanning = pathname.startsWith("/myplanning");

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/88">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold uppercase tracking-wide text-white">
            {isMyPlanning ? "MA" : "K"}
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{isMyPlanning ? "MyPlanningAI" : "KORYXA"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isMyPlanning
                ? "Organisation universelle. Priorites, execution, impact."
                : IS_V1_SIMPLE
                ? "Trajectoires, missions et besoins réels, pour des résultats utiles."
                : "KORYXA — Moteur IA d’opportunités. Transparence · Équité · Impact."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          <Link href="/communaute" className="transition hover:text-sky-600 dark:hover:text-sky-300">
            Communauté
          </Link>
          <Link href="/formateurs" className="transition hover:text-sky-600 dark:hover:text-sky-300">
            Formateurs
          </Link>
          <Link href="/a-propos" className="transition hover:text-sky-600 dark:hover:text-sky-300">
            À propos
          </Link>
          <Link href="/legal/confidentialite" className="transition hover:text-sky-600 dark:hover:text-sky-300">
            Confidentialité
          </Link>
          <Link href="/legal/mentions" className="transition hover:text-sky-600 dark:hover:text-sky-300">
            Mentions légales
          </Link>
          <span className="text-slate-400 dark:text-slate-500">v1.0.0</span>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 sm:text-sm">
          Copyright {year} {isMyPlanning ? "MyPlanningAI" : "KORYXA"}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

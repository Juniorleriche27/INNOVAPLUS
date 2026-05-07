"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function SignalementButton() {
  const pathname = usePathname();

  if (pathname.startsWith("/chatlaya")) return null;

  return (
    <div className="fixed left-4 top-20 z-40 sm:left-6">
      {/* Ring ping autour du bouton */}
      <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
      <Link
        href="/chatlaya?intent=problem_collector"
        aria-label="Signaler un problème de terrain"
        className="relative flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#b91c1c_0%,#ef4444_60%,#f97316_100%)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_0_18px_rgba(239,68,68,0.55)] transition-all duration-200 hover:scale-105 hover:shadow-[0_0_28px_rgba(239,68,68,0.70)]"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
        <span className="hidden sm:inline">Signaler un problème</span>
        <span className="sm:hidden">Signaler</span>
      </Link>
    </div>
  );
}

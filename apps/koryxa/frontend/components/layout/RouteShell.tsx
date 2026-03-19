"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/layout/footer";
import PublicHeader from "@/components/layout/PublicHeader";
import ConnectedHeader from "@/components/layout/ConnectedHeader";

function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell relative flex min-h-screen flex-col text-slate-900 transition-colors duration-300 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.32),transparent_62%)] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.22),transparent_58%)]" aria-hidden />
      <PublicHeader />
      <main id="page-content" className="relative flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[var(--marketing-max-w)]">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

function ConnectedShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <ConnectedHeader />
      <main id="page-content" className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[var(--app-max-w)]">{children}</div>
      </main>
    </div>
  );
}

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/myplanning") || pathname.startsWith("/school")) {
    return <>{children}</>;
  }

  if (pathname.startsWith("/chatlaya")) {
    return <ConnectedShell>{children}</ConnectedShell>;
  }

  return <PublicShell>{children}</PublicShell>;
}

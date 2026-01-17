"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DataAnalystModule } from "../data";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function matchesTheme(pathname: string, href: string, match?: string) {
  const target = match || href;
  return isActivePath(pathname, target);
}

export default function DataAnalystSidebar({ modules }: { modules: DataAnalystModule[] }) {
  const pathname = usePathname();
  const [openModule, setOpenModule] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeModule = useMemo(() => {
    const match = modules.find((module) => {
      if (isActivePath(pathname, module.href)) return true;
      return module.themes.some((theme) => matchesTheme(pathname, theme.href, theme.match));
    });
    return match?.index ?? modules[0]?.index ?? 1;
  }, [modules, pathname]);

  useEffect(() => {
    setOpenModule(activeModule);
  }, [activeModule]);

  return (
    <aside className="w-full shrink-0 lg:w-[280px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">KORYXA School</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Data Analyst</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="data-analyst-sidebar"
          >
            Menu
          </button>
        </div>

        <div
          id="data-analyst-sidebar"
          className={`mt-4 space-y-3 ${mobileOpen ? "block" : "hidden lg:block"}`}
        >
          {modules.map((module) => {
            const isOpen = openModule === module.index;
            const isActive =
              isActivePath(pathname, module.href) ||
              module.themes.some((theme) => matchesTheme(pathname, theme.href, theme.match));
            return (
              <div key={module.href} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                <button
                  type="button"
                  onClick={() => setOpenModule(isOpen ? null : module.index)}
                  className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-800"
                  aria-expanded={isOpen}
                >
                  <span className={isActive ? "text-slate-900" : "text-slate-700"}>
                    {module.title}
                  </span>
                  <span className="text-xs text-slate-400">{isOpen ? "−" : "+"}</span>
                </button>
                <div className={`mt-3 space-y-2 ${isOpen ? "block" : "hidden"}`}>
                  <Link
                    href={module.href}
                    className={`block rounded-xl border px-3 py-2 text-xs font-semibold ${
                      isActivePath(pathname, module.href)
                        ? "border-sky-200 bg-sky-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Vue du module
                  </Link>
                  {module.themes.length > 0 ? (
                    module.themes.map((theme) => {
                    const activeTheme = matchesTheme(pathname, theme.href, theme.match);
                      return (
                        <Link
                          key={theme.href}
                          href={theme.href}
                          className={`block rounded-xl border px-3 py-2 text-xs ${
                            activeTheme
                              ? "border-sky-200 bg-sky-50 text-slate-900"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                          aria-current={activeTheme ? "page" : undefined}
                        >
                          {theme.title}
                        </Link>
                      );
                    })
                  ) : (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      Contenu en preparation.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

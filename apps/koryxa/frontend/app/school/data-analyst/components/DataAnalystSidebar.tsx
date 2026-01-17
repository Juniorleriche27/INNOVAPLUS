"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tracks = [
    { label: "Data Analyst", href: "/school/data-analyst" },
    { label: "Data Engineer", href: "/school/parcours/specialisations/data-engineer" },
    { label: "Data Scientist", href: "/school/parcours/specialisations/data-scientist" },
    { label: "ML Engineer", href: "/school/parcours/specialisations/machine-learning-engineer" },
  ];

  const activeModule = useMemo(() => {
    const match = modules.find((module) => {
      if (isActivePath(pathname, module.href)) return true;
      return module.themes.some((theme) => matchesTheme(pathname, theme.href, theme.match));
    });
    return match?.index ?? modules[0]?.index ?? 1;
  }, [modules, pathname]);

  const selectedModule = useMemo(
    () => modules.find((module) => module.index === activeModule) || modules[0],
    [modules, activeModule]
  );

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
          className={`mt-4 space-y-4 ${mobileOpen ? "block" : "hidden lg:block"}`}
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Parcours</p>
            <div className="mt-3 space-y-2 text-sm">
              {tracks.map((track) => {
                const active = isActivePath(pathname, track.href);
                return (
                  <Link
                    key={track.href}
                    href={track.href}
                    className={`block rounded-xl border px-3 py-2 ${
                      active
                        ? "border-sky-200 bg-sky-50 text-slate-900 font-semibold"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {track.label}
                  </Link>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Module</p>
            <select
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              value={selectedModule?.index}
              onChange={(event) => {
                const next = modules.find((module) => module.index === Number(event.target.value));
                if (next) {
                  setOpenModule(next.index);
                  router.push(next.href);
                }
              }}
            >
              {modules.map((module) => (
                <option key={module.href} value={module.index}>
                  {module.title}
                </option>
              ))}
            </select>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Sommaire du module
                </p>
                {selectedModule ? (
                  <Link href={selectedModule.href} className="text-xs font-semibold text-sky-700">
                    Ouvrir
                  </Link>
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {selectedModule?.themes.length ? (
                  selectedModule.themes.map((theme) => {
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
          </section>
        </div>
      </div>
    </aside>
  );
}

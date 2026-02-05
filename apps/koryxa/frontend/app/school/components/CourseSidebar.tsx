"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CourseModule, SchoolTrackId, TrackMeta } from "@/app/school/catalog";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function firstLessonHref(module: CourseModule | undefined): string | null {
  if (!module) return null;
  for (const theme of module.themes) {
    if (theme.lessons.length > 0) return theme.lessons[0].href;
  }
  return null;
}

function findActiveModuleIndex(pathname: string, modules: CourseModule[]): number | null {
  const hit = modules.find((module) => {
    if (isActivePath(pathname, module.href)) return true;
    return module.themes.some((theme) => theme.lessons.some((lesson) => isActivePath(pathname, lesson.href)));
  });
  return hit?.index ?? null;
}

type DropdownItem = { id: string; label: string; href?: string; value?: string };

function Dropdown({
  label,
  buttonLabel,
  items,
  open,
  setOpen,
  onSelect,
}: {
  label: string;
  buttonLabel: string;
  items: DropdownItem[];
  open: boolean;
  setOpen: (next: boolean) => void;
  onSelect: (item: DropdownItem) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && ref.current && !ref.current.contains(target)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, setOpen]);

  return (
    <div ref={ref} className="relative">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={label}
        className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        aria-expanded={open}
      >
        <span className="truncate">{buttonLabel}</span>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="max-h-72 overflow-y-auto py-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CourseSidebar({
  tracks,
  trackId,
  modules,
}: {
  tracks: TrackMeta[];
  trackId: SchoolTrackId;
  modules: CourseModule[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);

  const currentTrack = useMemo(() => tracks.find((t) => t.id === trackId) ?? tracks[0], [trackId, tracks]);

  const activeModuleIndex = useMemo(() => {
    if (pathname === currentTrack.href) {
      const raw = searchParams.get("module");
      const parsed = raw ? Number(raw) : NaN;
      if (Number.isFinite(parsed) && parsed >= 1) return parsed;
    }
    return findActiveModuleIndex(pathname, modules) ?? modules[0]?.index ?? 1;
  }, [currentTrack.href, modules, pathname, searchParams]);

  const selectedModule = useMemo(
    () => modules.find((module) => module.index === activeModuleIndex) || modules[0],
    [modules, activeModuleIndex]
  );

  const moduleDropdownItems: DropdownItem[] = useMemo(
    () =>
      modules.map((module) => ({
        id: String(module.index),
        label: module.title,
        value: String(module.index),
      })),
    [modules]
  );

  const trackDropdownItems: DropdownItem[] = useMemo(
    () => tracks.map((track) => ({ id: track.id, label: track.label, href: track.href })),
    [tracks]
  );

  const activeLessonHref = pathname;
  const planningHref = `${currentTrack.href}/planning`;

  return (
    <aside className="w-full min-h-0">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">KORYXA School</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{currentTrack.label}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 lg:hidden"
            aria-expanded={mobileOpen}
          >
            Menu
          </button>
        </div>

        <div className={`mt-4 space-y-4 ${mobileOpen ? "block" : "hidden lg:block"}`}>
          <section className="rounded-2xl border border-slate-200 bg-white p-3">
            <Dropdown
              label="Parcours"
              buttonLabel={currentTrack.label}
              items={trackDropdownItems}
              open={trackOpen}
              setOpen={(next) => {
                setTrackOpen(next);
                if (next) setModuleOpen(false);
              }}
              onSelect={(item) => {
                if (item.href) router.push(item.href);
              }}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3">
            <Dropdown
              label="Module"
              buttonLabel={selectedModule?.title || "—"}
              items={moduleDropdownItems}
              open={moduleOpen}
              setOpen={(next) => {
                setModuleOpen(next);
                if (next) setTrackOpen(false);
              }}
              onSelect={(item) => {
                const idx = item.value ? Number(item.value) : NaN;
                const nextModule = modules.find((m) => m.index === idx);
                const nextLesson = firstLessonHref(nextModule);
                if (nextLesson) {
                  router.push(nextLesson);
                  return;
                }
                if (nextModule?.href === currentTrack.href) {
                  const next = new URLSearchParams(searchParams.toString());
                  next.set("module", String(idx));
                  router.push(`${currentTrack.href}?${next.toString()}`);
                  return;
                }
                if (nextModule?.href) router.push(nextModule.href);
              }}
            />

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sommaire du module</p>
                {selectedModule ? (
                  <Link href={firstLessonHref(selectedModule) || selectedModule.href} className="text-xs font-semibold text-sky-700">
                    Ouvrir
                  </Link>
                ) : null}
              </div>

              <div className="mt-3 space-y-3">
                {selectedModule?.themes.length ? (
                  selectedModule.themes.map((theme) => (
                    <div key={theme.title} className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{theme.title}</p>
                      <div className="space-y-1">
                        {theme.lessons.map((lesson) => {
                          const active = activeLessonHref === lesson.href;
                          return (
                            <Link
                              key={lesson.href}
                              href={lesson.href}
                              className={`block rounded-xl border px-3 py-2 text-xs transition ${
                                active
                                  ? "border-sky-200 bg-sky-50 text-slate-900"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                              aria-current={active ? "page" : undefined}
                            >
                              {lesson.title}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                    Contenu en préparation.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Outils</p>
            <Link
              href={planningHref}
              className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <span className="truncate">Mon planning d’apprentissage</span>
              <span className="text-slate-400">→</span>
            </Link>
            <p className="mt-2 text-xs text-slate-500">Génère un planning guidé à partir de ton parcours.</p>
          </section>
        </div>
      </div>
    </aside>
  );
}

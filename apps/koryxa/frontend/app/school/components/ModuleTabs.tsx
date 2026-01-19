"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Vidéos", slug: "videos" },
  { label: "Articles", slug: "articles" },
  { label: "Projet", slug: "project" },
  { label: "Quiz", slug: "quiz" },
] as const;

export default function ModuleTabs({ baseHref }: { baseHref: string }) {
  const pathname = usePathname();
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const href = `${baseHref}/${tab.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={tab.slug}
              href={href}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}


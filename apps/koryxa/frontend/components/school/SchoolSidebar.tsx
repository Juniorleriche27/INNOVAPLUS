"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/school/fondamentaux", label: "Parcours fondamentaux" },
  { href: "/school/specialisations", label: "Specialisations" },
  { href: "/school/validations", label: "Projets & validations" },
];

export default function SchoolSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">KORYXA School</p>
      <nav className="mt-4 flex flex-col gap-2">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-xl px-3 py-2 text-sm font-semibold transition",
                active
                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

"use client";

import Link from "next/link";

const navItems = [
  { label: "Accueil module", href: "/school/data-analyst/module-1" },
  { label: "Theme 1", href: "/school/data-analyst/module-1/theme-1" },
  { label: "Theme 2", href: "/school/data-analyst/module-1/theme-2" },
  { label: "Theme 3", href: "/school/data-analyst/module-1/theme-3" },
  { label: "Theme 4", href: "/school/data-analyst/module-1/theme-4" },
  { label: "Theme 5", href: "/school/data-analyst/module-1/theme-5" },
  { label: "Notebooks", href: "/school/data-analyst/module-1/notebooks" },
  { label: "Quiz", href: "/school/data-analyst/module-1/quiz" },
  { label: "Mini-projet", href: "/school/data-analyst/module-1/mini-project" },
  { label: "Soumettre", href: "/school/data-analyst/module-1/submit" },
];

export default function Module1Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Data Analyst</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Module 1</h2>
        <nav className="mt-4 space-y-2 text-sm text-slate-600">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg px-2 py-1 hover:bg-slate-50">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}

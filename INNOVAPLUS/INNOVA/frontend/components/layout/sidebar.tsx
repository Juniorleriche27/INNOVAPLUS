"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function ProjectsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x={3.5} y={4.5} width={8} height={6} rx={1.5} />
      <rect x={12.5} y={4.5} width={8} height={5.5} rx={1.5} />
      <rect x={3.5} y={13.5} width={8} height={6} rx={1.5} />
      <path d="M12.5 13.5h8m-8 5h4.5" />
    </svg>
  );
}

function DomainsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.5 9L12 4.5 19.5 9 12 13.5 4.5 9Z" />
      <path d="M4.5 15L12 10.5 19.5 15 12 19.5 4.5 15Z" />
    </svg>
  );
}

function ContributorsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx={9} cy={8} r={3} />
      <circle cx={17} cy={9.5} r={2.5} />
      <path d="M4.5 18c0-2.9 2.4-5.3 5.5-5.3s5.5 2.4 5.5 5.3" />
      <path d="M14.8 13.9c2.4.2 4.2 2.2 4.2 4.6" />
    </svg>
  );
}

function TechnologyIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x={5} y={6.5} width={14} height={11} rx={2.5} />
      <path d="M9 3.5h6M9 20.5h6" />
      <rect x={8.5} y={10.5} width={7} height={3} rx={1.2} />
      <path d="M7 9v6m10-6v6" />
    </svg>
  );
}

function ChevronIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

type NavItem = {
  href: string;
  label: string;
  description: string;
  exact?: boolean;
  Icon: (props: IconProps) => JSX.Element;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/projects",
    label: "Projets",
    description: "Pilotez vos initiatives",
    Icon: ProjectsIcon,
  },
  {
    href: "/domains",
    label: "Domaines",
    description: "Cartographiez vos expertises",
    Icon: DomainsIcon,
  },
  {
    href: "/contributors",
    label: "Contributeurs",
    description: "Animez votre reseau",
    Icon: ContributorsIcon,
  },
  {
    href: "/technologies",
    label: "Technologies",
    description: "Suivez vos outils cle",
    Icon: TechnologyIcon,
  },
];

type SidebarProps = {
  className?: string;
};

export default function Sidebar(props: SidebarProps) {
  const { className } = props;
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        "relative flex flex-col min-h-[26rem] overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-[width] duration-300 ease-in-out",
        collapsed ? "w-20 px-3 py-4" : "w-72 p-4",
        className
      )}
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
        {!collapsed ? (
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Innova+</span>
            <span className="text-lg font-semibold text-slate-800">Workspace</span>
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500 text-xs font-semibold uppercase tracking-wide text-white">
            IN
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
          aria-label={collapsed ? "Deployer la navigation" : "Replier la navigation"}
        >
          <ChevronIcon
            className={clsx(
              "h-4 w-4 transition-transform duration-300",
              collapsed ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
      </div>

      <nav className="mt-5 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group relative flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm transition-all duration-200",
                active
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "text-slate-600 hover:border-sky-100 hover:bg-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={clsx(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-500 transition group-hover:bg-sky-100",
                  active && "bg-white/20 text-white group-hover:bg-white/30"
                )}
              >
                <item.Icon className="h-4 w-4" />
              </span>
              {!collapsed && (
                <span className="flex-1">
                  <span className="block font-medium leading-tight">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500 transition group-hover:text-slate-600">
                    {item.description}
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-5 text-slate-800 shadow-sm">
          <p className="text-sm font-semibold leading-tight">Nouveau projet</p>
          <p className="mt-1 text-xs text-slate-600">
            Structurez vos idees et accedez a toutes les ressources partagees.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
          >
            Commencer
          </Link>
        </div>
      )}

      <div className="mt-auto pt-4 text-xs text-slate-500">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span>Version 1.0.0</span>
            <Link
              href="/help"
              className="font-medium text-sky-600 transition hover:text-sky-700"
            >
              Support
            </Link>
          </div>
        ) : (
          <span className="block text-center text-[11px] text-slate-400">v1.0</span>
        )}
      </div>
    </aside>
  );
}

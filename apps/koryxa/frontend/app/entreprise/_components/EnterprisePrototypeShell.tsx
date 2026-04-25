import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

type EnterprisePrototypeShellProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName: string;
  iconTileClassName: string;
  maxWidth?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function EnterprisePrototypeShell(props: EnterprisePrototypeShellProps) {
  const {
    title,
    subtitle,
    icon: Icon,
    iconClassName,
    iconTileClassName,
    maxWidth = "max-w-7xl",
    actions,
    children,
  } = props;

  return (
    <main className={clsx("mx-auto space-y-6 px-1 py-2 sm:px-2", maxWidth)}>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/entreprise" className="transition-colors hover:text-slate-900">
          Entreprise
        </Link>
        <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
        <span className="font-medium text-slate-900">{title}</span>
      </nav>

      {/* Page header */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white px-6 py-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-6">
        <div className="flex items-center gap-4">
          <div className={clsx("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[16px]", iconTileClassName)}>
            <Icon className={clsx("h-6 w-6", iconClassName)} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">{title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      {children}

      {/* Back link */}
      <div className="pt-2 pb-4">
        <Link
          href="/entreprise"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux services
        </Link>
      </div>
    </main>
  );
}

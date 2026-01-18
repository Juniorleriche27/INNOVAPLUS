import type { ReactNode } from "react";

type Variant = "info" | "warning" | "tip";

const VARIANT_STYLES: Record<
  Variant,
  { wrap: string; title: string; icon: string }
> = {
  info: {
    wrap: "border-sky-200 bg-sky-50 text-slate-800",
    title: "text-sky-900",
    icon: "bg-sky-600",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-slate-800",
    title: "text-amber-900",
    icon: "bg-amber-600",
  },
  tip: {
    wrap: "border-emerald-200 bg-emerald-50 text-slate-800",
    title: "text-emerald-900",
    icon: "bg-emerald-600",
  },
};

export default function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}) {
  const styles = VARIANT_STYLES[variant];
  return (
    <div className={`not-prose my-6 rounded-2xl border px-4 py-3 ${styles.wrap}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${styles.icon}`} aria-hidden="true" />
        <div className="min-w-0">
          {title ? <p className={`text-sm font-semibold ${styles.title}`}>{title}</p> : null}
          <div className="mt-1 text-sm leading-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function CalloutInfo({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Callout variant="info" title={title}>
      {children}
    </Callout>
  );
}

export function CalloutWarning({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Callout variant="warning" title={title}>
      {children}
    </Callout>
  );
}

export function CalloutTip({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Callout variant="tip" title={title}>
      {children}
    </Callout>
  );
}


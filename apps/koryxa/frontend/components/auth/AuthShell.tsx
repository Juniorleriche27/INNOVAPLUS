"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  helperTitle: string;
  helperBody: string;
  helperPoints: string[];
  footerText: string;
  footerHref: string;
  footerLabel: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  helperTitle,
  helperBody,
  helperPoints,
  footerText,
  footerHref,
  footerLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-[calc(100vh-88px)] overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.12),transparent_32%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/92 shadow-[0_32px_90px_rgba(15,23,42,0.10)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(155deg,#0f172a_0%,#0f3b67_45%,#0284c7_100%)] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_30%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              {eyebrow}
            </div>
            <h1 className="mt-6 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-sky-50/88 sm:text-base">{subtitle}</p>

            <div className="mt-10 rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/80">Pourquoi ce parcours</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">{helperTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-sky-50/82">{helperBody}</p>
              <div className="mt-6 space-y-3">
                {helperPoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-2xl border border-white/12 bg-slate-950/18 px-4 py-3 text-sm text-sky-50/90"
                  >
                    <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-200" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-xl">{children}</div>
          <p className="mt-8 text-sm text-slate-500">
            {footerText}{" "}
            <Link href={footerHref} className="font-semibold text-sky-700 transition hover:text-sky-900 hover:underline">
              {footerLabel}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

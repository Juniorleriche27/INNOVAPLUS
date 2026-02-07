"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
  onClose: () => void;
};

export default function PaywallModal({
  open,
  title = "Fonctionnalité Pro (bêta)",
  message,
  ctaHref = "/myplanning/pricing?upgrade=pro",
  ctaLabel = "Voir l’offre Pro",
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">MyPlanning</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">{title}</h3>
        <p className="mt-3 text-sm text-slate-700">{message}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={ctaHref}
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            {ctaLabel}
          </Link>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

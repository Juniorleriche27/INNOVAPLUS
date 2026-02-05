import type { ReactNode } from "react";

export default function VideoCard({
  title,
  language,
  durationLabel,
  themeLabel,
  descriptionShort,
  footer,
}: {
  title: string;
  language: "FR" | "EN";
  durationLabel: string;
  themeLabel: string;
  descriptionShort: string;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {language}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-slate-200 px-2 py-1">{durationLabel}</span>
        <span className="rounded-full border border-slate-200 px-2 py-1">{themeLabel}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{descriptionShort}</p>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );
}


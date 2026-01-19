export default function ArticleRow({
  title,
  source,
  language,
  readingTimeLabel,
  themeLabel,
  descriptionShort,
  href,
}: {
  title: string;
  source: string;
  language: "FR" | "EN";
  readingTimeLabel: string;
  themeLabel: string;
  descriptionShort: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{source}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {language}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Ouvrir
          </a>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-slate-200 px-2 py-1">{readingTimeLabel}</span>
        <span className="rounded-full border border-slate-200 px-2 py-1">{themeLabel}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{descriptionShort}</p>
    </div>
  );
}


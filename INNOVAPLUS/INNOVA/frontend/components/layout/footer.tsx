// innova-frontend/components/layout/footer.tsx
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold uppercase tracking-wide text-white">
            IN
          </span>
          <div className="leading-tight">
            <p className="font-semibold text-slate-800">INNOVA+</p>
            <p className="text-xs text-slate-500">
              INNOVA+ \u2014 Moteur IA d\u2019opportunit\u00E9s. Transparence \u00B7 \u00C9quit\u00E9 \u00B7 Impact.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 sm:text-sm">
          <Link href="/privacy" className="transition hover:text-sky-600">
            Confidentialit\u00E9
          </Link>
          <Link href="/terms" className="transition hover:text-sky-600">
            Mentions l\u00E9gales
          </Link>
          <span className="text-slate-400">v1.0.0</span>
        </div>

        <p className="text-xs text-slate-400 sm:text-sm">
          Copyright {year} INNOVA+. Tous droits r\u00E9serv\u00E9s.
        </p>
      </div>
    </footer>
  );
}

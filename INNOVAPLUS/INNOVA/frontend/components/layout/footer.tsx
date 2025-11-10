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
            <p className="font-semibold text-slate-800">KORYXA</p>
            <p className="text-xs text-slate-500">
              KORYXA — Moteur IA d’opportunités. Transparence · Équité · Impact.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 sm:text-sm">
          <Link href="/privacy" className="transition hover:text-sky-600">
            Confidentialité
          </Link>
          <Link href="/terms" className="transition hover:text-sky-600">
            Mentions légales
          </Link>
          <span className="text-slate-400">v1.0.0</span>
        </div>

        <p className="text-xs text-slate-400 sm:text-sm">
          Copyright {year} KORYXA. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}

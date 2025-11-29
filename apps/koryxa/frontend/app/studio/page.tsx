export default function StudioPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">CHATLAYA Studio</p>
        <h1 className="text-3xl font-semibold text-slate-900">Rédaction & Opportunités</h1>
        <p className="text-sm text-slate-600">
          Assistant de rédaction, missions contenu et académie rédacteur web IA, alimentés par CHATLAYA.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <a
          href="/studio/assistant"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Assistant</p>
          <h2 className="text-lg font-semibold text-slate-900">Rédaction assistée</h2>
          <p className="text-sm text-slate-600 mt-2">Créer un brief, générer plan + texte + titres + mots-clés avec CHATLAYA.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
            Ouvrir →
          </span>
        </a>
        <a
          href="/studio/missions"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Missions</p>
          <h2 className="text-lg font-semibold text-slate-900">Studio de missions</h2>
          <p className="text-sm text-slate-600 mt-2">Publier des missions, les prendre en charge, livrer et valider.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
            Ouvrir →
          </span>
        </a>
        <a
          href="/studio/academy"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Académie</p>
          <h2 className="text-lg font-semibold text-slate-900">Parcours rédacteur IA</h2>
          <p className="text-sm text-slate-600 mt-2">Modules de formation, suivi de progression et certification interne.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
            Ouvrir →
          </span>
        </a>
      </div>
    </div>
  );
}

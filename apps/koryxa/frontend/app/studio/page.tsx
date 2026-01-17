import Link from "next/link";

const fakeStats = {
  missionsOpen: 0,
  certified: 0,
  nextStep: "Commencer par la rédaction assistée",
};

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">CHATLAYA Studio</p>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">CHATLAYA Studio</h1>
          <p className="text-sm text-slate-600">
            Crée du contenu, décroche des missions et progresse comme rédacteur IA, au même endroit.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Missions ouvertes</p>
            <p className="text-xl font-semibold text-slate-900">{fakeStats.missionsOpen}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Rédacteurs certifiés</p>
            <p className="text-xl font-semibold text-slate-900">{fakeStats.certified}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Ton prochain pas</p>
            <p className="text-sm font-semibold text-slate-800">{fakeStats.nextStep}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/studio/assistant"
          className="md:col-span-1 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-5 shadow-md hover:-translate-y-1 hover:shadow-lg transition"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-sky-600">Assistant</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">Rédaction assistée</h2>
          <p className="text-sm text-slate-700 mt-2">
            Décris ton besoin, laisse CHATLAYA proposer un plan, un texte et des titres. Tu ajustes, tu valides, tu exportes.
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700">
              Commencer →
            </span>
          </div>
        </Link>
        <Link
          href="/studio/missions"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Missions</p>
          <h2 className="text-lg font-semibold text-slate-900">Studio de missions</h2>
          <p className="text-sm text-slate-700 mt-2">
            Les clients publient leurs besoins en contenu. Les rédacteurs les prennent, livrent et se font rémunérer.
          </p>
          <p className="mt-3 text-xs text-slate-500">{fakeStats.missionsOpen} mission(s) disponible(s)</p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
              Voir les missions →
            </span>
          </div>
        </Link>
        <Link
          href="/studio/academy"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
        >
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Académie</p>
          <h2 className="text-lg font-semibold text-slate-900">Parcours rédacteur IA</h2>
          <p className="text-sm text-slate-700 mt-2">
            Apprends la rédaction web, le SEO et l’usage de CHATLAYA. Valide les modules et deviens rédacteur certifié KORYXA.
          </p>
          <p className="mt-3 text-xs text-slate-500">Progression : à venir</p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700">
              Voir le parcours →
            </span>
          </div>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { title: "Produire vite du contenu pro", desc: "Plans, textes et titres générés en contexte avec CHATLAYA." },
          { title: "Transformer les besoins en missions", desc: "Publier, prendre, livrer. Statuts simples et livraisons versionnées." },
          { title: "Former les jeunes à l’IA", desc: "Parcours rédacteur web IA, modules et progression suivie." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="text-sm text-slate-600 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

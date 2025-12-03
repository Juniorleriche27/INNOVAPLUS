export default function StudioMissionsPage() {
  const [tab, setTab] = useState<"client" | "redacteur">("client");
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-sky-50/30 to-white px-4 py-8 sm:px-6 lg:px-10 space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CHATLAYA Studio</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Studio de missions</h1>
            <p className="text-sm text-slate-600">
              Publie des missions de contenu, laisse les rédacteurs les prendre en charge, livrer et faire valider.
            </p>
          </div>
        </div>

        <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-700 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("client")}
            className={`px-4 py-2 rounded-full transition ${
              tab === "client" ? "bg-white shadow text-slate-900" : "text-slate-600"
            }`}
          >
            Côté client
          </button>
          <button
            type="button"
            onClick={() => setTab("redacteur")}
            className={`px-4 py-2 rounded-full transition ${
              tab === "redacteur" ? "bg-white shadow text-slate-900" : "text-slate-600"
            }`}
          >
            Côté rédacteur
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur">
        {tab === "client" ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => alert("La création de mission sera bientôt disponible.")}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 transition"
            >
              Créer une mission
            </button>
            <p className="text-sm text-slate-600">
              Tu n&apos;as encore publié aucune mission. La liste de tes missions apparaîtra ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Les missions disponibles pour les rédacteurs apparaîtront ici.</p>
            <p className="text-sm text-slate-500">
              Commence par compléter ton profil et suivre le parcours rédacteur IA pour accéder aux missions réservées.
            </p>
          </div>
        )}
      </div>

      <a href="/studio" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
        ← Retour à CHATLAYA Studio
      </a>
    </div>
  );
}

export default function PlatformProfilPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <button type="button" className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">Modifier</button>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">AM</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Amara Mensah</h2>
            <p className="mt-2 text-lg font-semibold text-sky-600">Data Analyst</p>
            <p className="mt-4 text-sm text-slate-500">Dakar, Sénégal • amara.mensah@email.com • +221 77 123 45 67</p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">Profil vérifié</span>
        </div>
      </section>
    </div>
  );
}

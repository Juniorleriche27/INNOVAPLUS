export default function PlatformOpportunitesPage() {
  const opportunities = [
    { id: "1", title: "Analyste Data Junior", company: "Tech Startup Dakar", location: "Dakar, Sénégal", type: "CDI", fit: 92 },
    { id: "2", title: "Stage Data Analysis", company: "Entreprise IA Abidjan", location: "Abidjan, Côte d'Ivoire", type: "Stage", fit: 85 },
    { id: "3", title: "Data Engineer", company: "Fintech Lagos", location: "Lagos, Nigeria", type: "CDI", fit: 65 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Opportunités</h1>
        <p className="mt-2 text-slate-500">Missions et offres adaptées à votre profil</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {opportunities.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.company}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Actif</span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-500">
              <p>{item.location}</p>
              <p>{item.type}</p>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="mb-2 flex justify-between text-sm"><span>Adéquation</span><span className="font-semibold">{item.fit}%</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-sky-600" style={{ width: `${item.fit}%` }} /></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

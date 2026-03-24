import Link from "next/link";

export default function PlatformMissionsPage() {
  const missions = [
    { id: "1", title: "Dashboard Analytics E-commerce", client: "Boutique en ligne XYZ", type: "Analytics & Visualisation", progress: 60 },
    { id: "2", title: "Modèle prédictif - Churn clients", client: "Entreprise Telecom ABC", type: "Machine Learning", progress: 25 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Missions</h1>
        <p className="mt-2 text-slate-500">Projets en cours et terminés</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {missions.map((mission) => (
          <Link key={mission.id} href={`/platform/missions/${mission.id}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <h3 className="text-lg font-semibold">{mission.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{mission.client}</p>
            <p className="mt-3 text-sm text-slate-500">{mission.type}</p>
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm"><span>Progression</span><span className="font-semibold">{mission.progress}%</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-sky-600" style={{ width: `${mission.progress}%` }} /></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

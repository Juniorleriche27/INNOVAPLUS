import Link from "next/link";

export default function PlatformFormateursPage() {
  const trainers = [
    { id: "1", name: "Amadou Diallo", trajectory: "Data Analyst", location: "Dakar, Sénégal", level: "Senior - 8 ans d'expérience", score: 98 },
    { id: "2", name: "Aïcha Traoré", trajectory: "Data Engineer", location: "Abidjan, Côte d'Ivoire", level: "Expert - 10 ans d'expérience", score: 96 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Formateurs partenaires</h1>
        <p className="mt-2 text-slate-500">Experts qui supervisent les trajectoires et valident les progressions</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {trainers.map((trainer) => (
          <Link key={trainer.id} href={`/platform/formateurs/${trainer.id}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
            <h3 className="text-lg font-semibold">{trainer.name}</h3>
            <p className="mt-1 text-sm font-medium text-sky-600">{trainer.trajectory}</p>
            <div className="mt-3 space-y-1.5 text-sm text-slate-500">
              <p>{trainer.location}</p>
              <p>{trainer.level}</p>
            </div>
            <p className="mt-4 text-sm font-semibold text-emerald-600">{trainer.score}/100</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PlatformParametresPage() {
  const settings = [
    "Recevoir les notifications email",
    "Rendre mon profil visible aux entreprises",
    "Autoriser les recommandations d'opportunités",
    "Partager mes preuves avec mon formateur",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="mt-2 text-slate-500">Gérez vos préférences, votre visibilité et vos notifications</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {settings.map((item) => (
            <div key={item} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4">
              <p className="text-sm font-medium">{item}</p>
              <div className="h-6 w-11 rounded-full bg-sky-600" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

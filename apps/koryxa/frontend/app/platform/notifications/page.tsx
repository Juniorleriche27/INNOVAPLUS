export default function PlatformNotificationsPage() {
  const notifications = [
    "Un membre de votre communauté a commenté votre post",
    "Nouvelle opportunité recommandée pour votre profil",
    "Votre preuve de progression a été validée",
    "Message reçu de votre référent KORYXA",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-2 text-slate-500">Suivez les événements importants de votre parcours KORYXA</p>
      </div>
      <div className="space-y-3">
        {notifications.map((item) => (
          <article key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium">{item}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

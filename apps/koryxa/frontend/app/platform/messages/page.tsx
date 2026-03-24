export default function PlatformMessagesPage() {
  const conversations = [
    { name: "Référent KORYXA", role: "Accompagnement", lastMessage: "Votre prochaine étape de progression est prête.", time: "2h", unread: 2 },
    { name: "Communauté Trajectoire", role: "Groupe métier", lastMessage: "Nouveaux échanges disponibles dans votre groupe.", time: "1j", unread: 0 },
    { name: "KORYXA Support", role: "Équipe", lastMessage: "Comment pouvons-nous vous aider ?", time: "3j", unread: 0 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
        <input className="mb-4 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-sky-400" placeholder="Rechercher..." />
        <div className="space-y-2">
          {conversations.map((item) => (
            <div key={item.name} className="rounded-xl p-3 transition hover:bg-slate-50">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.lastMessage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{item.time}</p>
                  {item.unread ? <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">{item.unread}</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm lg:col-span-2">
        Sélectionnez une conversation pour commencer
      </section>
    </div>
  );
}

export default function PlatformCommunautePage() {
  const posts = [
    { author: "Membre trajectoire", role: "Analyse de données", content: "Je viens de terminer une première preuve sur un dashboard métier et je cherche des retours sur la structure des indicateurs.", meta: "Il y a 2h" },
    { author: "Membre communauté", role: "Data Engineering", content: "Question pour la communauté : quelle stack utilisez-vous pour industrialiser vos pipelines ETL en contexte africain ?", meta: "Il y a 4h" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communauté IA</h1>
          <p className="mt-2 text-slate-500">Échangez avec des professionnels de l'IA et de la data</p>
        </div>
        <button type="button" className="rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white">Nouveau post</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {posts.map((post) => (
            <article key={`${post.author}-${post.meta}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold">{post.author}</h3>
              <p className="text-sm text-slate-500">{post.role} • {post.meta}</p>
              <p className="mt-4 text-sm leading-7 text-slate-700">{post.content}</p>
            </article>
          ))}
        </div>
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold">Sujets tendances</h3>
            <div className="mt-4 space-y-3 text-sm">
              <p>Power BI vs Tableau</p>
              <p>ETL Best Practices</p>
              <p>Modèles prédictifs retail</p>
            </div>
          </article>
          <article className="rounded-2xl border border-sky-200 bg-sky-50 p-6">
            <h3 className="font-semibold text-sky-900">Règles de la communauté</h3>
            <div className="mt-4 space-y-2 text-sm text-sky-900">
              <p>Respectez les autres membres</p>
              <p>Partagez du contenu de qualité</p>
              <p>Pas de spam ou autopromotion excessive</p>
              <p>Échanges professionnels et constructifs</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

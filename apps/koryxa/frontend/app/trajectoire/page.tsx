import Link from "next/link";

const BENEFITS = [
  {
    title: "Trouver une direction claire",
    text: "KORYXA vous aide à identifier une trajectoire utile au lieu de vous laisser face à trop d'options.",
  },
  {
    title: "Savoir quoi faire ensuite",
    text: "Le diagnostic produit une première trajectoire, des actions concrètes et un point d'entrée clair dans le cockpit.",
  },
  {
    title: "Passer à des opportunités crédibles",
    text: "La progression, les preuves et la validation servent à ouvrir des opportunités plus cohérentes.",
  },
];

const HOW_IT_WORKS = [
  {
    title: "1. Répondre à quelques questions",
    text: "Un diagnostic court permet de comprendre votre point de départ sans vous imposer un long formulaire.",
  },
  {
    title: "2. Recevoir une trajectoire recommandée",
    text: "KORYXA génère un premier résultat lisible avec trajectoire, prochaines actions et recommandations utiles.",
  },
  {
    title: "3. Ouvrir son cockpit de progression",
    text: "Le détail de l'exécution, des preuves et des validations se pilote ensuite dans un cockpit KORYXA adossé à MyPlanningAI.",
  },
];

export default function TrajectoirePage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,247,255,0.95))] p-6 shadow-[0_20px_54px_rgba(15,23,42,0.07)] sm:p-8 lg:p-10">
          <div className="absolute inset-y-0 right-0 w-[36%] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_62%)]" aria-hidden />
          <div className="relative max-w-3xl space-y-6">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                Trajectoire
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                orientation • progression • opportunités
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-5xl">
                Trouvez la bonne trajectoire avant de vous disperser.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                KORYXA vous aide à clarifier votre point de départ, recommander une trajectoire utile et ouvrir ensuite
                un cockpit de progression plus structuré dans MyPlanningAI.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/trajectoire/demarrer" className="btn-primary w-full justify-center sm:w-auto">
                Commencer mon diagnostic
              </Link>
              <Link href="#comment-ca-marche" className="btn-secondary w-full justify-center sm:w-auto">
                Comprendre le fonctionnement
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {BENEFITS.map((item) => (
            <article
              key={item.title}
              className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
            >
              <p className="text-lg font-semibold text-slate-950">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section
          id="comment-ca-marche"
          className="rounded-[30px] border border-slate-200/80 bg-white/94 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Comment ça marche</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Une logique simple en trois temps
            </h2>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.94),rgba(255,255,255,0.98))] p-6"
              >
                <p className="text-lg font-semibold text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/trajectoire/demarrer" className="btn-primary w-full justify-center sm:w-auto">
              Commencer mon diagnostic
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="px-4 py-12 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">À propos</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">À propos de KORYXA</h1>
          <p className="mt-2 text-base text-slate-600">
            KORYXA est une plateforme d’intelligence artificielle dédiée à deux enjeux majeurs : réduire le chômage et aider
            les entreprises et startups à exploiter pleinement le potentiel de l’IA pour gagner en productivité.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Notre force : convertir rapidement un problème réel en mission IA/data exécutable, puis livrer un résultat
            structuré et validé.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">🎯 Notre mission</h2>
          <p className="mt-3 text-sm text-slate-600">
            Transformer les problèmes concrets de la société et des organisations en opportunités réelles, grâce à
            l’intelligence artificielle, aux compétences humaines et à un cadre d’exécution rigoureux.
          </p>
          <p className="mt-3 text-sm text-slate-600">KORYXA agit simultanément sur :</p>
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
            <li>l’emploi, en créant des missions à partir de besoins réels,</li>
            <li>la performance des entreprises, en rendant l’IA et la data réellement utilisables.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">⚙️ Ce que fait KORYXA concrètement</h2>
          <p className="mt-3 text-sm text-slate-600">KORYXA relie trois éléments clés :</p>
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
            <li>Des entreprises et startups qui ont des besoins en data, automatisation et IA,</li>
            <li>Des apprenants qui se forment aux métiers de la data et de l’IA en travaillant sur ces besoins,</li>
            <li>Une équipe KORYXA qui structure les missions, encadre l’exécution et valide les livrables.</li>
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            👉 Résultat : des livrables exploitables pour les organisations et des compétences réelles pour les apprenants.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">🤖 Pourquoi l’IA est au cœur de KORYXA</h2>
          <p className="mt-3 text-sm text-slate-600">
            L’intelligence artificielle n’est pas un slogan chez KORYXA. Elle est utilisée pour :
          </p>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>Transformer un besoin flou en mission claire (cadrage intelligent),</li>
            <li>Accélérer la production (outils IA, assistants, automatisations),</li>
            <li>Standardiser la qualité des livrables (cadres, contrôles, validation),</li>
            <li>Réduire les inégalités d’accès aux opportunités, via des règles d’équité explicites.</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600">
            L’IA est ici un outil de structuration, d’accélération et de justice, pas une promesse magique.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">🚀 Ce qui rend KORYXA différent (notre puissance)</h2>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>Formation orientée production → On apprend en produisant sur des cas réels, pas sur des exercices fictifs.</li>
            <li>Accompagnement IA côté entreprise → Nous aidons les organisations à intégrer l’IA et la data dans leurs processus concrets.</li>
            <li>Validation des résultats → KORYXA ne certifie pas une présence, mais des livrables et des preuves de travail.</li>
            <li>Vision systémique emploi + productivité → Chaque besoin peut devenir une mission, chaque mission une compétence, chaque compétence une opportunité.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">❌ Ce que KORYXA n’est pas</h2>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>Ce n’est pas un site d’offres d’emploi classique.</li>
            <li>Ce n’est pas une promesse d’embauche automatique.</li>
            <li>Ce n’est pas de “l’IA magique” sans données ni méthode.</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">🌍 Nos principes</h2>
          <ul className="mt-4 list-disc pl-5 text-sm text-slate-600">
            <li>Intelligence artificielle utile</li>
            <li>Transparence</li>
            <li>Équité</li>
            <li>Impact réel</li>
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">👉 Appels à l’action</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/school" className="btn-primary">
              Découvrir KORYXA School
            </Link>
            <Link href="/entreprise" className="btn-secondary">
              Devenir entreprise partenaire
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

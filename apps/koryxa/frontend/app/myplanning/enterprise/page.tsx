import Link from "next/link";
import { EnterpriseLeadForm } from "./_components/EnterpriseLeadForm";

const USE_CASES = [
  "Pilotage multi-projets pour directions opérationnelles",
  "Suivi des risques (présence, progression, coûts) avec alertes",
  "Reporting portefeuille pour comité de direction",
];

const OFFER_ITEMS = [
  "Rapports IA projet + portefeuille (données mart)",
  "Tableaux de bord consolidés par secteur/pays/entreprise",
  "Gouvernance: rôles, traçabilité, journal d’actions",
  "Accompagnement déploiement et support prioritaire",
];

const FLOW = [
  "Cadrage: objectifs, périmètre, indicateurs décisionnels",
  "Intégration: connexion des données et configuration des vues",
  "Go-live: formation des équipes + suivi des usages",
];

const FAQ = [
  {
    q: "Où sont stockées les données ?",
    a: "Les données restent dans votre socle (Supabase/Postgres) et sont exposées via des vues mart contrôlées.",
  },
  {
    q: "Le prix est-il fixe ?",
    a: "Le plan Entreprise est sur devis selon le volume, le niveau de service et les besoins d’intégration.",
  },
  {
    q: "L’IA invente-t-elle des résultats ?",
    a: "Non. Les rapports sont contraints par les données injectées et signalent 'non disponible' quand une information manque.",
  },
];

export default function MyPlanningEnterprisePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Entreprise</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Pilotage portefeuille + reporting IA</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Passez d’un suivi artisanal à un pilotage structuré: visibilité en temps réel, alertes exploitables,
          décisions plus rapides.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#enterprise-lead-form"
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Demander une démo
          </a>
          <Link
            href="/myplanning/pricing"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retour aux tarifs
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cas d’usage</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {USE_CASES.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-sky-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ce que vous obtenez</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {OFFER_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Comment ça marche</h2>
          <ol className="mt-4 space-y-2 text-sm text-slate-700">
            {FLOW.map((item, idx) => (
              <li key={item} className="flex items-start gap-3">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="enterprise-lead-form" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Parlez-nous de votre besoin</h2>
        <p className="mt-2 text-sm text-slate-700">
          Nous revenons vers vous avec une proposition adaptée à votre contexte et vos objectifs.
        </p>
        <div className="mt-6">
          <EnterpriseLeadForm />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">FAQ</h2>
        <div className="mt-4 space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{item.q}</p>
              <p className="mt-2 text-sm text-slate-700">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
        <h2 className="text-2xl font-semibold">Prêt à structurer le pilotage de vos projets ?</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Activez une base de reporting fiable et des recommandations actionnables pour vos équipes.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="#enterprise-lead-form"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Demander une démo
          </a>
          <a
            href="mailto:hello@innova.plus?subject=Demande%20de%20demo%20MyPlanningAI%20Entreprise"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Email direct
          </a>
        </div>
      </section>
    </div>
  );
}

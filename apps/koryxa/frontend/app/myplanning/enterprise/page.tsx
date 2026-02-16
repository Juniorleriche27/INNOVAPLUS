import Link from "next/link";
import { EnterpriseLeadForm } from "./_components/EnterpriseLeadForm";

const USE_CASES = [
  "Pilotage multi-projets pour directions opérationnelles (portefeuille unifié)",
  "Suivi des risques (présence, progression, coûts) avec alertes actionnables",
  "Gouvernance: rôles, traçabilité, intégrations et reporting comité de direction",
];

const OFFER_ITEMS = [
  "Rapports IA projet + portefeuille (données mart)",
  "Tableaux de bord consolidés par secteur/pays/entreprise",
  "Organisation complète: plusieurs espaces, départements, managers",
  "Intégrations n8n (Notion, Google Calendar, Slack, Webhooks)",
];

const FLOW = [
  "Voir la démo interactive (sans login)",
  "Activer votre organisation (onboarding guidé)",
  "Connecter les intégrations et lancer la présence + reporting",
];

const FAQ = [
  {
    q: "Quelle différence entre Espaces et Entreprise ?",
    a: "Espaces = collaboration d’équipe (workspace). Entreprise = organisation complète: gouvernance, multi-espaces, reporting portefeuille et intégrations.",
  },
  {
    q: "Faut-il connecter toutes les données dès le début ?",
    a: "Non. Vous pouvez démarrer avec un workspace et un flux n8n, puis étendre progressivement.",
  },
  {
    q: "Le plan Entreprise est-il immédiat ?",
    a: "Oui, le parcours d’activation est disponible: création d’organisation, premier espace, présence et intégrations.",
  },
];

export default function MyPlanningEnterprisePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI Entreprise</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Organisation complète + gouvernance + reporting IA</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-700">
          Entreprise n’est pas un simple workspace: c’est la couche au-dessus des Espaces, avec pilotage portefeuille,
          présence, alertes et intégrations n8n.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/myplanning/enterprise/onboarding"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Créer mon organisation
          </Link>
          <Link
            href="/myplanning/enterprise/demo"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voir démo
          </Link>
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
        <div id="enterprise-how" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
        <h2 className="text-2xl font-semibold text-slate-900">Activer sur vos données</h2>
        <p className="mt-2 text-sm text-slate-700">
          Lancez un pilote sur vos données réelles (organisation, espaces, présence, reporting, intégrations).
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
        <h2 className="text-2xl font-semibold">Prêt à activer Entreprise dans votre organisation ?</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Démarrez par la démo interactive, puis activez votre onboarding pour connecter vos équipes et vos flux.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/myplanning/enterprise/onboarding"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Créer mon organisation
          </Link>
          <Link
            href="/myplanning/enterprise/demo"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Voir démo
          </Link>
          <a
            href="#enterprise-lead-form"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
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

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BillingMode = "monthly" | "yearly";
type TierCta = { label: string; href: string; variant?: "primary" | "secondary" };

type Tier = {
  name: string;
  monthly: string;
  yearly: string;
  desc: string;
  audience: string;
  items: string[];
  ctas: TierCta[];
  highlight?: boolean;
  badge?: string;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    monthly: "0",
    yearly: "0",
    desc: "Pour démarrer et structurer ta journée.",
    audience: "Pour qui ? Solo, étudiant, indépendant.",
    items: ["Tâches + Kanban", "Vue jour/semaine", "Priorités (Eisenhower)", "Export basique"],
    ctas: [{ label: "Commencer", href: "/myplanning/app", variant: "secondary" }],
  },
  {
    name: "Pro",
    monthly: "Bêta",
    yearly: "Bêta",
    desc: "Pour mesurer, décider et progresser.",
    audience: "Pour qui ? Utilisateurs qui pilotent leur performance.",
    items: ["Stats & graphiques (30/90j)", "Templates universels", "Alertes email (rappels)", "Coaching IA"],
    ctas: [{ label: "Activer Pro", href: "/myplanning/pro", variant: "primary" }],
    highlight: true,
    badge: "Recommandé",
  },
  {
    name: "Espaces",
    monthly: "Bêta",
    yearly: "Bêta",
    desc: "Pour équipes et organisations.",
    audience: "Pour qui ? Managers et équipes opérationnelles.",
    items: ["Collaborateurs + rôles", "Assignation & suivi", "Reporting équipe", "Présence (QR dynamique) + export CSV"],
    ctas: [{ label: "Créer un espace", href: "/myplanning/team", variant: "secondary" }],
  },
  {
    name: "Enterprise",
    monthly: "Sur devis",
    yearly: "Sur devis",
    desc: "Pour piloter une organisation complète.",
    audience: "Pour qui ? Directions RH, Ops, PMO et DSI.",
    items: [
      "Multi-workspaces (orgs) + départements",
      "Intégrations (n8n / webhooks)",
      "Gouvernance (RBAC + audit)",
      "Reporting + alertes + SLA",
    ],
    ctas: [{ label: "Demander une démo", href: "/myplanning/enterprise", variant: "primary" }],
  },
];

type CompareRow = { feature: string; free: boolean; pro: boolean; espaces: boolean; enterprise: boolean };
const COMPARE_ROWS: CompareRow[] = [
  { feature: "Tâches + Kanban", free: true, pro: true, espaces: true, enterprise: true },
  { feature: "Stats & graphiques", free: false, pro: true, espaces: true, enterprise: true },
  { feature: "Alertes email", free: false, pro: true, espaces: true, enterprise: true },
  { feature: "Collaborateurs + rôles", free: false, pro: false, espaces: true, enterprise: true },
  { feature: "Présence QR + export CSV", free: false, pro: false, espaces: true, enterprise: true },
  { feature: "Intégrations n8n / webhooks", free: false, pro: false, espaces: false, enterprise: true },
  { feature: "Multi-workspaces (orgs)", free: false, pro: false, espaces: false, enterprise: true },
  { feature: "Gouvernance (RBAC + audit)", free: false, pro: false, espaces: false, enterprise: true },
];

const FAQ = [
  {
    q: "Quand la facturation sera activée ?",
    a: "Free est disponible immédiatement. Pro, Espaces et Enterprise sont déployés progressivement.",
  },
  {
    q: "Mes données restent-elles privées ?",
    a: "Oui. Les accès sont contrôlés par rôles et les endpoints sensibles sont protégés côté backend.",
  },
  {
    q: "Peut-on changer de plan facilement ?",
    a: "Oui. Le changement de plan se fait sans verrouillage technique du compte.",
  },
  {
    q: "Quel support pour Enterprise ?",
    a: "Enterprise inclut accompagnement de déploiement, SLA et support prioritaire.",
  },
];

export default function MyPlanningPricingPage() {
  const [billing, setBilling] = useState<BillingMode>("monthly");
  const [search, setSearch] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setSearch(window.location.search || "");
  }, []);
  const searchParams = useMemo(() => new URLSearchParams(search.startsWith("?") ? search.slice(1) : search), [search]);
  const upgradeMessage = useMemo(() => {
    const custom = searchParams.get("message");
    if (custom) return custom;
    return searchParams.get("upgrade") === "pro" ? "Fonctionnalité Pro : débloque le pilotage avancé." : "";
  }, [searchParams]);
  const feature = searchParams.get("feature") || "";

  return (
    <div className="w-full space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MyPlanningAI</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Tarifs</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">Commence gratuitement, puis active Pro, Espaces ou Enterprise selon ton niveau de pilotage.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={billing === "monthly" ? "rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white" : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={billing === "yearly" ? "rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white" : "rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"}
            >
              Annuel
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">En 7 jours tu obtiens</p>
        <p className="mt-2 text-sm text-emerald-900">Un planning stabilisé, des priorités visibles, un suivi de progression et des automatisations prêtes à déployer.</p>
      </section>

      {upgradeMessage ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">{upgradeMessage}</p>
          {feature ? <p className="mt-1 text-amber-800">Fonction demandée : {feature}</p> : null}
        </section>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            className={
              tier.highlight
                ? "relative rounded-3xl border border-sky-300 bg-white p-8 shadow-xl shadow-sky-200/50 md:scale-[1.02]"
                : "relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            }
          >
            {tier.badge ? (
              <span className="absolute right-4 top-4 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-sky-800">
                {tier.badge}
              </span>
            ) : null}
            <p className="text-sm font-semibold text-slate-900">{tier.name}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{billing === "monthly" ? tier.monthly : tier.yearly}</p>
            <p className="mt-3 text-sm font-medium text-slate-700">{tier.desc}</p>
            <p className="mt-2 text-xs text-slate-500">{tier.audience}</p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {tier.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              {tier.ctas.map((cta) => (
                <Link
                  key={`${tier.name}-${cta.label}`}
                  href={cta.href}
                  className={
                    cta.variant === "primary"
                      ? "inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                      : "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  }
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Comparatif</h2>
        <div className="mt-4 overflow-auto rounded-2xl border border-slate-200">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                <th className="px-4 py-3">Fonctionnalité</th>
                <th className="px-4 py-3">Free</th>
                <th className="px-4 py-3">Pro</th>
                <th className="px-4 py-3">Espaces</th>
                <th className="px-4 py-3">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.feature} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.feature}</td>
                  <td className="px-4 py-3 text-slate-700">{row.free ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.pro ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.espaces ? "✓" : "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{row.enterprise ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-slate-900">FAQ</h2>
        <div className="mt-4 space-y-4">
          {FAQ.map((item) => (
            <article key={item.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">{item.q}</h3>
              <p className="mt-2 text-sm text-slate-700">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

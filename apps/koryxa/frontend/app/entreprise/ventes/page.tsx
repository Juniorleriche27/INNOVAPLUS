import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, TrendingUp, Target, BarChart2, Plus, Info } from "lucide-react";
import EnterprisePrototypeShell from "../_components/EnterprisePrototypeShell";

export const metadata: Metadata = {
  title: "Ventes | KORYXA",
  description: "Votre pipeline commercial — suivez vos prospects, devis et contrats en cours.",
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Opportunity = {
  id: string;
  title: string;
  company?: string | null;
  contact?: string | null;
  value?: number | null;
  currency?: string | null;
  stage?: string | null;
  probability?: number | null;
  close_date?: string | null;
  priority?: string | null;
  status?: string | null;
};

type SalesStage = "Qualification" | "Proposition" | "Negociation" | "Gagne" | "Perdu";

type SalesRow = {
  id: string;
  title: string;
  company: string;
  contact: string;
  value: number | null;
  currency: string;
  stage: SalesStage;
  probability: number;
  closeDate: string | null;
  closeDateLabel: string;
  priority: "high" | "medium" | "low";
};

const STAGES: Array<{
  key: Extract<SalesStage, "Qualification" | "Proposition" | "Negociation" | "Gagne">;
  label: string;
  colorClassName: string;
  barClassName: string;
  dotClassName: string;
}> = [
  {
    key: "Qualification",
    label: "Qualification",
    colorClassName: "border-slate-200 bg-slate-50",
    barClassName: "bg-slate-400",
    dotClassName: "bg-slate-400",
  },
  {
    key: "Proposition",
    label: "Proposition",
    colorClassName: "border-blue-100 bg-blue-50",
    barClassName: "bg-blue-500",
    dotClassName: "bg-blue-500",
  },
  {
    key: "Negociation",
    label: "Négociation",
    colorClassName: "border-violet-100 bg-violet-50",
    barClassName: "bg-violet-500",
    dotClassName: "bg-violet-500",
  },
  {
    key: "Gagne",
    label: "Gagné",
    colorClassName: "border-emerald-100 bg-emerald-50",
    barClassName: "bg-emerald-500",
    dotClassName: "bg-emerald-500",
  },
];

function normalizeStage(opportunity: Opportunity): SalesStage {
  const rawStage = (opportunity.stage || "").trim().toLowerCase();
  if (rawStage.includes("propos")) return "Proposition";
  if (rawStage.includes("nego")) return "Negociation";
  if (rawStage.includes("gagn") || rawStage.includes("won")) return "Gagne";
  if (rawStage.includes("perd") || rawStage.includes("lost")) return "Perdu";
  if (rawStage.includes("qualif")) return "Qualification";
  if (opportunity.status === "closed") return "Gagne";
  return "Qualification";
}

function normalizeProbability(opportunity: Opportunity, stage: SalesStage): number {
  if (typeof opportunity.probability === "number" && Number.isFinite(opportunity.probability)) {
    return Math.max(0, Math.min(100, Math.round(opportunity.probability)));
  }
  switch (stage) {
    case "Proposition": return 60;
    case "Negociation": return 80;
    case "Gagne": return 100;
    case "Perdu": return 0;
    default: return 35;
  }
}

function normalizePriority(opportunity: Opportunity, probability: number): "high" | "medium" | "low" {
  const rawPriority = (opportunity.priority || "").trim().toLowerCase();
  if (rawPriority === "high") return "high";
  if (rawPriority === "medium") return "medium";
  if (rawPriority === "low") return "low";
  if (probability >= 70) return "high";
  if (probability >= 45) return "medium";
  return "low";
}

function normalizeContact(opportunity: Opportunity): string {
  if (opportunity.contact?.trim()) return opportunity.contact.trim();
  return "—";
}

function normalizeCloseDate(opportunity: Opportunity): { value: string | null; label: string } {
  const rawDate = (opportunity.close_date || "").trim();
  if (!rawDate) return { value: null, label: "—" };
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return { value: rawDate, label: rawDate };
  return {
    value: parsed.toISOString(),
    label: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(parsed),
  };
}

function formatMoney(value: number | null, currency: string, compact = false): string {
  if (value === null) return "—";
  const curr = currency || "XOF";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: curr,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(value);
}

function stageBadgeClass(stage: SalesStage) {
  switch (stage) {
    case "Proposition": return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Negociation": return "bg-violet-100 text-violet-700 border border-violet-200";
    case "Gagne": return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Perdu": return "bg-rose-100 text-rose-700 border border-rose-200";
    default: return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

function priorityDotClass(priority: SalesRow["priority"]) {
  switch (priority) {
    case "high": return "bg-rose-500";
    case "medium": return "bg-amber-500";
    default: return "bg-slate-300";
  }
}

function toSalesRow(opportunity: Opportunity): SalesRow {
  const stage = normalizeStage(opportunity);
  const probability = normalizeProbability(opportunity, stage);
  const priority = normalizePriority(opportunity, probability);
  const closeDate = normalizeCloseDate(opportunity);

  return {
    id: opportunity.id,
    title: opportunity.title,
    company: opportunity.company?.trim() || opportunity.title,
    contact: normalizeContact(opportunity),
    value: typeof opportunity.value === "number" && Number.isFinite(opportunity.value) ? opportunity.value : null,
    currency: opportunity.currency || "XOF",
    stage,
    probability,
    closeDate: closeDate.value,
    closeDateLabel: closeDate.label,
    priority,
  };
}

function sortRows(items: SalesRow[]): SalesRow[] {
  return [...items].sort((a, b) => {
    const priorityRank = { high: 3, medium: 2, low: 1 };
    const priorityGap = priorityRank[b.priority] - priorityRank[a.priority];
    if (priorityGap !== 0) return priorityGap;
    if (a.closeDate && b.closeDate) {
      const dateGap = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
      if (dateGap !== 0) return dateGap;
    }
    if (a.closeDate && !b.closeDate) return -1;
    if (!a.closeDate && b.closeDate) return 1;
    return (b.value || 0) - (a.value || 0);
  });
}

export default async function EntrepriseVentesPage() {
  const opportunities: any[] = []; // Opportunities module removed
  const rows = sortRows(opportunities.map(toSalesRow));
  const activeRows = rows.filter((item) => item.stage !== "Gagne" && item.stage !== "Perdu");
  const wonRows = rows.filter((item) => item.stage === "Gagne");
  const valuedActiveRows = activeRows.filter((item) => item.value !== null);
  const pipelineTotal = valuedActiveRows.reduce((sum, item) => sum + (item.value || 0), 0);
  const winRate = rows.length > 0 ? Math.round((wonRows.length / rows.length) * 100) : 0;
  const averageProbability =
    activeRows.length > 0
      ? Math.round(activeRows.reduce((sum, item) => sum + item.probability, 0) / activeRows.length)
      : 0;

  // Devise majoritaire pour l'affichage du total
  const majorCurrency =
    valuedActiveRows.length > 0
      ? (valuedActiveRows.sort((a, b) =>
          valuedActiveRows.filter((r) => r.currency === b.currency).length -
          valuedActiveRows.filter((r) => r.currency === a.currency).length
        )[0]?.currency ?? "XOF")
      : "XOF";

  const stageCards = STAGES.map((stage) => {
    const items = rows.filter((item) => item.stage === stage.key);
    return {
      ...stage,
      count: items.length,
      value: items.reduce((sum, item) => sum + (item.value || 0), 0),
    };
  });

  const maxStageCount = Math.max(...stageCards.map((s) => s.count), 1);

  const metrics = [
    {
      label: "Pipeline total",
      value: formatMoney(pipelineTotal, majorCurrency, true),
      detail: `${valuedActiveRows.length} affaire${valuedActiveRows.length > 1 ? "s" : ""} avec valeur`,
      icon: TrendingUp,
      iconClass: "text-emerald-600",
      tileClass: "bg-emerald-50",
      accent: "text-emerald-600",
    },
    {
      label: "Affaires en cours",
      value: String(activeRows.length),
      detail: "à suivre activement",
      icon: BarChart2,
      iconClass: "text-sky-600",
      tileClass: "bg-sky-50",
      accent: "text-sky-600",
    },
    {
      label: "Taux de réussite",
      value: rows.length > 0 ? `${winRate}%` : "—",
      detail: wonRows.length > 0 ? `${wonRows.length} affaire${wonRows.length > 1 ? "s" : ""} gagnée${wonRows.length > 1 ? "s" : ""}` : "Pas encore d'affaire gagnée",
      icon: Target,
      iconClass: "text-violet-600",
      tileClass: "bg-violet-50",
      accent: "text-violet-600",
    },
    {
      label: "Confiance moyenne",
      value: activeRows.length > 0 ? `${averageProbability}%` : "—",
      detail: "probabilité de conclure",
      icon: BarChart2,
      iconClass: "text-amber-600",
      tileClass: "bg-amber-50",
      accent: "text-amber-600",
    },
  ];

  return (
    <EnterprisePrototypeShell
      title="Ventes"
      subtitle="Vos prospects et contrats en cours — ajoutez une affaire pour chaque client ou projet commercial que vous suivez."
      icon={BriefcaseBusiness}
      iconClassName="text-emerald-600"
      iconTileClassName="bg-gradient-to-br from-emerald-50 to-cyan-50"
      actions={
        <Link
          href="/entreprise/ventes/create"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle affaire
        </Link>
      }
    >
      {/* Explication contextuelle — visible seulement si pipeline vide */}
      {rows.length === 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-500" />
          <div>
            <p className="text-sm font-semibold text-sky-900">
              Qu'est-ce qu'une affaire ici ?
            </p>
            <p className="mt-1 text-sm leading-6 text-sky-700">
              Une affaire = une opportunité commerciale avec <strong>l'un de vos clients</strong>. Par exemple : un contrat que vous essayez de conclure, un devis envoyé, une négociation en cours. Ce n'est pas KORYXA qui vend — c'est <strong>vous</strong> qui suivez vos propres ventes ici.
            </p>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <article key={item.label} className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${item.tileClass}`}>
              <item.icon className={`h-5 w-5 ${item.iconClass}`} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
              <p className={`mt-1 text-2xl font-semibold tracking-[-0.04em] ${item.accent}`}>{item.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Pipeline visuel */}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
              Votre pipeline commercial
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              À quelle étape se trouve chacune de vos affaires en cours ?
            </p>
          </div>
          <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {rows.length} affaire{rows.length > 1 ? "s" : ""} au total
          </span>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {stageCards.map((stage, index) => (
            <div key={stage.key} className={`relative rounded-xl border p-5 ${stage.colorClassName}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">{stage.label}</h3>
                <div className={`h-2 w-2 rounded-full ${stage.dotClassName}`} />
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{stage.count}</span>
                <span className="text-sm text-slate-500">affaire{stage.count > 1 ? "s" : ""}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {stage.count > 0 ? formatMoney(stage.value, majorCurrency, true) : "—"}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
                <div
                  className={`h-full rounded-full transition-all ${stage.barClassName}`}
                  style={{ width: `${maxStageCount > 0 ? Math.round((stage.count / maxStageCount) * 100) : 0}%` }}
                />
              </div>
              {index < stageCards.length - 1 && (
                <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 md:block">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Table des deals */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">
              Affaires à suivre
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Classés par priorité puis par date de clôture prévue.
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-8 sm:p-10">
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <BriefcaseBusiness className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Aucune affaire pour le moment
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-slate-500">
                Ajoutez votre première affaire — un client prospect, un devis en attente, un contrat en négociation. Le pipeline et les indicateurs se rempliront automatiquement.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/entreprise/ventes/create"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter ma première affaire
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[680px] sm:min-w-[760px]">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    {["Client / Affaire", "Contact", "Valeur", "Étape", "Probabilité", "Clôture prévue"].map((heading) => (
                      <th key={heading} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.slice(0, 12).map((opportunity) => (
                    <tr key={opportunity.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2 w-2 flex-shrink-0 rounded-full ${priorityDotClass(opportunity.priority)}`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{opportunity.company}</p>
                            <p className="text-xs text-slate-400">{opportunity.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{opportunity.contact}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {formatMoney(opportunity.value, opportunity.currency)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stageBadgeClass(opportunity.stage)}`}>
                          {opportunity.stage}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${opportunity.probability}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-slate-600">{opportunity.probability}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{opportunity.closeDateLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
              <span className="text-xs text-slate-500">
                {Math.min(rows.length, 12)} sur {rows.length} affaire{rows.length > 1 ? "s" : ""}
              </span>
              <Link
                href="/entreprise/ventes/create"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une affaire
              </Link>
            </div>
          </>
        )}
      </section>
    </EnterprisePrototypeShell>
  );
}

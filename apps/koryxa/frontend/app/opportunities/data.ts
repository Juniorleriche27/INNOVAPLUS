import { INNOVA_API_BASE } from "@/lib/env";
import type { Opportunity, OpportunityListResponse } from "@/lib/types/opportunities";

const API = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/opportunities`;

const FALLBACK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "fallback-data-analyst",
    title: "Dashboard exécutif pour direction commerciale",
    problem:
      "Structurer des tableaux de bord utiles, clarifier les indicateurs et rendre la décision commerciale plus lisible.",
    status: "open",
    country: "CI",
    skills_required: ["data analysis", "dashboarding", "sql"],
    tags: ["vente", "pilotage", "reporting"],
    created_at: "2026-03-12T10:15:00.000Z",
    source: "mission",
    product_slug: "myplanning",
  },
  {
    id: "fallback-automation",
    title: "Automatisation du reporting opérationnel",
    problem:
      "Réduire le temps passé sur les consolidations manuelles et sécuriser la diffusion des rapports hebdomadaires.",
    status: "draft",
    country: "SN",
    skills_required: ["automation", "python", "workflow"],
    tags: ["ops", "automation"],
    created_at: "2026-03-10T08:00:00.000Z",
    source: "product",
    product_slug: "chatlaya",
  },
  {
    id: "fallback-ml",
    title: "Prototype prédictif pour risque de churn",
    problem:
      "Identifier les signaux les plus utiles pour mieux expliquer et anticiper les départs de clients.",
    status: "open",
    country: "MA",
    skills_required: ["machine learning", "feature engineering", "python"],
    tags: ["prediction", "customer success"],
    created_at: "2026-03-08T14:30:00.000Z",
    source: "manual",
    product_slug: "chatlaya",
  },
];

export async function listOpportunities(params?: {
  search?: string;
  status?: string;
  country?: string;
  source?: string;
  product?: string;
  limit?: number;
}): Promise<Opportunity[]> {
  const query = new URLSearchParams();
  query.set("limit", String(params?.limit ?? 24));
  if (params?.search?.trim()) query.set("search", params.search.trim());
  if (params?.status?.trim() && params.status !== "all") query.set("status", params.status.trim());
  if (params?.country?.trim()) query.set("country", params.country.trim());
  if (params?.source?.trim() && params.source !== "all") query.set("source", params.source.trim());
  if (params?.product?.trim()) query.set("product", params.product.trim());

  try {
    const response = await fetch(`${API}?${query.toString()}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("opportunities unavailable");
    const payload = (await response.json()) as OpportunityListResponse;
    if (Array.isArray(payload.items) && payload.items.length > 0) return payload.items;
  } catch {
    // fall back below
  }

  return FALLBACK_OPPORTUNITIES;
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const items = await listOpportunities({ limit: 200 });
  return items.find((item) => item.id === id) ?? null;
}

export function formatOpportunityStatus(status?: string): string {
  if (status === "open") return "Ouverte";
  if (status === "draft") return "En cadrage";
  if (status === "closed") return "Fermée";
  return status || "Statut inconnu";
}

export function formatOpportunitySource(source?: string): string {
  if (source === "mission") return "Mission";
  if (source === "product") return "Produit";
  if (source === "manual") return "Saisie manuelle";
  return source || "Origine non précisée";
}

export function opportunityReadiness(opportunity: Opportunity): {
  score: number;
  label: string;
} {
  const score =
    Math.min(100, 42 + (opportunity.skills_required?.length || 0) * 8 + (opportunity.tags?.length || 0) * 5) || 48;
  if (score >= 78) return { score, label: "Activation rapide" };
  if (score >= 62) return { score, label: "Activation crédible" };
  return { score, label: "À structurer" };
}

export function relatedActivationSteps(opportunity: Opportunity): string[] {
  const items = [
    "Vérifier le niveau de clarté du besoin et le livrable attendu.",
    "Identifier les compétences et preuves réellement nécessaires pour activer un talent.",
    "Décider s'il faut une mission directe, une supervision formateur ou une montée en compétence préalable.",
  ];

  if (opportunity.mission_id) {
    items.unshift("Croiser l'opportunité avec la mission déjà liée pour éviter les doublons de pilotage.");
  }
  if (opportunity.product_slug) {
    items.push(`Relier explicitement cette opportunité au produit ${opportunity.product_slug} dans la communication.`);
  }

  return items.slice(0, 4);
}

import { INNOVA_API_BASE } from "@/lib/env";
import type { Opportunity } from "@/lib/types/opportunities";

const BASE = `${INNOVA_API_BASE.replace(/(\/innova\/api)+/g, "/innova/api")}/opportunities`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type OpportunityCreatePayload = {
  title: string;
  problem: string;
  skills_required?: string[];
  tags?: string[];
  country?: string;
  status?: string;
  mission_id?: string;
  source?: string;
  product_slug?: string;
};

export const opportunitiesApi = {
  create(payload: OpportunityCreatePayload) {
    return request<{ opportunity_id: string }>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  list(params?: { search?: string; status?: string; country?: string; source?: string; product?: string }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.country) qs.set("country", params.country);
    if (params?.source) qs.set("source", params.source);
    if (params?.product) qs.set("product", params.product);
    return request<{ items: Opportunity[]; total: number; has_more?: boolean }>(`?${qs.toString()}`);
  },
};

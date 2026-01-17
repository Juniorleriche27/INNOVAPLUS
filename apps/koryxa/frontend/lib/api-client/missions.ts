import { INNOVA_API_BASE } from "@/lib/env";

const BASE = `${INNOVA_API_BASE}/missions`;

function extractApiErrorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const obj = data as Record<string, unknown>;

  const detail = obj.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const inner = (detail as Record<string, unknown>).detail;
    if (typeof inner === "string") return inner;
  }

  if (typeof obj.message === "string") return obj.message;

  try {
    return JSON.stringify(obj);
  } catch {
    return "";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
      ...init,
    });
  } catch {
    throw new Error("Impossible de contacter l'API (réseau/CORS). Réessayez ou reconnectez-vous.");
  }

  if (!res.ok) {
    let message = "";
    try {
      const data = (await res.json()) as unknown;
      message = extractApiErrorMessage(data);
    } catch {
      message = await res.text().catch(() => "");
    }
    if (res.status === 401) {
      throw new Error("Connexion requise. Connectez-vous puis relancez le matching.");
    }
    throw new Error(message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type MissionPayload = {
  title: string;
  description: string;
  deliverables: string;
  deadline?: string;
  duration_days?: number;
  budget: { minimum?: number | null; maximum?: number | null; currency?: string };
  language: string;
  work_mode: "remote" | "local" | "hybrid";
  allow_expansion: boolean;
  collect_multiple_quotes: boolean;
  location_hint?: string | null;
};

export type MissionDetail = {
  mission_id: string;
  title: string;
  status: string;
  ai?: { summary?: string; keywords?: string[]; deliverables?: string[] };
  deliverables: string;
  deadline?: string;
  budget?: { minimum?: number; maximum?: number; currency?: string };
  offers?: Array<{ offer_id: string; prestataire_id: string; status: string; wave: number; message: string; expires_at?: string; scores?: Record<string, number> }>;
  messages?: Array<{ id: string; author_id: string; role: string; text: string; created_at: string }>; // truncated for UI
  milestones?: Array<{ id: string; title: string; status: "todo" | "in_progress" | "delivered" | "validated"; due_date?: string; notes?: string }>; // truncated for UI
  events?: Array<{ type: string; ts: string; payload?: Record<string, unknown> }>;
};

export const missionsApi = {
  preview(payload: MissionPayload) {
    return request<{ summary: Record<string, unknown>; tags: string[] }>(`?simulate=1`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  create(payload: MissionPayload) {
    return request<{ mission_id: string; status: string; summary: Record<string, unknown>; tags: string[] }>("", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  list(role: "demandeur" | "prestataire" | "admin" = "demandeur") {
    return request<Array<Record<string, unknown>>>(`?role=${role}`);
  },
  detail(mission_id: string) {
    return request<MissionDetail>(`/${mission_id}`);
  },
  dispatch(mission_id: string, body: { wave_size?: number; top_n?: number; timeout_minutes?: number; channel?: string }) {
    return request<{ dispatched: number; offers: Array<Record<string, unknown>> }>(`/${mission_id}/waves`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  respond(mission_id: string, offer_id: string, action: "accept" | "refuse", comment?: string) {
    return request<{ status: string }>(`/${mission_id}/offers/${offer_id}/respond`, {
      method: "POST",
      body: JSON.stringify({ action, comment })
    });
  },
  confirm(mission_id: string, offer_id: string, notes?: string) {
    return request<{ ok: boolean }>(`/${mission_id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ offer_id, notes }),
    });
  },
  messages(mission_id: string) {
    return request<Array<{ id: string; role: string; text: string; created_at: string }>>(`/${mission_id}/messages`);
  },
  sendMessage(mission_id: string, text: string) {
    return request<{ ok: boolean }>(`/${mission_id}/messages`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
  createMilestone(mission_id: string, payload: MissionMilestonePayload) {
    return request<{ ok: boolean }>(`/${mission_id}/milestones`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateMilestone(mission_id: string, milestone_id: string, payload: MilestoneUpdatePayload) {
    return request<{ ok: boolean }>(`/${mission_id}/milestones/${milestone_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  close(mission_id: string, payload: MissionClosePayload) {
    return request<{ ok: boolean }>(`/${mission_id}/close`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  export(mission_id: string) {
    return request<Record<string, unknown>>(`/${mission_id}/export`);
  },
  journal(mission_id: string) {
    return request<Array<{ ts: string; payload?: Record<string, unknown> }>>(`/${mission_id}/journal`);
  },
  dashboard(params?: { window_days?: number }) {
    const search = params?.window_days ? `?window_days=${params.window_days}` : "";
    return request<Record<string, unknown>>(`/dashboard${search}`);
  },
};

type MissionMilestonePayload = {
  title: string;
  due_date?: string;
  notes?: string;
};

type MilestoneUpdatePayload = {
  status: "todo" | "in_progress" | "delivered" | "validated";
  notes?: string;
};

type MissionClosePayload = {
  rating_demandeur?: number;
  rating_prestataire?: number;
  feedback?: string;
};

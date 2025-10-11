// innova-frontend/lib/api.ts

// Base URL du BACKEND (Render). Priorité:
// NEXT_PUBLIC_API_URL > NEXT_PUBLIC_CHATLAYA_URL > valeur par défaut
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_CHATLAYA_URL || "").replace(/\/+$/, "") ||
  "https://innova-1-v3ab.onrender.com";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type Domain = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
};

export type Contributor = {
  id: string;
  project_id: string;
  user_id?: string | null;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  github?: string | null;
};

export type Technology = {
  id: string;
  project_id: string;
  name?: string | null;
  version?: string | null;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  title?: string | null;
  description?: string | null;
  repo_url?: string | null;
  live_url?: string | null;
  logo_url?: string | null;
  status?: "draft" | "published" | "archived" | string | null;
  created_at?: string | null;
};

export const apiDomains = {
  async list(): Promise<Domain[]> {
    const res = await fetch(`${API_BASE}/domains`, { cache: "no-store" });
    return json<Domain[]>(res);
  },
};

export const apiContributors = {
  async list(): Promise<Contributor[]> {
    const res = await fetch(`${API_BASE}/contributors`, { cache: "no-store" });
    return json<Contributor[]>(res);
  },
};

export const apiTechnologies = {
  async list(): Promise<Technology[]> {
    const res = await fetch(`${API_BASE}/technologies`, { cache: "no-store" });
    return json<Technology[]>(res);
  },
};

export const apiProjects = {
  async list(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" });
    return json<Project[]>(res);
  },
  async get(id: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, { cache: "no-store" });
    return json<Project>(res);
  },
};

// Onboarding / profile
export const apiMe = {
  async upsertProfile(payload: { user_id: string; country?: string; skills?: string[]; goal?: string }) {
    const res = await fetch(`${API_BASE}/me/profile`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return json<{ ok: boolean }>(res);
  },
  async recommendations(user_id: string) {
    const res = await fetch(`${API_BASE}/me/recommendations?user_id=${encodeURIComponent(user_id)}`, { cache: "no-store" });
    return json<Array<{ id: string; title: string; country?: string; score: number; reasons: string[] }>>(res);
  },
};

// Notifications
export const apiNotifications = {
  async list(user_id: string, unread_only = false) {
    const url = `${API_BASE}/notifications?user_id=${encodeURIComponent(user_id)}${unread_only ? "&unread_only=1" : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    return json<Array<{ id: string; type: string; payload: any; created_at: string; read_at?: string }>>(res);
  },
  async markRead(user_id: string, ids: string[]) {
    const res = await fetch(`${API_BASE}/notifications/read?user_id=${encodeURIComponent(user_id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ids) });
    return json<{ ok: boolean }>(res);
  },
};

// Metrics
export const apiMetrics = {
  async event(name: string, payload?: Record<string, unknown>, user_id?: string) {
    const res = await fetch(`${API_BASE}/metrics/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, payload, user_id }) });
    return json<{ ok: boolean }>(res);
  },
};

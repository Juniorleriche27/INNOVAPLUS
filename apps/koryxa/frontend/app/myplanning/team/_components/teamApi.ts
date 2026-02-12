"use client";

export type WorkspaceRole = "owner" | "admin" | "member";
export type WorkspaceStatus = "active" | "pending";

export type Workspace = {
  id: string;
  name: string;
  role: WorkspaceRole;
  owner_user_id: string;
  member_count: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type WorkspaceListResponse = {
  items: Workspace[];
};

export type WorkspaceMember = {
  user_id?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role: WorkspaceRole;
  status: WorkspaceStatus;
  joined_at?: string | null;
  invited_at?: string | null;
};

export type WorkspaceMembersResponse = {
  workspace_id: string;
  items: WorkspaceMember[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const TEAM_API_BASE = `${API_BASE}/innova/api/myplanning`;

export class TeamApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseJsonSafe(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function extractErrorMessage(payload: any, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail.trim();
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message.trim();
  return fallback;
}

export async function teamRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${TEAM_API_BASE}${normalizedPath}`;
  const headers = new Headers(init?.headers || {});
  const hasBody = typeof init?.body !== "undefined";
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    const fallback = `HTTP ${response.status}`;
    throw new TeamApiError(response.status, extractErrorMessage(payload, fallback));
  }
  return payload as T;
}

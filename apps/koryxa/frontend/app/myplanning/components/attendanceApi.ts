"use client";

export type AttendanceLocation = {
  id: string;
  workspace_id: string;
  name: string;
  is_active: boolean;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type AttendanceQr = {
  location_id: string;
  workspace_id: string;
  location_name: string;
  qr_payload: string;
  valid_to: string;
  qr_svg: string;
};

export type AttendanceDaily = {
  workspace_id: string;
  user_id: string;
  day: string;
  first_check_in?: string | null;
  last_check_out?: string | null;
  minutes_present: number;
  status: "present" | "partial" | "absent";
  computed_at?: string | null;
};

export type AttendanceScanResponse = {
  ok: boolean;
  event_id: number;
  daily: AttendanceDaily;
};

export type AttendanceOverviewPoint = {
  day: string;
  present: number;
  partial: number;
  absent: number;
};

export type AttendanceOverview = {
  workspace_id: string;
  window: { from: string; to: string };
  present_rate: number;
  n_present: number;
  n_absent: number;
  n_partial: number;
  series: AttendanceOverviewPoint[];
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");
const MYPLANNING_API_BASE = `${API_BASE}/innova/api/myplanning`;

export class AttendanceApiError extends Error {
  status: number;
  payload: any;

  constructor(status: number, message: string, payload: any) {
    super(message);
    this.status = status;
    this.payload = payload;
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

export async function myplanningRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${MYPLANNING_API_BASE}${normalized}`;
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
    throw new AttendanceApiError(response.status, extractErrorMessage(payload, fallback), payload);
  }
  return payload as T;
}


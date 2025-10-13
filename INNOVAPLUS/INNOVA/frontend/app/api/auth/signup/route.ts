import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://innovaplus.onrender.com/innova/api"
).replace(/\/+$/, "");

type SignupSuccess = {
  user?: unknown;
  id?: string;
  token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

type ApiError = {
  detail?: string;
  message?: string;
};

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const obj = data as ApiError;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
  }
  return fallback;
}

export async function POST(req: Request) {
  // If already authenticated, block signup to avoid weird states
  const jar = cookies();
  if (jar.get("innova_access")) {
    return NextResponse.json({ code: "ALREADY_AUTHENTICATED", detail: "Vous êtes déjà connecté" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const msg = extractMessage(data, "Impossible de creer le compte");
    return NextResponse.json({ detail: msg }, { status: response.status });
  }

  const parsed = (data ?? {}) as SignupSuccess;
  const access = parsed.token || parsed.access_token;
  const maxAge = Math.max(60, Math.min(parsed.expires_in ?? 3600, 60 * 60 * 24 * 30));
  if (access) {
    const jar = cookies();
    jar.set("innova_access", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    jar.set("innova_logged_in", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
  }
  return NextResponse.json({ user: parsed.user ?? null, id: parsed.id ?? null }, { status: 201 });
}

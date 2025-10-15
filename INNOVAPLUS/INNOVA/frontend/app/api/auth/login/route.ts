import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://innovaplus.onrender.com/innova/api"
).replace(/\/+$/, "");

if (!API_BASE) {
  console.warn("API base URL is not defined. Set NEXT_PUBLIC_API_URL or API_URL.");
}

type LoginSuccess = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: unknown;
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
  const body = await req.json().catch(() => ({}));
  const response = await fetch(`${API_BASE}/auth/login`, {
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
    return NextResponse.json(
      { detail: extractMessage(data, "Email ou mot de passe invalide") },
      { status: response.status }
    );
  }

  const parsed = (data ?? {}) as LoginSuccess;
  const cookieStore = cookies();
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://innovaplus.africa");
  let domain: string | undefined;
  try {
    const host = new URL(site).hostname;
    if (host.endsWith("innovaplus.africa")) domain = ".innovaplus.africa";
    else if (/vercel\.app$/i.test(host)) domain = undefined; // cookies host-only en preview/prod Vercel
  } catch {}
  const accessToken =
    typeof (parsed as any).access_token === "string"
      ? (parsed as any).access_token
      : typeof (parsed as any).token === "string"
      ? (parsed as any).token
      : undefined;
  const refreshToken = typeof parsed.refresh_token === "string" ? parsed.refresh_token : undefined;
  const expiresIn = typeof parsed.expires_in === "number" ? parsed.expires_in : 3600;
  const maxAge = Math.max(60, Math.min(expiresIn, 60 * 60 * 24 * 30));

  if (accessToken) {
    cookieStore.set("innova_access", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge,
      path: "/",
      ...(domain ? { domain } : {}),
    });
    // Non-sensitive flag for client-side UI state (no token exposed)
    cookieStore.set("innova_logged_in", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge,
      path: "/",
      ...(domain ? { domain } : {}),
    });
  }

  if (refreshToken) {
    cookieStore.set("innova_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      ...(domain ? { domain } : {}),
    });
  }

  return NextResponse.json({
    user: parsed.user ?? null,
    expires_in: parsed.expires_in ?? null,
    token_type: parsed.token_type ?? "bearer",
  });
}



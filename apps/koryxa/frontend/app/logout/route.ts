import { NextResponse } from "next/server";
import { INNOVA_API_BASE, SITE_BASE_URL } from "@/lib/env";

const SESSION_COOKIE = "innova_session";

function getCookieDomain(siteBase: string): string | null {
  try {
    const host = new URL(siteBase).hostname.replace(/^\./, "");
    if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return null;
    }
    return host.includes(".") ? `.${host}` : null;
  } catch {
    return null;
  }
}

function clearCookieHeader() {
  const domain = getCookieDomain(SITE_BASE_URL);
  const secure = SITE_BASE_URL.startsWith("https://");
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "SameSite=Lax",
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await fetch(`${INNOVA_API_BASE}/auth/logout`, {
      method: "POST",
      headers: request.headers.get("cookie") ? { cookie: request.headers.get("cookie") as string } : undefined,
      cache: "no-store",
    });
  } catch {
    // Ignore logout failures; we'll still clear the cookie below.
  }

  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  response.headers.append(
    "Set-Cookie",
    clearCookieHeader()
  );
  return response;
}

import { NextResponse } from "next/server";
import { INNOVA_API_BASE } from "@/lib/env";

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
    "innova_session=; Path=/; Max-Age=0; SameSite=Lax"
  );
  return response;
}

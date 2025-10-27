import { NextResponse } from "next/server";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.innovaplus.africa"
).replace(/\/+$/, "");

const AUTH_PATHS = ["/auth/me", "/innova/api/auth/me"];

async function forwardAuthRequest(init: RequestInit): Promise<Response> {
  let response: Response | undefined;
  let error: unknown;
  for (const path of AUTH_PATHS) {
    try {
      response = await fetch(`${API_ROOT}${path}`, init);
    } catch (err) {
      error = err;
      continue;
    }
    if (response.status !== 404) {
      return response;
    }
  }
  if (!response) {
    throw error instanceof Error ? error : new Error("Auth upstream unreachable");
  }
  return response;
}

export async function GET(req: Request) {
  const init: RequestInit = {
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    cache: "no-store",
    redirect: "manual",
  };
  const response = await forwardAuthRequest(init);

  const text = await response.text().catch(() => "");
  const nextRes = new NextResponse(text, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    nextRes.headers.append("Set-Cookie", cookie);
  }
  if (!setCookies.length) {
    const header = response.headers.get("set-cookie");
    if (header) nextRes.headers.append("Set-Cookie", header);
  }
  return nextRes;
}

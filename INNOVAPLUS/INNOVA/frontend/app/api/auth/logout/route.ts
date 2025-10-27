import { NextResponse } from "next/server";

const API_ROOT = (
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.innovaplus.africa"
).replace(/\/+$/, "");

const AUTH_PATHS = ["/auth/logout", "/innova/api/auth/logout"];

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

export async function POST(req: Request) {
  const init: RequestInit = {
    method: "POST",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    redirect: "manual",
  };
  const response = await forwardAuthRequest(init);

  let payload: unknown = null;
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  const nextRes = NextResponse.json(payload ?? { ok: response.ok }, { status: response.status });
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

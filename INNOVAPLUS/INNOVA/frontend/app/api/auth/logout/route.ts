import { NextResponse } from "next/server";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.innovaplus.africa/innova/api"
).replace(/\/+$/, "");

export async function POST(req: Request) {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    redirect: "manual",
  });

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

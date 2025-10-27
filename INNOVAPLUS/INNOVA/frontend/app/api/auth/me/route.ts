import { NextResponse } from "next/server";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.innovaplus.africa/innova/api"
).replace(/\/+$/, "");

export async function GET(req: Request) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      cookie: req.headers.get("cookie") ?? "",
    },
    cache: "no-store",
    redirect: "manual",
  });

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

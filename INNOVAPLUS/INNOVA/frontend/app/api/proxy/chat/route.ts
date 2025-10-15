import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = (
  process.env.NEXT_PUBLIC_CHATLAYA_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://innovaplus.onrender.com/innova/api"
).replace(/\/+$/, "");

export async function POST(req: Request) {
  const token = cookies().get("innova_access")?.value;
  const body = await req.text();
  const res = await fetch(`${API_BASE}/chatlaya/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  const text = await res.text().catch(() => "");
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" } });
}


import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://innovaplus.onrender.com/innova/api"
).replace(/\/+$/, "");

export async function GET() {
  const token = cookies().get("innova_access")?.value;
  if (!token) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) return NextResponse.json({ detail: text || res.statusText }, { status: res.status });
  return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
}


import { NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "").replace(/\/+$/, "");

type SignupSuccess = {
  user?: unknown;
  id?: string;
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
    return NextResponse.json(
      { detail: extractMessage(data, "Impossible de creer le compte") },
      { status: response.status }
    );
  }

  const parsed = (data ?? {}) as SignupSuccess;
  return NextResponse.json({ user: parsed.user ?? null, id: parsed.id ?? null }, { status: 201 });
}

import { NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "").replace(/\/+$/, "");

type ApiError = {
  detail?: string;
  message?: string;
};

function extractMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const obj = data as ApiError;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
  }
  return fallback;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const response = await fetch(`${API_BASE}/auth/recover`, {
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
      { detail: extractMessage(data, "Impossible d envoyer le mail de reinitialisation") },
      { status: response.status }
    );
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { INNOVA_API_BASE } from "@/lib/env";

export async function GET(request: Request) {
  const cookieStore = cookies();
  const session = cookieStore.get("innova_session");

  try {
    await fetch(`${INNOVA_API_BASE}/auth/logout`, {
      method: "POST",
      headers: session ? { cookie: `${session.name}=${session.value}` } : undefined,
      cache: "no-store",
    });
  } catch {
    // Ignore logout failures; we'll still clear the cookie below.
  }

  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: "innova_session",
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}

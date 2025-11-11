export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import SignupClient from "./SignupClient";
import { AUTH_API_BASE } from "@/lib/env";

async function hasValidSession(): Promise<boolean> {
  const session = cookies().get("innova_session");
  if (!session?.value) return false;
  try {
    const res = await fetch(`${AUTH_API_BASE}/auth/me`, {
      cache: "no-store",
      headers: {
        cookie: `${session.name}=${session.value}`,
        "user-agent": headers().get("user-agent") || "innova-signup",
      },
      next: { revalidate: 0 },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function SignupPage() {
  if (await hasValidSession()) {
    redirect("/me/recommendations");
  }
  return <SignupClient />;
}

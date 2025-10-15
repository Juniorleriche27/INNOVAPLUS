import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const store = cookies();
  const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://innovaplus.africa");
  let domain: string | undefined;
  try {
    const host = new URL(site).hostname;
    if (host.endsWith("innovaplus.africa")) domain = ".innovaplus.africa";
    else if (/vercel\.app$/i.test(host)) domain = undefined;
  } catch {}
  // Overwrite with immediate expiry to ensure deletion across domain scope
  store.set("innova_access", "", { httpOnly: true, maxAge: 0, path: "/", ...(domain ? { domain } : {}) });
  store.set("innova_refresh", "", { httpOnly: true, maxAge: 0, path: "/", ...(domain ? { domain } : {}) });
  store.set("innova_logged_in", "0", { httpOnly: false, maxAge: 0, path: "/", ...(domain ? { domain } : {}) });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/analytics",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

const SESSION_COOKIE = "innova_session";
const SITE_BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://innovaplus.africa").replace(/\/+$/, "");
const LEGACY_API_HOST = "https://api.innovaplus.africa";
const DEFAULT_API_BASE = "https://innovaplus.africa";

function normalizeApiBase(base: string): string {
  const raw = base.replace(/\/+$/, "");
  // Keep middleware aligned with frontend env fallback when legacy api host TLS fails.
  if (raw.startsWith(LEGACY_API_HOST)) {
    return raw.replace(LEGACY_API_HOST, DEFAULT_API_BASE);
  }
  return raw;
}

const AUTH_API_BASE = normalizeApiBase(
  (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || DEFAULT_API_BASE).replace(/\/+$/, "")
);

function normalizeInnovaBase(base: string) {
  let clean = base.replace(/\/+$/, "");
  clean = clean.replace(/(\/innova\/api)+$/, "/innova/api");
  if (!clean.endsWith("/innova/api")) {
    clean = `${clean}/innova/api`;
  }
  return clean;
}

const INNOVA_API_BASE = normalizeInnovaBase(AUTH_API_BASE);

function getCookieDomain(siteBase: string): string | null {
  try {
    const host = new URL(siteBase).hostname.replace(/^\./, "");
    if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
      return null;
    }
    return host.includes(".") ? `.${host}` : null;
  } catch {
    return null;
  }
}

function buildClearSessionCookieHeader(domain?: string | null): string {
  const secure = SITE_BASE_URL.startsWith("https://");
  const parts = [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "SameSite=Lax",
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function appendSessionClearHeaders(response: NextResponse) {
  response.headers.append("Set-Cookie", buildClearSessionCookieHeader(undefined));
  const domain = getCookieDomain(SITE_BASE_URL);
  if (domain) {
    response.headers.append("Set-Cookie", buildClearSessionCookieHeader(domain));
  }
}

const CONNECTED_AUTH_REQUIRED_PREFIXES = [
  "/chatlaya",
  "/community/messages",
  "/myplanning/app",
  "/myplanning/formateurs",
  "/myplanning/profile",
  "/myplanning/settings",
  "/myplanning/opportunities",
  "/myplanning/team",
  "/myplanning/orgs",
  "/myplanning/enterprise/dashboard",
  "/myplanning/enterprise/onboarding",
  "/account",
  "/onboarding",
];

function requiresConnectedAuth(pathname: string) {
  return CONNECTED_AUTH_REQUIRED_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getLoginPath(_pathname: string): "/login" {
  return "/login";
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) return false;
  try {
    const res = await fetch(`${INNOVA_API_BASE}/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
const V1_SIMPLE =
  (process.env.NEXT_PUBLIC_V1_SIMPLE || "").toLowerCase() === "true" ||
  (process.env.NEXT_PUBLIC_APP_MODE || "").toUpperCase() === "V1";

const V1_HIDDEN_PREFIXES = [
  "/opportunities",
  "/skills",
  "/talents",
  "/engine",
  "/meet",
  "/missions",
  "/marketplace",
  "/studio",
  "/equity",
  "/analytics",
  "/projects",
  "/notifications",
  "/messages",
  "/post",
  "/posts",
  "/groups",
];

const V1_SCHOOL_ALLOWED = [
  "/school",
  "/school/fondamentaux",
  "/school/specialisations",
  "/school/validations",
  "/school/parcours",
  "/school/data-analyst",
  "/school/data-engineer",
  "/school/data-science",
  "/school/machine-learning",
];

const V1_PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/logout",
  "/school",
  "/trajectoire",
  "/entreprise",
  "/community",
  "/formateurs",
  "/talents",
  "/about",
  "/products",
  "/contact",
  "/chatlaya",
  "/resources",
  "/privacy",
  "/terms",
  "/bientot",
  "/myplanning",
];

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/logout" || pathname.startsWith("/logout/")) {
    return NextResponse.next();
  }
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE));
  let sessionChecked = false;
  let sessionValid = false;

  const ensureSessionValid = async () => {
    if (!sessionChecked) {
      sessionValid = await hasValidSession(request);
      sessionChecked = true;
    }
    return sessionValid;
  };

  if (V1_SIMPLE) {
    const isPublic = V1_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const forceAuth = requiresConnectedAuth(pathname);
    const allowAnonymous = isPublic && !forceAuth;

    if (!hasSession && !allowAnonymous) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = getLoginPath(pathname);
      loginUrl.searchParams.set(
        "redirect",
        pathname + (searchParams.toString() ? `?${searchParams}` : "")
      );
      return NextResponse.redirect(loginUrl);
    }
    if (hasSession && !allowAnonymous) {
      const ok = await ensureSessionValid();
      if (!ok) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = getLoginPath(pathname);
        loginUrl.searchParams.set(
          "redirect",
          pathname + (searchParams.toString() ? `?${searchParams}` : "")
        );
        const res = NextResponse.redirect(loginUrl);
        appendSessionClearHeaders(res);
        return res;
      }
    }
    if (pathname.startsWith("/school/") && !V1_SCHOOL_ALLOWED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = "/school";
      return NextResponse.redirect(url);
    }
    if (V1_HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      const url = request.nextUrl.clone();
      url.pathname = "/bientot";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/chat-laya" || pathname.startsWith("/chat-laya/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/chat-laya", "/chatlaya");
    return NextResponse.redirect(url, 308);
  }
  if (pathname === "/opportunites") {
    const url = request.nextUrl.clone();
    url.pathname = "/opportunities";
    return NextResponse.rewrite(url);
  }
  if (pathname === "/a-propos") {
    const url = request.nextUrl.clone();
    url.pathname = "/about";
    return NextResponse.rewrite(url);
  }
  if (pathname === "/ressources") {
    const url = request.nextUrl.clone();
    url.pathname = "/resources";
    return NextResponse.rewrite(url);
  }

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = getLoginPath(pathname);
    loginUrl.searchParams.set(
      "redirect",
      pathname + (searchParams.toString() ? `?${searchParams}` : "")
    );
    return NextResponse.redirect(loginUrl);
  }
  if (isProtectedPath(pathname) && hasSession) {
    const ok = await ensureSessionValid();
    if (!ok) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = getLoginPath(pathname);
      loginUrl.searchParams.set(
        "redirect",
        pathname + (searchParams.toString() ? `?${searchParams}` : "")
      );
      const res = NextResponse.redirect(loginUrl);
      appendSessionClearHeaders(res);
      return res;
    }
  }

  if (requiresConnectedAuth(pathname) && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = getLoginPath(pathname);
    loginUrl.searchParams.set(
      "redirect",
      pathname + (searchParams.toString() ? `?${searchParams}` : "")
    );
    return NextResponse.redirect(loginUrl);
  }
  if (requiresConnectedAuth(pathname) && hasSession) {
    const ok = await ensureSessionValid();
    if (!ok) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = getLoginPath(pathname);
      loginUrl.searchParams.set(
        "redirect",
        pathname + (searchParams.toString() ? `?${searchParams}` : "")
      );
      const res = NextResponse.redirect(loginUrl);
      appendSessionClearHeaders(res);
      return res;
    }
  }

  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/myplanning/login" ||
    pathname === "/myplanning/signup"
  ) {
    if (!hasSession) {
      return NextResponse.next();
    }
    const ok = await ensureSessionValid();
    if (ok) {
      const redirectUrl = request.nextUrl.clone();
      if (pathname.startsWith("/myplanning/")) {
        redirectUrl.pathname = "/myplanning/app";
      } else {
        redirectUrl.pathname = "/";
      }
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
    const res = NextResponse.next();
    appendSessionClearHeaders(res);
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  const csp = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; img-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'self';";
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};

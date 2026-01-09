import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/analytics",
  "/chatlaya",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

const SESSION_COOKIE = "innova_session";
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
  "/myplanning",
  "/chatlaya",
  "/studio",
  "/products",
  "/resources",
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
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE));

  if (V1_SIMPLE) {
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
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirect",
      pathname + (searchParams.toString() ? `?${searchParams}` : "")
    );
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/signup") && hasSession) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
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

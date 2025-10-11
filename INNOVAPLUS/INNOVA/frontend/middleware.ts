import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/projects",
  "/domains",
  "/contributors",
  "/technologies",
  "/analytics",
  "/chatlaya",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const access = request.cookies.get("innova_access");

  // Redirect legacy /chat-laya to /chatlaya (permanent)
  if (pathname === "/chat-laya" || pathname.startsWith("/chat-laya/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace("/chat-laya", "/chatlaya");
    return NextResponse.redirect(url, 308);
  }

  if (isProtectedPath(pathname) && !access) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirect",
      pathname + (searchParams.toString() ? `?${searchParams}` : "")
    );
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/signup") && access) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chat-laya/:path*",
    "/projects/:path*",
    "/domains/:path*",
    "/contributors/:path*",
    "/technologies/:path*",
    "/analytics/:path*",
    "/chatlaya",
    "/login",
    "/signup",
  ],
};

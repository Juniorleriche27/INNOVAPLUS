import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/projects",
  "/domains",
  "/contributors",
  "/technologies",
  "/analytics",
  "/chat-laya",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const access = request.cookies.get("innova_access");

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
    "/projects/:path*",
    "/domains/:path*",
    "/contributors/:path*",
    "/technologies/:path*",
    "/analytics/:path*",
    "/chat-laya",
    "/login",
    "/signup",
  ],
};

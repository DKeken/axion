import { ROUTES } from "@/config/routes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token");

  // List of protected routes
  const protectedPaths = [
    ROUTES.DASHBOARD.PROJECTS.ROOT,
    ROUTES.DASHBOARD.DEPLOYMENTS.ROOT,
    ROUTES.DASHBOARD.INFRASTRUCTURE.ROOT,
    ROUTES.ADMIN.ROOT,
  ];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.AUTH.SIGN_IN;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/projects/:path*",
    "/deployments/:path*",
    "/infrastructure/:path*",
    "/admin/:path*",
  ],
};

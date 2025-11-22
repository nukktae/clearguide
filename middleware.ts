import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected app routes that require authentication
  const protectedRoutes = ["/app", "/app/history", "/app/calendar", "/app/account"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if route is login/signup (allow access)
  const isAuthRoute = pathname === "/login" || pathname === "/login/signup";

  if (isProtectedRoute) {
    // Check for auth cookie (Firebase token or legacy "true" value)
    const authCookie = request.cookies.get("clearguide_auth");
    
    // Accept both Firebase tokens (long strings) and legacy "true" value for backward compatibility
    if (!authCookie || (authCookie.value !== "true" && authCookie.value.length < 100)) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and trying to access login, redirect to app
  if (isAuthRoute) {
    const authCookie = request.cookies.get("clearguide_auth");
    if (authCookie && (authCookie.value === "true" || authCookie.value.length >= 100)) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pathnames except for static files and API routes
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract pathname without query params for matching
  const pathnameWithoutQuery = pathname.split('?')[0];
  
  // Redirect any locale-prefixed URLs to clean URLs (e.g., /en/login -> /login)
  const localeMatch = pathnameWithoutQuery.match(/^\/(ko|en)(\/.*)?$/);
  if (localeMatch) {
    const pathWithoutLocale = localeMatch[2] || "/";
    const redirectUrl = new URL(pathWithoutLocale, request.url);
    // Preserve query parameters
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(redirectUrl);
  }

  // Protected app routes that require authentication
  const protectedRoutes = ["/app", "/app/history", "/app/calendar", "/app/account"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutQuery === route || pathnameWithoutQuery.startsWith(`${route}/`)
  );

  // Check if route is login/signup (allow access)
  const isAuthRoute = pathnameWithoutQuery === "/login" || pathnameWithoutQuery.startsWith("/login/");

  // Handle authentication for protected routes
  if (isProtectedRoute) {
    const authCookie = request.cookies.get("clearguide_auth");
    
    const hasFirebaseAuth = authCookie && (authCookie.value === "true" || authCookie.value.length >= 100);
    
    if (!hasFirebaseAuth) {
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathnameWithoutQuery);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and trying to access login, redirect to app
  if (isAuthRoute) {
    const authCookie = request.cookies.get("clearguide_auth");
    
    const isAuthenticated = authCookie && (authCookie.value === "true" || authCookie.value.length >= 100);
    
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pathnames except for static files, API routes, and Next.js internals
    // Exclude: api routes, _next (includes RSC), _vercel, and files with extensions
    "/((?!api|_next|_vercel|.*\\..*|favicon.ico).*)",
  ],
};

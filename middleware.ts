import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/lib/i18n/routing";

// Create next-intl middleware for locale routing
const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't need locale processing
  const publicRoutes = ["/contact", "/privacy", "/terms"];
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  
  // If it's a public route, skip locale processing but still check auth
  if (isPublicRoute) {
    // Just pass through for public routes - they don't need locale routing
    return NextResponse.next();
  }
  
  // For all other routes, let next-intl middleware handle locale routing first
  const response = intlMiddleware(request);
  
  // Get the pathname after intl middleware processing
  const processedPathname = request.nextUrl.pathname;
  
  // Extract locale from pathname (e.g., /en/app or /app)
  const localeMatch = processedPathname.match(/^\/(ko|en)(\/.*)?$/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
  const pathWithoutLocale = localeMatch ? (localeMatch[2] || "/") : processedPathname;

  // Protected app routes that require authentication
  const protectedRoutes = ["/app", "/app/history", "/app/calendar", "/app/account"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale === route || pathWithoutLocale.startsWith(`${route}/`)
  );

  // Check if route is login/signup (allow access)
  const isAuthRoute = pathWithoutLocale === "/login" || pathWithoutLocale === "/login/signup";

  // Handle authentication for protected routes
  if (isProtectedRoute) {
    const authCookie = request.cookies.get("clearguide_auth");
    const kakaoSession = request.cookies.get("clearguide_session");
    
    const hasFirebaseAuth = authCookie && (authCookie.value === "true" || authCookie.value.length >= 100);
    const hasKakaoAuth = kakaoSession !== undefined && kakaoSession !== null && kakaoSession.value && kakaoSession.value.length > 0;
    const isAuthenticated = hasFirebaseAuth || hasKakaoAuth;
    
    if (!isAuthenticated) {
      // Redirect to login with return URL (preserve locale)
      const loginPath = locale === routing.defaultLocale ? "/login" : `/${locale}/login`;
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set("redirect", pathWithoutLocale);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated and trying to access login, redirect to app
  if (isAuthRoute) {
    const authCookie = request.cookies.get("clearguide_auth");
    const kakaoSession = request.cookies.get("clearguide_session");
    
    const isAuthenticated =
      (authCookie && (authCookie.value === "true" || authCookie.value.length >= 100)) ||
      kakaoSession !== undefined;
    
    if (isAuthenticated) {
      const appPath = locale === routing.defaultLocale ? "/app" : `/${locale}/app`;
      return NextResponse.redirect(new URL(appPath, request.url));
    }
  }

  // Return the response from intl middleware (with any auth redirects applied)
  return response;
}

export const config = {
  matcher: [
    // Match all pathnames except for static files and API routes
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};

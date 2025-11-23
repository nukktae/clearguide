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
    // Check for auth cookie (Firebase token, Kakao session, or legacy "true" value)
    const authCookie = request.cookies.get("clearguide_auth");
    const kakaoSession = request.cookies.get("clearguide_session");
    
    console.log("[Middleware] Checking protected route:", pathname);
    console.log("[Middleware] Cookies:", {
      hasAuthCookie: !!authCookie,
      authCookieValue: authCookie?.value?.substring(0, 20) + "...",
      hasKakaoSession: !!kakaoSession,
      kakaoSessionValue: kakaoSession?.value?.substring(0, 50) + "...",
      allCookies: Array.from(request.cookies.getAll()).map(c => c.name),
    });
    
    // Accept Firebase tokens (long strings), Kakao session, or legacy "true" value
    const hasFirebaseAuth = authCookie && (authCookie.value === "true" || authCookie.value.length >= 100);
    const hasKakaoAuth = kakaoSession !== undefined && kakaoSession !== null && kakaoSession.value && kakaoSession.value.length > 0;
    const isAuthenticated = hasFirebaseAuth || hasKakaoAuth;
    
    console.log("[Middleware] Authentication check:", {
      isAuthenticated,
      hasFirebaseAuth,
      hasKakaoAuth,
      authCookieValue: authCookie?.value,
      kakaoSessionExists: !!kakaoSession,
      kakaoSessionValueLength: kakaoSession?.value?.length || 0,
    });
    
    if (!isAuthenticated) {
      console.log("[Middleware] Not authenticated, redirecting to login");
      // Redirect to login with return URL
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.log("[Middleware] Authenticated, allowing access");
  }

  // If already authenticated and trying to access login, redirect to app
  if (isAuthRoute) {
    const authCookie = request.cookies.get("clearguide_auth");
    const kakaoSession = request.cookies.get("clearguide_session");
    
    const isAuthenticated =
      (authCookie && (authCookie.value === "true" || authCookie.value.length >= 100)) ||
      kakaoSession !== undefined;
    
    if (isAuthenticated) {
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

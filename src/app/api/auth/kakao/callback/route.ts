import { NextRequest, NextResponse } from "next/server";
import { createKakaoSession } from "@/src/lib/auth/session";

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope?: string;
}

interface KakaoUserResponse {
  id: number;
  connected_at?: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    email?: string;
    email_needs_verification?: boolean;
    email_verified?: boolean;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
  };
}

/**
 * GET /api/auth/kakao/callback
 * Handles Kakao OAuth callback, exchanges code for token, fetches user info, and creates session
 */
export async function GET(request: NextRequest) {
  console.log("[Kakao Callback] Starting callback processing");
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  
  console.log("[Kakao Callback] URL params:", {
    hasCode: !!code,
    codeLength: code?.length,
    error: error,
    fullUrl: request.url,
  });

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get("error_description");
    console.error("[Kakao Callback] OAuth error:", { error, errorDescription });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("카카오 로그인에 실패했습니다.")}`, request.url)
    );
  }

  // Validate authorization code
  if (!code) {
    console.error("[Kakao Callback] ERROR: No authorization code received");
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("인증 코드를 받지 못했습니다."), request.url)
    );
  }

  console.log("[Kakao Callback] Authorization code received, proceeding with token exchange");

  const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY;
  const kakaoRedirectUri = process.env.KAKAO_REDIRECT_URI;
  const kakaoClientSecret = process.env.KAKAO_CLIENT_SECRET;
  
  console.log("[Kakao Callback] Environment check:", {
    hasApiKey: !!kakaoRestApiKey,
    hasRedirectUri: !!kakaoRedirectUri,
    hasClientSecret: !!kakaoClientSecret,
    redirectUri: kakaoRedirectUri,
  });

  if (!kakaoRestApiKey || !kakaoRedirectUri) {
    console.error("[Kakao Callback] ERROR: Missing environment variables");
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("서버 설정 오류가 발생했습니다."), request.url)
    );
  }

  try {
    // Step 1: Exchange authorization code for access token
    console.log("[Kakao Callback] Step 1: Exchanging code for token");
    
    const tokenRequestBody = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: kakaoRestApiKey,
      redirect_uri: kakaoRedirectUri,
      code: code,
      ...(kakaoClientSecret && { client_secret: kakaoClientSecret }),
    });
    
    console.log("[Kakao Callback] Token request body:", {
      grant_type: "authorization_code",
      client_id: kakaoRestApiKey.substring(0, 10) + "...",
      redirect_uri: kakaoRedirectUri,
      code: code.substring(0, 10) + "...",
      hasClientSecret: !!kakaoClientSecret,
    });
    
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: tokenRequestBody,
    });
    
    console.log("[Kakao Callback] Token response status:", tokenResponse.status, tokenResponse.statusText);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Kakao Callback] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
      });
      return NextResponse.redirect(
        new URL(
          "/login?error=" + encodeURIComponent("토큰 교환에 실패했습니다."),
          request.url
        )
      );
    }

    const tokenData: KakaoTokenResponse = await tokenResponse.json();
    console.log("[Kakao Callback] Token exchange successful:", {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
    });
    
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("[Kakao Callback] ERROR: No access token in response");
      return NextResponse.redirect(
        new URL(
          "/login?error=" + encodeURIComponent("액세스 토큰을 받지 못했습니다."),
          request.url
        )
      );
    }

    // Step 2: Fetch user information from Kakao API
    console.log("[Kakao Callback] Step 2: Fetching user information");
    
    const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });
    
    console.log("[Kakao Callback] User info response status:", userResponse.status, userResponse.statusText);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error("[Kakao Callback] User info fetch failed:", {
        status: userResponse.status,
        statusText: userResponse.statusText,
        error: errorText,
      });
      return NextResponse.redirect(
        new URL(
          "/login?error=" + encodeURIComponent("사용자 정보를 가져오는데 실패했습니다."),
          request.url
        )
      );
    }

    const userData: KakaoUserResponse = await userResponse.json();
    console.log("[Kakao Callback] User data received:", {
      userId: userData.id,
      hasEmail: !!userData.kakao_account?.email,
      hasNickname: !!userData.kakao_account?.profile?.nickname,
      hasProfileImage: !!userData.kakao_account?.profile?.profile_image_url,
    });

    // Extract user information
    const userId = String(userData.id);
    const email = userData.kakao_account?.email || null;
    const nickname =
      userData.kakao_account?.profile?.nickname ||
      userData.properties?.nickname ||
      null;
    const profileImageUrl =
      userData.kakao_account?.profile?.profile_image_url ||
      userData.properties?.profile_image ||
      null;

    // Step 3: Create session cookie
    console.log("[Kakao Callback] Step 3: Creating session");
    
    const sessionData = {
      userId,
      email,
      nickname,
      profileImageUrl,
    };
    
    console.log("[Kakao Callback] Session data:", {
      userId: sessionData.userId,
      email: sessionData.email || "null",
      nickname: sessionData.nickname || "null",
      hasProfileImage: !!sessionData.profileImageUrl,
    });
    
    // Step 4: Create redirect response and set cookies on it
    // IMPORTANT: We must set cookies on the response object, not via cookies().set()
    // because we're doing a redirect
    console.log("[Kakao Callback] Step 4: Setting cookies on redirect response");
    
    const redirectUrl = new URL("/app", request.url);
    
    // Set Kakao session cookie value
    const sessionValue = JSON.stringify(sessionData);
    console.log("[Kakao Callback] Session value to set:", sessionValue.substring(0, 100) + "...");
    
    // Create redirect response
    const response = NextResponse.redirect(redirectUrl, {
      status: 307, // Explicitly use 307 Temporary Redirect
    });
    
    // Set Kakao session cookie on the response
    response.cookies.set("clearguide_session", sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    
    // Set Firebase-compatible auth cookie for middleware compatibility
    response.cookies.set("clearguide_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    
    // Verify cookies are set
    const sessionCookie = response.cookies.get("clearguide_session");
    const authCookie = response.cookies.get("clearguide_auth");
    
    console.log("[Kakao Callback] Cookies verification:", {
      hasSessionCookie: !!sessionCookie,
      sessionCookieValue: sessionCookie?.value?.substring(0, 50) + "...",
      hasAuthCookie: !!authCookie,
      authCookieValue: authCookie?.value,
    });
    
    console.log("[Kakao Callback] Successfully completed callback flow, redirecting to /app");
    return response;
  } catch (error) {
    // Handle errors gracefully without exposing details
    console.error("[Kakao Callback] Unexpected error:", error);
    console.error("[Kakao Callback] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.redirect(
      new URL(
        "/login?error=" + encodeURIComponent("카카오 로그인 처리 중 오류가 발생했습니다."),
        request.url
      )
    );
  }
}


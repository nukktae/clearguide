import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/kakao/login
 * Redirects user to Kakao authorization URL
 */
export async function GET(request: NextRequest) {
  console.log("[Kakao Login] Starting Kakao login flow");
  
  const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY;
  const kakaoRedirectUri = process.env.KAKAO_REDIRECT_URI;

  console.log("[Kakao Login] Environment check:", {
    hasApiKey: !!kakaoRestApiKey,
    hasRedirectUri: !!kakaoRedirectUri,
    redirectUri: kakaoRedirectUri,
  });

  if (!kakaoRestApiKey) {
    console.error("[Kakao Login] ERROR: KAKAO_REST_API_KEY is not configured");
    return NextResponse.json(
      { error: "Kakao REST API key is not configured" },
      { status: 500 }
    );
  }

  if (!kakaoRedirectUri) {
    console.error("[Kakao Login] ERROR: KAKAO_REDIRECT_URI is not configured");
    return NextResponse.json(
      { error: "Kakao redirect URI is not configured" },
      { status: 500 }
    );
  }

  // Build Kakao authorization URL
  const kakaoAuthUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  kakaoAuthUrl.searchParams.set("response_type", "code");
  kakaoAuthUrl.searchParams.set("client_id", kakaoRestApiKey);
  kakaoAuthUrl.searchParams.set("redirect_uri", kakaoRedirectUri);

  const finalUrl = kakaoAuthUrl.toString();
  console.log("[Kakao Login] Redirecting to Kakao:", finalUrl);

  // Redirect to Kakao authorization page
  return NextResponse.redirect(finalUrl);
}


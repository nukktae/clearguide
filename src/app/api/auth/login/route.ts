import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

/**
 * POST /api/auth/login
 * Login with email and password OR Firebase ID token
 * 
 * Option 1: Email/Password login
 * Body: {
 *   email: string
 *   password: string
 * }
 * 
 * Option 2: Firebase ID token (from client-side auth)
 * Body: {
 *   token: string (Firebase ID token from client-side signIn)
 * }
 * OR use Authorization header:
 * Authorization: Bearer <firebase-id-token>
 * 
 * Returns: {
 *   success: boolean
 *   user: { uid, email, email_verified }
 *   token: string (Firebase ID token)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");
    
    let idToken: string | null = null;
    let user: { uid: string; email: string | null; email_verified?: boolean } | null = null;

    // Check if it's email/password login
    if (body.email && body.password) {
      if (!FIREBASE_API_KEY) {
        return NextResponse.json(
          { error: "Firebase API key가 설정되지 않았습니다." },
          { status: 500 }
        );
      }

      // Use Firebase REST API to sign in
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
      
      const signInResponse = await fetch(signInUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          returnSecureToken: true,
        }),
      });

      const signInData = await signInResponse.json();

      if (!signInResponse.ok) {
        let errorMessage = "로그인에 실패했습니다.";
        if (signInData.error?.message) {
          if (signInData.error.message.includes("EMAIL_NOT_FOUND")) {
            errorMessage = "등록되지 않은 이메일입니다.";
          } else if (signInData.error.message.includes("INVALID_PASSWORD")) {
            errorMessage = "비밀번호가 올바르지 않습니다.";
          } else if (signInData.error.message.includes("INVALID_EMAIL")) {
            errorMessage = "유효하지 않은 이메일입니다.";
          } else if (signInData.error.message.includes("USER_DISABLED")) {
            errorMessage = "비활성화된 계정입니다.";
          } else if (signInData.error.message.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
            errorMessage = "너무 많은 시도가 있었습니다. 나중에 다시 시도해주세요.";
          } else {
            errorMessage = signInData.error.message;
          }
        }
        
        return NextResponse.json(
          { error: errorMessage, code: signInData.error?.code },
          { status: 401 }
        );
      }

      idToken = signInData.idToken;
      user = {
        uid: signInData.localId,
        email: signInData.email,
        email_verified: signInData.emailVerified || false,
      };

    } else {
      // Try to get token from body or Authorization header
      let token = body.token;
      if (!token && authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      if (!token) {
        return NextResponse.json(
          { 
            error: "이메일/비밀번호 또는 Firebase ID token이 필요합니다.",
            hint: "Body에 { email, password } 또는 { token }을 전달하세요."
          },
          { status: 400 }
        );
      }

      // Verify and decode token
      user = await getUserFromToken(token);
      
      if (!user || !user.uid) {
        return NextResponse.json(
          { error: "유효하지 않은 토큰입니다." },
          { status: 401 }
        );
      }

      idToken = token;
    }

    if (!idToken || !user) {
      return NextResponse.json(
        { error: "로그인에 실패했습니다." },
        { status: 401 }
      );
    }

    // Set auth cookie
    const cookieStore = await cookies();
    cookieStore.set("clearguide_auth", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        email_verified: user.email_verified || false,
      },
      token: idToken,
    });
  } catch (error: any) {
    console.error("[API] Login error:", error);
    
    return NextResponse.json(
      { error: "로그인에 실패했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

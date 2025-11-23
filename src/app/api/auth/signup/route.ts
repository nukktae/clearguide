import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

/**
 * POST /api/auth/signup
 * Sign up with email and password OR Firebase ID token
 * 
 * Option 1: Email/Password signup
 * Body: {
 *   email: string
 *   password: string
 *   displayName?: string
 * }
 * 
 * Option 2: Firebase ID token (from client-side auth)
 * Body: {
 *   token: string (Firebase ID token from client-side signUp)
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

    // Check if it's email/password signup
    if (body.email && body.password) {
      // Validate password length
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: "비밀번호는 최소 6자 이상이어야 합니다." },
          { status: 400 }
        );
      }

      if (!FIREBASE_API_KEY) {
        return NextResponse.json(
          { error: "Firebase API key가 설정되지 않았습니다." },
          { status: 500 }
        );
      }

      // Use Firebase REST API to create user
      const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
      
      const signUpResponse = await fetch(signUpUrl, {
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

      const signUpData = await signUpResponse.json();

      if (!signUpResponse.ok) {
        let errorMessage = "회원가입에 실패했습니다.";
        if (signUpData.error?.message) {
          if (signUpData.error.message.includes("EMAIL_EXISTS")) {
            errorMessage = "이미 사용 중인 이메일입니다.";
          } else if (signUpData.error.message.includes("INVALID_EMAIL")) {
            errorMessage = "유효하지 않은 이메일입니다.";
          } else if (signUpData.error.message.includes("WEAK_PASSWORD")) {
            errorMessage = "비밀번호가 너무 약합니다.";
          } else {
            errorMessage = signUpData.error.message;
          }
        }
        
        return NextResponse.json(
          { error: errorMessage, code: signUpData.error?.code },
          { status: 400 }
        );
      }

      idToken = signUpData.idToken;
      user = {
        uid: signUpData.localId,
        email: signUpData.email,
        email_verified: signUpData.emailVerified || false,
      };

      // Update display name if provided (using Firebase REST API)
      if (body.displayName && idToken) {
        try {
          const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`;
          await fetch(updateUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              idToken: idToken,
              displayName: body.displayName,
              returnSecureToken: false,
            }),
          });
        } catch (updateError) {
          console.error("[API] Failed to update display name:", updateError);
          // Don't fail the signup if display name update fails
        }
      }

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
        { error: "회원가입에 실패했습니다." },
        { status: 400 }
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
    console.error("[API] Signup error:", error);
    
    return NextResponse.json(
      { error: "회원가입에 실패했습니다.", details: error.message },
      { status: 500 }
    );
  }
}


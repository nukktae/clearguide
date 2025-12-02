import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getUserFromToken } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * POST /api/profile/photo
 * Upload profile photo
 * 
 * Headers:
 *   Authorization: Bearer <firebase-id-token>
 * 
 * Body: FormData with "file" field containing image file
 * 
 * Returns: {
 *   success: boolean
 *   photoURL: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    
    // Get token
    const authHeader = request.headers.get("authorization");
    const authCookie = request.cookies.get("clearguide_auth");
    
    let token: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (authCookie?.value && authCookie.value.length >= 100) {
      token = authCookie.value;
    }

    if (!token) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 제공되지 않았습니다." },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 5MB를 초과할 수 없습니다." },
        { status: 400 }
      );
    }

    // Convert file to base64 for Firebase Auth
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64Image}`;

    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: "Firebase API key가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Update profile photo using Firebase REST API
    const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`;
    
    const updateResponse = await fetch(updateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: token,
        photoUrl: dataUrl,
        returnSecureToken: false,
      }),
    });

    const updateResult = await updateResponse.json();

    if (!updateResponse.ok) {
      let errorMessage = "프로필 사진 업로드에 실패했습니다.";
      if (updateResult.error?.message) {
        errorMessage = updateResult.error.message;
      }
      
      return NextResponse.json(
        { error: errorMessage, code: updateResult.error?.code },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      photoURL: updateResult.photoUrl || dataUrl,
    });
  } catch (error: any) {
    console.error("[API] Profile photo upload error:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "프로필 사진 업로드 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}


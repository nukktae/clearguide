import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /app/api/profile/photo
 * Upload profile photo (convert to base64 data URL)
 * 
 * Body: FormData with "file" field
 * Returns: { success: boolean, photoURL: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    
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

    // Validate file size (1MB max after compression)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기가 너무 큽니다. 더 작은 이미지를 선택해주세요." },
        { status: 400 }
      );
    }

    // Convert to base64 data URL
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    
    console.log("[API Profile Photo] Data URL length:", dataUrl.length);
    
    // Firebase Auth has a limit of ~2048 characters for photoURL
    // If still too long, return error with helpful message
    if (dataUrl.length > 2000) {
      console.log("[API Profile Photo] Image too large, length:", dataUrl.length);
      return NextResponse.json(
        { error: `이미지가 너무 큽니다 (${Math.round(dataUrl.length / 1024)}KB). 더 작은 이미지를 선택하거나 압축을 더 강하게 해주세요.` },
        { status: 400 }
      );
    }

    // Firebase Auth user - get token
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
        { error: "인증 토큰을 찾을 수 없습니다." },
        { status: 401 }
      );
    }

    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: "Firebase API key가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Update profile photo URL
    const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`;
    console.log("[API Profile Photo] Updating Firebase Auth profile...");
    
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
      console.error("[API Profile Photo] Firebase Auth update failed:", updateResult);
      return NextResponse.json(
        { error: updateResult.error?.message || "프로필 사진 업로드에 실패했습니다.", code: updateResult.error?.code },
        { status: 400 }
      );
    }

    console.log("[API Profile Photo] Successfully updated profile photo");
    return NextResponse.json({
      success: true,
      photoURL: dataUrl,
    });
  } catch (error: any) {
    console.error("[API Profile Photo] Upload error:", error);
    return NextResponse.json(
      { error: "프로필 사진 업로드 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}


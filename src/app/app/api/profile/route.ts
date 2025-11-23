import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/auth/api-auth";
import { getUserFromToken } from "@/src/lib/firebase/admin";

export const runtime = "nodejs";

/**
 * GET /app/api/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    
    // Check if it's a Kakao session
    const { getKakaoSession } = await import("@/src/lib/auth/session");
    const kakaoSession = await getKakaoSession();
    
    if (kakaoSession?.userId === userId) {
      // Return Kakao user profile
      return NextResponse.json({
        success: true,
        user: {
          uid: kakaoSession.userId,
          email: kakaoSession.email || null,
          email_verified: false,
          displayName: kakaoSession.nickname || null,
          photoURL: kakaoSession.profileImageUrl || null,
        },
      });
    }
    
    // Firebase Auth user - get token
    const authHeader = request.headers.get("authorization");
    const authCookie = request.cookies.get("clearguide_auth");
    
    let token: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      console.log("[API Profile] Using token from Authorization header");
    } else if (authCookie?.value && authCookie.value.length >= 100) {
      token = authCookie.value;
      console.log("[API Profile] Using token from cookie");
    }

    if (!token) {
      console.log("[API Profile] No token found. Auth header:", !!authHeader, "Cookie:", !!authCookie);
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const user = await getUserFromToken(token);
    
    console.log("[API Profile] Token decoded - userId from requireAuth:", userId, "uid from token:", user?.uid);
    
    if (!user) {
      console.error("[API Profile] Failed to decode token");
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }
    
    if (user.uid !== userId) {
      console.error("[API Profile] UID mismatch:", {
        userIdFromAuth: userId,
        uidFromToken: user.uid,
      });
      return NextResponse.json(
        { error: "인증 정보가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    console.log("[API Profile] Decoded token user:", {
      uid: user.uid,
      email: user.email,
      email_verified: user.email_verified,
    });

    // Get additional user info from Firebase Auth REST API
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    let displayName: string | null = null;
    let photoURL: string | null = null;
    let emailFromAPI: string | null = user.email;

    if (FIREBASE_API_KEY) {
      try {
        const getUserUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`;
        console.log("[API Profile] Fetching user data from Firebase Auth REST API...");
        
        const getUserResponse = await fetch(getUserUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idToken: token,
          }),
        });

        const getUserData = await getUserResponse.json();
        console.log("[API Profile] Firebase Auth REST API response:", {
          ok: getUserResponse.ok,
          hasUsers: !!getUserData.users,
          usersLength: getUserData.users?.length || 0,
          error: getUserData.error,
        });

        if (getUserResponse.ok && getUserData.users && getUserData.users.length > 0) {
          const userData = getUserData.users[0];
          displayName = userData.displayName || null;
          photoURL = userData.photoUrl || null;
          emailFromAPI = userData.email || user.email;
          
          console.log("[API Profile] Firebase Auth user data:", {
            displayName,
            email: emailFromAPI,
            photoURL: photoURL ? "exists" : "null",
            providers: userData.providerUserInfo,
          });
        } else {
          console.error("[API Profile] Failed to get user data from Firebase Auth:", {
            status: getUserResponse.status,
            error: getUserData.error,
            message: getUserData.error?.message,
          });
        }
      } catch (error) {
        console.error("[API Profile] Error fetching user details:", error);
        // Continue without displayName/photoURL
      }
    } else {
      console.warn("[API Profile] FIREBASE_API_KEY not set, cannot fetch displayName/photoURL");
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: emailFromAPI,
        email_verified: user.email_verified || false,
        displayName: displayName,
        photoURL: photoURL,
      },
    });
  } catch (error: any) {
    console.error("[API] Get profile error:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "프로필을 가져오는 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /app/api/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { displayName, photoURL } = body;

    // Validate that at least one field is provided
    if (displayName === undefined && photoURL === undefined) {
      return NextResponse.json(
        { error: "업데이트할 필드를 제공해주세요. (displayName 또는 photoURL)" },
        { status: 400 }
      );
    }

    // Handle photo deletion (empty string means delete)
    const shouldDeletePhoto = photoURL === null || photoURL === "";

    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!FIREBASE_API_KEY) {
      return NextResponse.json(
        { error: "Firebase API key가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Update profile using Firebase REST API
    const updateUrl = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`;
    
    const updateData: any = {
      idToken: token,
      returnSecureToken: false,
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    if (photoURL !== undefined) {
      if (shouldDeletePhoto) {
        // Set to empty string to delete photo
        updateData.photoUrl = "";
      } else {
        updateData.photoUrl = photoURL;
      }
    }

    const updateResponse = await fetch(updateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const updateResult = await updateResponse.json();

    if (!updateResponse.ok) {
      let errorMessage = "프로필 업데이트에 실패했습니다.";
      if (updateResult.error?.message) {
        errorMessage = updateResult.error.message;
      }
      
      return NextResponse.json(
        { error: errorMessage, code: updateResult.error?.code },
        { status: 400 }
      );
    }

    // Get updated user info
    const user = await getUserFromToken(token);
    
    return NextResponse.json({
      success: true,
      user: {
        uid: userId,
        email: user?.email || null,
        email_verified: user?.email_verified || false,
        displayName: updateResult.displayName || displayName || null,
        photoURL: shouldDeletePhoto ? null : (updateResult.photoUrl || photoURL || null),
      },
    });
  } catch (error: any) {
    console.error("[API] Update profile error:", error);
    
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "프로필 업데이트 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}


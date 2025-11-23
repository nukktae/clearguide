/**
 * Session management utilities for Kakao OAuth
 */

import { cookies } from "next/headers";

export interface KakaoSession {
  userId: string;
  email: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

const SESSION_COOKIE_NAME = "clearguide_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Create a session cookie with Kakao user data
 */
export async function createKakaoSession(sessionData: KakaoSession): Promise<void> {
  console.log("[Session] Creating Kakao session:", {
    userId: sessionData.userId,
    email: sessionData.email || "null",
    nickname: sessionData.nickname || "null",
  });
  
  const cookieStore = await cookies();
  
  // Store session data as JSON string
  const sessionValue = JSON.stringify(sessionData);
  
  console.log("[Session] Setting cookie:", {
    name: SESSION_COOKIE_NAME,
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  
  console.log("[Session] Session cookie set successfully");
}

/**
 * Get the current Kakao session
 */
export async function getKakaoSession(): Promise<KakaoSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value) as KakaoSession;
  } catch (error) {
    // Invalid session data
    return null;
  }
}

/**
 * Delete the Kakao session
 */
export async function deleteKakaoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user has a valid Kakao session
 */
export async function hasKakaoSession(): Promise<boolean> {
  const session = await getKakaoSession();
  return session !== null;
}


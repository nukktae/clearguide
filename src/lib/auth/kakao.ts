/**
 * Client-side Kakao authentication utilities
 */

export interface KakaoUser {
  userId: string;
  email: string | null;
  nickname: string | null;
  profileImageUrl: string | null;
}

/**
 * Get Kakao session from cookie (client-side)
 */
export function getKakaoSessionClient(): KakaoUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cookies = document.cookie.split("; ");
    const sessionCookie = cookies.find((cookie) =>
      cookie.startsWith("clearguide_session=")
    );

    if (!sessionCookie) {
      return null;
    }

    const sessionValue = sessionCookie.split("=")[1];
    if (!sessionValue) {
      return null;
    }

    return JSON.parse(decodeURIComponent(sessionValue)) as KakaoUser;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has Kakao session (client-side)
 */
export function hasKakaoSessionClient(): boolean {
  return getKakaoSessionClient() !== null;
}

/**
 * Clear Kakao session (client-side)
 */
export function clearKakaoSessionClient(): void {
  if (typeof window === "undefined") {
    return;
  }

  document.cookie = "clearguide_session=; path=/; max-age=0";
  document.cookie = "clearguide_auth=; path=/; max-age=0";
}


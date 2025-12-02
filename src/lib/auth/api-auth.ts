/**
 * Server-side authentication utilities for API routes
 */

import { NextRequest } from "next/server";
import { getUserFromToken } from "../firebase/admin";

/**
 * Get user ID from request (Firebase Auth only)
 * Returns null if not authenticated
 */
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  // Try Authorization header (for Postman/testing)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token.length >= 100) {
      const user = await getUserFromToken(token);
      if (user?.uid) {
        return user.uid;
      }
    }
  }

  // Try Firebase token from cookie
  const authCookie = request.cookies.get("clearguide_auth");
  if (authCookie?.value && authCookie.value.length >= 100) {
    // It's a Firebase token (not the legacy "true" value)
    const user = await getUserFromToken(authCookie.value);
    if (user?.uid) {
      return user.uid;
    }
  }

  return null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<string> {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    throw new Error("Unauthorized: Authentication required");
  }
  return userId;
}


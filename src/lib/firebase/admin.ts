/**
 * Firebase Admin utilities for server-side token verification
 * Note: For production, you should use Firebase Admin SDK on the server
 * For now, we'll verify tokens client-side and pass them to the server
 */

import { auth } from "./config";

/**
 * Verify Firebase ID token
 * This is a client-side verification. For production, use Firebase Admin SDK on server.
 */
export async function verifyIdToken(idToken: string): Promise<boolean> {
  try {
    // In a real implementation, you would verify the token on the server
    // using Firebase Admin SDK. For now, we'll do basic validation.
    if (!idToken || idToken.length < 100) {
      return false;
    }
    
    // The token format should be a JWT
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Token verification error:", error);
    return false;
  }
}

/**
 * Get user from token (server-side JWT decoding)
 * Note: This decodes the token without verification. For production, use Firebase Admin SDK.
 */
export async function getUserFromToken(idToken: string) {
  try {
    // Decode JWT payload (server-side compatible)
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode base64 payload (works in both browser and Node.js)
    const payloadBuffer = Buffer.from(parts[1], 'base64');
    const payload = JSON.parse(payloadBuffer.toString('utf-8'));
    
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}


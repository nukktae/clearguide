/**
 * Simple authentication utility for MVP
 * In production, replace with proper session management
 */

const AUTH_KEY = "clearguide_auth";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  const auth = localStorage.getItem(AUTH_KEY);
  return auth === "true";
}

export function setAuthenticated(value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  
  if (value) {
    localStorage.setItem(AUTH_KEY, "true");
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function requireAuth(): boolean {
  return isAuthenticated();
}


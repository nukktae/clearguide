/**
 * Firebase Authentication utilities
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { auth } from "./config";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Sign in with email and password
 */
export async function signInEmailPassword(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign up with email and password
 */
export async function signUpEmailPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
    // Force token refresh to include updated displayName
    await userCredential.user.getIdToken(true);
  }
  
  return userCredential;
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  return signOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  try {
    return auth.currentUser;
  } catch (error) {
    // If Firebase Auth is not initialized, return null
    console.warn("[Firebase Auth] Failed to get current user:", error);
    return null;
  }
}

/**
 * Convert Firebase User to AuthUser
 */
export function convertFirebaseUser(user: User | null): AuthUser | null {
  if (!user) return null;
  
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  try {
    return onAuthStateChanged(auth, (user) => {
      callback(convertFirebaseUser(user));
    });
  } catch (error: any) {
    // If Firebase Auth is not initialized (e.g., due to invalid config or Installations error),
    // call the callback with null and return a no-op unsubscribe function
    console.warn("[Firebase Auth] Failed to initialize auth state listener:", error);
    callback(null);
    return () => {}; // Return no-op unsubscribe function
  }
}

/**
 * Get auth token for API requests
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  
  return user.getIdToken();
}


/**
 * Firebase Configuration
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

// Validate Firebase configuration
function getFirebaseConfig() {
  const requiredEnvVars = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check for missing required environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || (typeof value === "string" && value.trim() === ""))
    .map(([key]) => key);

  if (missingVars.length > 0) {
    if (typeof window !== "undefined") {
      console.error(
        `[Firebase] Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
    return null;
  }

  return {
    apiKey: requiredEnvVars.apiKey!,
    authDomain: requiredEnvVars.authDomain!,
    projectId: requiredEnvVars.projectId!,
    storageBucket: requiredEnvVars.storageBucket!,
    messagingSenderId: requiredEnvVars.messagingSenderId!,
    appId: requiredEnvVars.appId!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

// Initialize Firebase only on client side with valid config
let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let analyticsInstance: Analytics | null = null;

function initializeFirebase() {
  // Only initialize on client side
  if (typeof window === "undefined") {
    return;
  }

  // Check if already initialized
  if (app) {
    return;
  }

  const firebaseConfig = getFirebaseConfig();
  
  if (!firebaseConfig) {
    console.warn("[Firebase] Configuration is invalid or incomplete. Firebase features will be disabled.");
    return;
  }

  try {
    // Initialize Firebase app
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }

    // Initialize Firebase Auth
    authInstance = getAuth(app);

    // Initialize Firestore
    dbInstance = getFirestore(app);

    // Initialize Analytics (handle ad blockers gracefully)
    try {
      analyticsInstance = getAnalytics(app);
    } catch (error) {
      // Analytics initialization failed (likely due to ad blocker)
      // This is fine - analytics is optional and doesn't affect authentication
      console.warn("[Firebase] Analytics initialization skipped (may be blocked by ad blocker)");
    }
  } catch (error) {
    console.error("[Firebase] Initialization error:", error);
    // Reset instances on error
    app = null;
    authInstance = null;
    dbInstance = null;
    analyticsInstance = null;
  }
}

// Initialize Firebase on import (client side only)
if (typeof window !== "undefined") {
  initializeFirebase();
}

// Export instances
// If Firebase config is invalid, these will be null, preventing the Installations error
// Components should handle the case where Firebase is not available
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export const analytics = analyticsInstance;
export default app;


/**
 * Firebase Configuration
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getFirestore, Firestore } from "firebase/firestore";

// Track if Firebase config is valid
let configValidated = false;
let configIsValid = false;

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
    configValidated = true;
    configIsValid = false;
    if (typeof window !== "undefined") {
      console.error(
        `[Firebase] Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
    return null;
  }

  // Validate format of critical values
  const apiKey = requiredEnvVars.apiKey!;
  const projectId = requiredEnvVars.projectId!;
  const appId = requiredEnvVars.appId!;

  // Basic format validation
  if (!apiKey.startsWith("AIza") || apiKey.length < 30) {
    configValidated = true;
    configIsValid = false;
    if (typeof window !== "undefined") {
      console.error("[Firebase] Invalid API key format");
    }
    return null;
  }

  if (!projectId || projectId.length < 3) {
    configValidated = true;
    configIsValid = false;
    if (typeof window !== "undefined") {
      console.error("[Firebase] Invalid project ID");
    }
    return null;
  }

  if (!appId || !appId.includes(":")) {
    configValidated = true;
    configIsValid = false;
    if (typeof window !== "undefined") {
      console.error("[Firebase] Invalid app ID format");
    }
    return null;
  }

  configValidated = true;
  configIsValid = true;

  return {
    apiKey,
    authDomain: requiredEnvVars.authDomain!,
    projectId,
    storageBucket: requiredEnvVars.storageBucket!,
    messagingSenderId: requiredEnvVars.messagingSenderId!,
    appId,
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

  // Validate config first
  const firebaseConfig = getFirebaseConfig();
  
  if (!firebaseConfig || !configIsValid) {
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

    // Initialize Firebase Auth (this triggers Installations API call)
    // Wrap in try-catch to handle Installations errors gracefully
    try {
      authInstance = getAuth(app);
    } catch (authError: any) {
      // If Auth initialization fails (e.g., Installations error), log but don't throw
      console.error("[Firebase] Auth initialization failed:", authError);
      if (authError?.code === "installations/request-failed" || authError?.message?.includes("Installations")) {
        console.error(
          "[Firebase] Installations error detected. Firebase Auth will be disabled.\n" +
          "This usually means:\n" +
          "1. Firebase environment variables are incorrect or missing\n" +
          "2. Firebase project configuration is invalid\n" +
          "3. The Firebase project doesn't allow client-side installations\n" +
          "Please check your Firebase configuration in Vercel environment variables."
        );
      }
      // Don't set authInstance - it will remain null
      // This allows the app to continue without Firebase Auth
    }

    // Initialize Firestore (only if app initialized successfully)
    if (app) {
      try {
        dbInstance = getFirestore(app);
      } catch (dbError) {
        console.error("[Firebase] Firestore initialization failed:", dbError);
        // Don't throw - allow app to continue
      }
    }

    // Initialize Analytics (handle ad blockers gracefully)
    if (app) {
      try {
        analyticsInstance = getAnalytics(app);
      } catch (error) {
        // Analytics initialization failed (likely due to ad blocker)
        // This is fine - analytics is optional and doesn't affect authentication
        console.warn("[Firebase] Analytics initialization skipped (may be blocked by ad blocker)");
      }
    }
  } catch (error: any) {
    console.error("[Firebase] Initialization error:", error);
    // Reset instances on error
    app = null;
    authInstance = null;
    dbInstance = null;
    analyticsInstance = null;
    configIsValid = false;
  }
}

// DO NOT initialize Firebase on import - only initialize when explicitly accessed
// This prevents the Installations error from happening during page load

// Helper function to ensure Firebase is initialized and return auth instance
function getAuthInstance(): Auth {
  // Only initialize on client side
  if (typeof window === "undefined") {
    throw new Error(
      "Firebase Auth cannot be used on the server side. Please use Firebase Admin SDK for server-side operations."
    );
  }

  // Validate config before attempting initialization
  if (!configValidated) {
    getFirebaseConfig();
  }

  // Don't initialize if config is invalid
  if (!configIsValid) {
    throw new Error(
      "Firebase Auth is not initialized due to invalid configuration. Please ensure all Firebase environment variables (NEXT_PUBLIC_FIREBASE_*) are set correctly in your Vercel environment."
    );
  }

  // Initialize if not already initialized
  if (!authInstance) {
    initializeFirebase();
  }

  if (!authInstance) {
    throw new Error(
      "Firebase Auth initialization failed. Please check your Firebase configuration and ensure all environment variables are correct."
    );
  }

  return authInstance;
}

// Helper function to ensure Firebase is initialized and return db instance
function getDbInstance(): Firestore {
  // Only initialize on client side
  if (typeof window === "undefined") {
    throw new Error(
      "Firestore cannot be used on the server side. Please use Firebase Admin SDK for server-side operations."
    );
  }

  // Validate config before attempting initialization
  if (!configValidated) {
    getFirebaseConfig();
  }

  // Don't initialize if config is invalid
  if (!configIsValid) {
    throw new Error(
      "Firestore is not initialized due to invalid configuration. Please ensure all Firebase environment variables (NEXT_PUBLIC_FIREBASE_*) are set correctly in your Vercel environment."
    );
  }

  // Initialize if not already initialized
  if (!dbInstance) {
    initializeFirebase();
  }

  if (!dbInstance) {
    throw new Error(
      "Firestore initialization failed. Please check your Firebase configuration and ensure all environment variables are correct."
    );
  }

  return dbInstance;
}

// Create proxy objects that lazily initialize Firebase when accessed
// This prevents the Firebase Installations error by validating config before initializing
const authProxy = new Proxy({} as Auth, {
  get(_target, prop) {
    const instance = getAuthInstance();
    const value = (instance as any)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

const dbProxy = new Proxy({} as Firestore, {
  get(_target, prop) {
    const instance = getDbInstance();
    const value = (instance as any)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export const auth = authProxy;
export const db = dbProxy;
export const analytics = analyticsInstance;
export default app;


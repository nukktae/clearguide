/**
 * Firebase Admin Firestore utilities for server-side operations
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore, Timestamp as AdminTimestamp } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDb: Firestore | null = null;
let initializationAttempted = false;

/**
 * Initialize Firebase Admin SDK
 */
function initializeAdmin() {
  if (adminApp) {
    return;
  }
  
  if (initializationAttempted) {
    console.warn("[Admin Firestore] Initialization already attempted, skipping");
    return;
  }
  
  initializationAttempted = true;
  console.log("[Admin Firestore] Starting initialization...");
  if (adminApp) {
    return;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    adminDb = getFirestore(adminApp);
    return;
  }

  // Initialize with service account or use default credentials
  // For Vercel/production, use environment variables
  // For local development, you can use a service account JSON file
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required for Admin SDK");
    }

    // Try to initialize with service account credentials if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId,
        });
      } catch (parseError) {
        console.warn("[Admin Firestore] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY, trying default credentials");
        adminApp = initializeApp({
          projectId,
        });
      }
    } else {
      // Use default credentials (works with Vercel if GOOGLE_APPLICATION_CREDENTIALS is set)
      // Or use application default credentials
      adminApp = initializeApp({
        projectId,
      });
    }

    adminDb = getFirestore(adminApp);
    console.log("[Admin Firestore] Admin SDK initialized successfully with service account");
  } catch (error) {
    console.error("[Admin Firestore] Initialization error:", error);
    // For development, try to initialize without credentials
    // This will work if Firebase emulator is running or if default credentials are available
    try {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (!projectId) {
        throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required");
      }
      adminApp = initializeApp({
        projectId,
      });
    adminDb = getFirestore(adminApp);
    console.log("[Admin Firestore] Initialized with default credentials");
    console.log("[Admin Firestore] Admin SDK ready for use");
    } catch (fallbackError) {
      console.error("[Admin Firestore] Fallback initialization failed:", fallbackError);
      // Don't throw - allow the app to continue, but operations will fail
      console.warn("[Admin Firestore] Admin SDK not initialized. Server-side Firestore operations will fail.");
    }
  }
}

/**
 * Get Admin Firestore instance
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    initializeAdmin();
  }
  if (!adminDb) {
    const errorDetails = {
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      isVercel: process.env.VERCEL === "1",
      nodeEnv: process.env.NODE_ENV,
    };
    console.error("[Admin Firestore] Failed to initialize - details:", errorDetails);
    throw new Error(
      `Firebase Admin Firestore is not initialized. ` +
      `Project ID: ${errorDetails.hasProjectId ? "✓" : "✗"}, ` +
      `Service Account: ${errorDetails.hasServiceAccount ? "✓" : "✗"}. ` +
      `Please check environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_KEY`
    );
  }
  return adminDb;
}

/**
 * Get a document by ID (server-side)
 */
export async function getDocumentAdmin<T = any>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const db = getAdminDb();
    console.log(`[Admin Firestore] Getting document ${documentId} from ${collectionName}`);
    const docRef = db.collection(collectionName).doc(documentId);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      console.log(`[Admin Firestore] Document ${documentId} found, has ${Object.keys(data || {}).length} fields`);
      return {
        id: docSnap.id,
        ...data,
      } as T;
    }

    console.log(`[Admin Firestore] Document ${documentId} does not exist in ${collectionName}`);
    return null;
  } catch (error) {
    console.error(`[Admin Firestore] Error getting document ${documentId} from ${collectionName}:`, error);
    console.error(`[Admin Firestore] Error details:`, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "Unknown",
    });
    throw error;
  }
}

/**
 * Get documents with query constraints (server-side)
 */
export async function getDocumentsAdmin<T = any>(
  collectionName: string,
  constraints: Array<{
    field: string;
    operator: "==" | "<" | "<=" | ">" | ">=" | "!=" | "array-contains" | "in" | "array-contains-any";
    value: any;
  } | {
    field: string;
    direction: "asc" | "desc";
  } | {
    limit: number;
  }> = []
): Promise<T[]> {
  try {
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection(collectionName);

    console.log(`[Admin Firestore] Building query for ${collectionName} with ${constraints.length} constraints`);

    // Apply constraints
    for (const constraint of constraints) {
      if ("operator" in constraint) {
        console.log(`[Admin Firestore] Applying where: ${constraint.field} ${constraint.operator} ${constraint.value}`);
        query = query.where(constraint.field, constraint.operator, constraint.value);
      } else if ("direction" in constraint) {
        console.log(`[Admin Firestore] Applying orderBy: ${constraint.field} ${constraint.direction}`);
        query = query.orderBy(constraint.field, constraint.direction);
      } else if ("limit" in constraint) {
        console.log(`[Admin Firestore] Applying limit: ${constraint.limit}`);
        query = query.limit(constraint.limit);
      }
    }

    const snapshot = await query.get();
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    
    console.log(`[Admin Firestore] Query returned ${results.length} documents`);
    
    return results;
  } catch (error) {
    console.error(`[Admin Firestore] Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Convert dates/timestamps to Admin SDK Timestamp format
 */
function convertToAdminTimestamp(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  
  // If it's already an Admin Timestamp, return as-is
  if (value instanceof AdminTimestamp) {
    return value;
  }
  
  // If it's a Date, convert to Admin Timestamp
  if (value instanceof Date) {
    return AdminTimestamp.fromDate(value);
  }
  
  // If it's a string (ISO date), convert to Admin Timestamp
  if (typeof value === "string" && !isNaN(Date.parse(value))) {
    return AdminTimestamp.fromDate(new Date(value));
  }
  
  // If it's a client SDK Timestamp (from firebase/firestore), convert it
  // Client SDK Timestamps have toDate() method and seconds/nanoseconds properties
  if (value && typeof value === "object" && 
      ("toDate" in value || ("seconds" in value && "nanoseconds" in value))) {
    try {
      if (typeof value.toDate === "function") {
        return AdminTimestamp.fromDate(value.toDate());
      } else if ("seconds" in value && "nanoseconds" in value) {
        // Convert from client SDK Timestamp format
        return AdminTimestamp.fromMillis(
          (value.seconds || 0) * 1000 + Math.floor((value.nanoseconds || 0) / 1000000)
        );
      }
    } catch (e) {
      console.warn("[Admin Firestore] Failed to convert Timestamp:", e);
    }
  }
  
  // If it's an array, convert each element
  if (Array.isArray(value)) {
    return value.map(convertToAdminTimestamp);
  }
  
  // If it's an object, convert recursively
  if (typeof value === "object" && value.constructor === Object) {
    const converted: any = {};
    for (const [key, val] of Object.entries(value)) {
      converted[key] = convertToAdminTimestamp(val);
    }
    return converted;
  }
  
  // Otherwise return as-is
  return value;
}

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefinedValuesAdmin(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValuesAdmin);
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedValuesAdmin(value);
    }
  }
  return cleaned;
}

/**
 * Create a document (server-side)
 */
export async function createDocumentAdmin<T = any>(
  collectionName: string,
  data: T & { id?: string }
): Promise<string> {
  try {
    const db = getAdminDb();
    const { id, ...docData } = data as any;
    
    // Remove undefined values (Firestore doesn't allow undefined)
    const cleanedData = removeUndefinedValuesAdmin(docData);
    
    // Convert all Timestamps to Admin SDK format
    const convertedData = convertToAdminTimestamp(cleanedData);
    
    if (id) {
      // Use provided ID
      await db.collection(collectionName).doc(id).set(convertedData);
      return id;
    } else {
      // Generate new ID
      const docRef = await db.collection(collectionName).add(convertedData);
      return docRef.id;
    }
  } catch (error) {
    console.error(`[Admin Firestore] Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update a document (server-side)
 */
export async function updateDocumentAdmin(
  collectionName: string,
  documentId: string,
  updates: any
): Promise<void> {
  try {
    const db = getAdminDb();
    // Convert all Timestamps to Admin SDK format
    const convertedUpdates = convertToAdminTimestamp(updates);
    await db.collection(collectionName).doc(documentId).update(convertedUpdates);
  } catch (error) {
    console.error(`[Admin Firestore] Error updating document ${documentId} in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document (server-side)
 */
export async function deleteDocumentAdmin(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection(collectionName).doc(documentId).delete();
  } catch (error) {
    console.error(`[Admin Firestore] Error deleting document ${documentId} from ${collectionName}:`, error);
    throw error;
  }
}


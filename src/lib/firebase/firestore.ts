/**
 * Firestore database utilities
 * Automatically uses Admin SDK on server-side, client SDK on client-side
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import {
  getDocumentAdmin,
  getDocumentsAdmin,
  createDocumentAdmin,
  updateDocumentAdmin,
  deleteDocumentAdmin,
} from "./admin-firestore";

/**
 * Get the correct Timestamp based on environment
 * - Server-side: Returns Date (will be converted to Admin Timestamp automatically)
 * - Client-side: Returns client SDK Timestamp
 */
export function getFirestoreTimestamp(): Date | Timestamp {
  if (typeof window === "undefined") {
    return new Date();
  }
  return Timestamp.now();
}

/**
 * Convert a Date or string to Timestamp based on environment
 * - Server-side: Returns Date (will be converted to Admin Timestamp automatically)
 * - Client-side: Returns client SDK Timestamp
 */
export function dateToFirestoreTimestamp(date: Date | string): Date | Timestamp {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (typeof window === "undefined") {
    return dateObj;
  }
  return Timestamp.fromDate(dateObj);
}

/**
 * Generic function to get a document by ID
 * Uses Admin SDK on server-side, client SDK on client-side
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  // Use Admin SDK on server-side
  if (typeof window === "undefined") {
    return getDocumentAdmin<T>(collectionName, documentId);
  }

  // Use client SDK on client-side
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamps to plain objects (they'll be converted to Dates/strings later)
      return {
        id: docSnap.id,
        ...data,
      } as unknown as T;
    }

    return null;
  } catch (error) {
    console.error(`[Firestore] Error getting document ${documentId} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Generic function to get all documents from a collection
 * Uses Admin SDK on server-side, client SDK on client-side
 */
export async function getDocuments<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  // Use Admin SDK on server-side
  if (typeof window === "undefined") {
    // Convert QueryConstraint[] to admin format
    // QueryConstraint objects have internal structure, so we need to extract the info
    const adminConstraints: Array<{
      field: string;
      operator: "==" | "<" | "<=" | ">" | ">=" | "!=" | "array-contains" | "in" | "array-contains-any";
      value: any;
    } | {
      field: string;
      direction: "asc" | "desc";
    } | {
      limit: number;
    }> = [];

    for (const constraint of constraints) {
      const constraintAny = constraint as any;
      
      console.log("[Firestore] Parsing constraint:", {
        type: constraintAny.type,
        _methodName: constraintAny._methodName,
        _fieldPath: constraintAny._fieldPath,
        _op: constraintAny._op,
        _value: constraintAny._value,
        _direction: constraintAny._direction,
        keys: Object.keys(constraintAny),
      });
      
      // Check if it's a where constraint (has _methodName === 'where')
      if (constraintAny._methodName === 'where' && constraintAny._fieldPath && constraintAny._op !== undefined) {
        // Extract field path - handle different possible structures
        let fieldPath: string;
        if (constraintAny._fieldPath._internalPath?.segments) {
          fieldPath = constraintAny._fieldPath._internalPath.segments.join('.');
        } else if (typeof constraintAny._fieldPath === 'string') {
          fieldPath = constraintAny._fieldPath;
        } else if (constraintAny._fieldPath._formattedName) {
          fieldPath = constraintAny._fieldPath._formattedName;
        } else {
          console.error("[Firestore] Could not extract field path from constraint:", constraintAny._fieldPath);
          continue;
        }
        
        const operator = constraintAny._op;
        const value = constraintAny._value;
        
        console.log("[Firestore] Parsed where constraint:", { field: fieldPath, operator, value });
        
        adminConstraints.push({
          field: fieldPath,
          operator: operator as any,
          value: value,
        });
      }
      // Check if it's an orderBy constraint (has _methodName === 'orderBy')
      else if (constraintAny._methodName === 'orderBy' && constraintAny._fieldPath) {
        let fieldPath: string;
        if (constraintAny._fieldPath._internalPath?.segments) {
          fieldPath = constraintAny._fieldPath._internalPath.segments.join('.');
        } else if (typeof constraintAny._fieldPath === 'string') {
          fieldPath = constraintAny._fieldPath;
        } else if (constraintAny._fieldPath._formattedName) {
          fieldPath = constraintAny._fieldPath._formattedName;
        } else {
          console.error("[Firestore] Could not extract field path from orderBy constraint:", constraintAny._fieldPath);
          continue;
        }
        
        adminConstraints.push({
          field: fieldPath,
          direction: (constraintAny._direction || 'asc') as "asc" | "desc",
        });
      }
      // Check if it's a limit constraint (has _methodName === 'limit')
      else if (constraintAny._methodName === 'limit' && constraintAny._limit !== undefined) {
        adminConstraints.push({
          limit: constraintAny._limit,
        });
      } else {
        console.warn("[Firestore] Unknown constraint type:", constraintAny);
      }
    }
    
    console.log("[Firestore] Converted constraints:", JSON.stringify(adminConstraints, null, 2));

    return getDocumentsAdmin<T>(collectionName, adminConstraints);
  }

  // Use client SDK on client-side
  try {
    const collectionRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as unknown as T[];
  } catch (error) {
    console.error(`[Firestore] Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Remove undefined values from an object (Firestore doesn't allow undefined)
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  }
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefinedValues(value);
    }
  }
  return cleaned;
}

/**
 * Generic function to create a new document
 * If data contains an 'id' field, it will be used as the document ID
 * Uses Admin SDK on server-side, client SDK on client-side
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, "id"> & { id?: string }
): Promise<string> {
  // Use Admin SDK on server-side
  if (typeof window === "undefined") {
    // Only add createdAt/updatedAt if they're not already provided
    const documentData = {
      ...data,
      createdAt: (data as any).createdAt ?? new Date(),
      updatedAt: (data as any).updatedAt ?? new Date(),
    };
    return createDocumentAdmin<T>(collectionName, documentData as unknown as T & { id?: string });
  }

  // Use client SDK on client-side
  try {
    const collectionRef = collection(db, collectionName);
    const documentData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Remove 'id' from data if present (it's used as document ID, not stored in data)
    const { id: providedId, ...dataWithoutId } = documentData as any;
    
    // Remove undefined values (Firestore doesn't allow undefined)
    const cleanedData = removeUndefinedValues(dataWithoutId);
    
    if (providedId) {
      // Use setDoc with specific ID
      const docRef = doc(db, collectionName, providedId);
      await setDoc(docRef, cleanedData);
      return providedId;
    } else {
      // Use addDoc to auto-generate ID
      const docRef = await addDoc(collectionRef, cleanedData);
      return docRef.id;
    }
  } catch (error) {
    console.error(`[Firestore] Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Generic function to update a document
 * Uses Admin SDK on server-side, client SDK on client-side
 */
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<Omit<T, "id">>
): Promise<void> {
  // Use Admin SDK on server-side
  if (typeof window === "undefined") {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    const cleanedData = removeUndefinedValues(updateData);
    return updateDocumentAdmin(collectionName, documentId, cleanedData);
  }

  // Use client SDK on client-side
  try {
    const docRef = doc(db, collectionName, documentId);
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
    };
    
    // Remove undefined values (Firestore doesn't allow undefined)
    const cleanedData = removeUndefinedValues(updateData);
    
    await updateDoc(docRef, cleanedData);
  } catch (error) {
    console.error(`[Firestore] Error updating document ${documentId} in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Generic function to delete a document
 * Uses Admin SDK on server-side, client SDK on client-side
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  // Use Admin SDK on server-side
  if (typeof window === "undefined") {
    return deleteDocumentAdmin(collectionName, documentId);
  }

  // Use client SDK on client-side
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`[Firestore] Error deleting document ${documentId} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Query helper functions
 */
export const firestoreQuery = {
  where,
  orderBy,
  limit,
};

/**
 * Batch write operations
 */
export async function batchWrite(
  operations: Array<{
    type: "create" | "update" | "delete";
    collection: string;
    id?: string;
    data?: DocumentData;
  }>
): Promise<void> {
  try {
    const batch = writeBatch(db);

    for (const operation of operations) {
      if (operation.type === "create" && operation.data) {
        const docRef = doc(collection(db, operation.collection));
        batch.set(docRef, {
          ...operation.data,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else if (operation.type === "update" && operation.id && operation.data) {
        const docRef = doc(db, operation.collection, operation.id);
        batch.update(docRef, {
          ...operation.data,
          updatedAt: Timestamp.now(),
        });
      } else if (operation.type === "delete" && operation.id) {
        const docRef = doc(db, operation.collection, operation.id);
        batch.delete(docRef);
      }
    }

    await batch.commit();
  } catch (error) {
    console.error("[Firestore] Error in batch write:", error);
    throw error;
  }
}

/**
 * Convert Firestore Timestamp to JavaScript Date
 */
export function timestampToDate(timestamp: Timestamp | Date | string): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp);
  }
  return timestamp.toDate();
}

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date | string): Timestamp {
  const jsDate = typeof date === "string" ? new Date(date) : date;
  return Timestamp.fromDate(jsDate);
}


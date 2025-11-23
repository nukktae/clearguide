/**
 * Firestore database utilities
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

/**
 * Generic function to get a document by ID
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
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
 */
export async function getDocuments<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
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
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, "id"> & { id?: string }
): Promise<string> {
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
 */
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<Omit<T, "id">>
): Promise<void> {
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
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
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


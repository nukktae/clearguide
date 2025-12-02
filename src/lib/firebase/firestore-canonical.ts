/**
 * Firestore operations for canonical document data
 * Stores verified, canonical output from hybrid model (NER + regex + RE)
 */

import { Timestamp, where } from "firebase/firestore";
import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  firestoreQuery,
} from "./firestore";
import type { CanonicalDocumentData } from "@/src/lib/parsing/canonical-output";

const COLLECTION_NAME = "canonical_data";

/**
 * Firestore canonical data type with Timestamp fields
 */
type FirestoreCanonicalData = CanonicalDocumentData & {
  userId: string;
  createdAt: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
};

/**
 * Convert CanonicalDocumentData to Firestore format
 */
function canonicalToFirestore(
  data: CanonicalDocumentData & { userId: string }
): any {
  return {
    ...data,
    createdAt: data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

/**
 * Convert Firestore document to CanonicalDocumentData
 */
function firestoreToCanonical(doc: any): CanonicalDocumentData & { id: string } {
  return {
    id: doc.id,
    deadlines: doc.deadlines || [],
    required_actions: doc.required_actions || [],
    penalties: doc.penalties || [],
    amounts: doc.amounts || [],
    account_numbers: doc.account_numbers || [],
    verified: doc.verified ?? true,
    source: doc.source || 'regex',
    createdAt: doc.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    documentId: doc.documentId,
  };
}

/**
 * Save canonical data to Firestore
 */
export async function saveCanonicalData(
  userId: string,
  canonicalData: CanonicalDocumentData
): Promise<string> {
  try {
    const data = canonicalToFirestore({ ...canonicalData, userId });
    
    // Use documentId as Firestore document ID if available
    const docId = canonicalData.documentId || `canonical_${Date.now()}`;
    
    const savedId = await createDocument<FirestoreCanonicalData>(
      COLLECTION_NAME,
      { ...data, id: docId } as any
    );
    
    return savedId;
  } catch (error) {
    console.error("[Firestore Canonical] Error saving canonical data:", error);
    throw error;
  }
}

/**
 * Get canonical data by document ID
 */
export async function getCanonicalDataByDocumentId(
  documentId: string,
  userId?: string
): Promise<(CanonicalDocumentData & { id: string }) | null> {
  try {
    const constraints = [
      where("documentId", "==", documentId),
      ...(userId ? [where("userId", "==", userId)] : []),
    ];

    const docs = await getDocuments<FirestoreCanonicalData>(COLLECTION_NAME, constraints);
    
    if (docs.length === 0) {
      return null;
    }

    // Return the most recent canonical data
    const sorted = docs.sort((a, b) => {
      const getTime = (ts: Timestamp | Date | string | undefined): number => {
        if (!ts) return 0;
        if (ts instanceof Timestamp) return ts.toDate().getTime();
        if (ts instanceof Date) return ts.getTime();
        if (typeof ts === 'string') return new Date(ts).getTime();
        return 0;
      };
      return getTime(b.createdAt) - getTime(a.createdAt);
    });

    return firestoreToCanonical(sorted[0]);
  } catch (error) {
    console.error("[Firestore Canonical] Error getting canonical data:", error);
    return null;
  }
}

/**
 * Get canonical data by ID
 */
export async function getCanonicalDataById(
  canonicalId: string,
  userId?: string
): Promise<(CanonicalDocumentData & { id: string }) | null> {
  try {
    const doc = await getDocument<FirestoreCanonicalData>(
      COLLECTION_NAME,
      canonicalId
    );

    if (!doc) {
      return null;
    }

    // Check userId if provided
    if (userId && doc.userId !== userId) {
      return null;
    }

    return firestoreToCanonical(doc);
  } catch (error) {
    console.error("[Firestore Canonical] Error getting canonical data:", error);
    return null;
  }
}

/**
 * Update canonical data
 */
export async function updateCanonicalData(
  canonicalId: string,
  updates: Partial<CanonicalDocumentData>,
  userId?: string
): Promise<void> {
  try {
    // Check userId if provided
    if (userId) {
      const existing = await getCanonicalDataById(canonicalId, userId);
      if (!existing) {
        throw new Error("Canonical data not found or access denied");
      }
    }

    await updateDocument<FirestoreCanonicalData>(
      COLLECTION_NAME,
      canonicalId,
      {
        ...updates,
        updatedAt: Timestamp.now(),
      } as any
    );
  } catch (error) {
    console.error("[Firestore Canonical] Error updating canonical data:", error);
    throw error;
  }
}


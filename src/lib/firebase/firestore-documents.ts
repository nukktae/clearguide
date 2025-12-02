/**
 * Firestore operations for documents
 * This replaces the file-based storage with Firestore
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from "firebase/firestore";
import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  firestoreQuery,
  getFirestoreTimestamp,
  dateToFirestoreTimestamp,
} from "./firestore";
import type { DocumentRecord, ChecklistItem, RiskAlert } from "@/src/lib/parsing/types";

const COLLECTION_NAME = "documents";

/**
 * Firestore document record type with Timestamp fields
 */
type FirestoreDocumentRecord = Omit<DocumentRecord, "uploadedAt"> & {
  userId: string;
  uploadedAt: Timestamp | Date | string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
};

/**
 * Convert DocumentRecord to Firestore format
 */
function documentToFirestore(doc: DocumentRecord & { userId: string }): any {
  const convertDate = (date: Date | string | Timestamp | undefined): Timestamp => {
    if (!date) return getFirestoreTimestamp() as Timestamp;
    if (date instanceof Timestamp) {
      return date;
    }
    if (date instanceof Date) {
      return dateToFirestoreTimestamp(date) as Timestamp;
    }
    return dateToFirestoreTimestamp(new Date(date)) as Timestamp;
  };

  return {
    ...doc,
    uploadedAt: convertDate(doc.uploadedAt),
    createdAt: convertDate((doc as any).createdAt || doc.uploadedAt),
    updatedAt: convertDate((doc as any).updatedAt || getFirestoreTimestamp()),
  };
}

/**
 * Convert Firestore document to DocumentRecord
 */
function firestoreToDocument(data: any): DocumentRecord {
  const convertTimestamp = (ts: any): Date => {
    if (!ts) return new Date();
    // If it's a Firestore Timestamp object
    if (ts && typeof ts.toDate === 'function') {
      return ts.toDate();
    }
    // If it's already a Date
    if (ts instanceof Date) {
      return ts;
    }
    // If it's a string or number
    if (typeof ts === 'string' || typeof ts === 'number') {
      return new Date(ts);
    }
    // Fallback
    return new Date();
  };

  // Convert deadline from Timestamp/Date to string (YYYY-MM-DD)
  const convertDeadlineToString = (deadline: any): string | undefined => {
    if (!deadline) return undefined;
    
    // Already a string
    if (typeof deadline === "string") {
      return deadline;
    }
    
    // Handle Timestamp objects
    if (deadline && typeof deadline === "object") {
      // Client SDK Timestamp
      if (typeof deadline.toDate === "function") {
        const date = deadline.toDate();
        return date.toISOString().split("T")[0];
      }
      // Admin SDK Timestamp or plain object with _seconds
      if (deadline._seconds !== undefined) {
        const date = new Date(deadline._seconds * 1000 + (deadline._nanoseconds || 0) / 1000000);
        return date.toISOString().split("T")[0];
      }
      // Already a Date
      if (deadline instanceof Date) {
        return deadline.toISOString().split("T")[0];
      }
    }
    
    // Fallback: try to stringify
    return String(deadline);
  };

  // Convert actions array to ensure IDs are strings and deadlines are converted
  const convertActions = (actions: any[]): ChecklistItem[] => {
    if (!Array.isArray(actions)) return [];
    const baseTimestamp = Date.now();
    return actions.map((action, index) => {
      let actionId: string;
      if (action.id && typeof action.id === "string") {
        actionId = action.id;
      } else if (action.id && typeof action.id === "object") {
        actionId = `action-${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        console.warn(`[Firestore Documents] Action ID was an object, generated new ID: ${actionId}`);
      } else {
        actionId = `action-${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      const converted: ChecklistItem = {
        ...action,
        id: actionId,
      };
      
      if (action.deadline) {
        converted.deadline = convertDeadlineToString(action.deadline);
      }
      
      return converted;
    });
  };

  // Convert risks array to ensure IDs are strings and deadlines are converted
  const convertRisks = (risks: any[]): RiskAlert[] => {
    if (!Array.isArray(risks)) return [];
    const baseTimestamp = Date.now();
    return risks.map((risk, index) => {
      let riskId: string;
      if (risk.id && typeof risk.id === "string") {
        riskId = risk.id;
      } else if (risk.id && typeof risk.id === "object") {
        riskId = `risk-${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        console.warn(`[Firestore Documents] Risk ID was an object, generated new ID: ${riskId}`);
      } else {
        riskId = `risk-${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      const converted: RiskAlert = {
        ...risk,
        id: riskId,
      };
      
      if (risk.deadline) {
        converted.deadline = convertDeadlineToString(risk.deadline);
      }
      
      return converted;
    });
  };

  const converted = {
    ...data,
    uploadedAt: convertTimestamp(data.uploadedAt).toISOString(),
    createdAt: data.createdAt ? convertTimestamp(data.createdAt).toISOString() : convertTimestamp(data.uploadedAt).toISOString(),
    updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt).toISOString() : convertTimestamp(data.uploadedAt).toISOString(),
  } as DocumentRecord;

  // Convert parsed data if it exists
  if (converted.parsed) {
    converted.parsed = {
      ...converted.parsed,
      actions: convertActions(converted.parsed.actions),
      risks: convertRisks(converted.parsed.risks),
    };
  }

  return converted;
}

/**
 * Get all documents for a user
 */
export async function getAllUserDocuments(userId: string): Promise<DocumentRecord[]> {
  try {
    console.log("[Firestore Documents] getAllUserDocuments called with userId:", userId);
    const constraints = [
      where("userId", "==", userId),
      orderBy("uploadedAt", "desc"),
    ];
    
    const docs = await getDocuments<FirestoreDocumentRecord>(
      COLLECTION_NAME,
      constraints
    );
    
    console.log("[Firestore Documents] Found documents before filtering:", {
      count: docs.length,
      userIds: [...new Set(docs.map(d => d.userId))],
      allMatchUserId: docs.every(d => d.userId === userId),
    });
    
    // CRITICAL: Filter by userId as a safety measure in case query didn't work correctly
    const filteredDocs = docs.filter(doc => {
      const docUserId = doc.userId;
      const matches = docUserId === userId;
      if (!matches) {
        console.warn(`[Firestore Documents] Document ${doc.id} has userId ${docUserId}, expected ${userId} - FILTERING OUT`);
      }
      return matches;
    });
    
    console.log("[Firestore Documents] Documents after filtering:", {
      count: filteredDocs.length,
      filteredOut: docs.length - filteredDocs.length,
    });
    
    return filteredDocs.map(firestoreToDocument);
  } catch (error) {
    console.error("[Firestore Documents] Error getting user documents:", error);
    throw error;
  }
}

/**
 * Get a document by ID
 */
export async function getDocumentById(
  documentId: string,
  userId?: string
): Promise<DocumentRecord | null> {
  try {
    console.log("[Firestore Documents] Getting document:", { documentId, userId });
    
    const doc = await getDocument<FirestoreDocumentRecord>(
      COLLECTION_NAME,
      documentId
    );
    
    console.log("[Firestore Documents] Document from Firestore:", { 
      exists: !!doc, 
      hasUserId: !!doc?.userId,
      docUserId: doc?.userId,
      requestUserId: userId,
      docId: doc?.id,
      requestedId: documentId
    });
    
    if (!doc) {
      console.log("[Firestore Documents] Document not found in Firestore");
      // If userId is provided, try to find document by userId and filePath match
      if (userId) {
        console.log("[Firestore Documents] Attempting to find document by userId and filePath");
        const allDocs = await getAllUserDocuments(userId);
        const foundDoc = allDocs.find(d => d.id === documentId || d.filePath === documentId);
        if (foundDoc) {
          console.log("[Firestore Documents] Found document via fallback search:", foundDoc.id);
          return foundDoc;
        }
      }
      return null;
    }
    
    // If userId is provided, verify ownership
    if (userId && doc.userId !== userId) {
      console.log("[Firestore Documents] Access denied - userId mismatch", {
        docUserId: doc.userId,
        requestUserId: userId
      });
      return null;
    }
    
    const converted = firestoreToDocument(doc);
    console.log("[Firestore Documents] Document converted successfully");
    return converted;
  } catch (error) {
    console.error("[Firestore Documents] Error getting document:", error);
    console.error("[Firestore Documents] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Save a new document
 */
export async function saveDocument(
  document: DocumentRecord,
  userId: string
): Promise<DocumentRecord> {
  try {
    console.log("[Firestore Documents] saveDocument called:", {
      documentId: document.id,
      userId,
      fileName: document.fileName,
    });
    
    const docData = documentToFirestore({ ...document, userId });
    
    // Verify userId is set correctly
    if (docData.userId !== userId) {
      console.error("[Firestore Documents] ERROR: userId mismatch!", {
        expected: userId,
        actual: docData.userId,
      });
      throw new Error(`UserId mismatch: expected ${userId}, got ${docData.userId}`);
    }
    
    // Pass the document ID so it's used as the Firestore document ID
    const docId = await createDocument<FirestoreDocumentRecord>(
      COLLECTION_NAME,
      { ...docData, id: document.id } as any
    );
    
    console.log("[Firestore Documents] Document saved successfully:", {
      documentId: docId,
      userId: docData.userId,
    });
    
    return {
      ...document,
      id: docId,
    };
  } catch (error) {
    console.error("[Firestore Documents] Error saving document:", error);
    throw error;
  }
}

/**
 * Update an existing document
 */
export async function updateDocumentById(
  documentId: string,
  updates: Partial<DocumentRecord>,
  userId?: string
): Promise<void> {
  try {
    // Verify ownership if userId is provided
    if (userId) {
      const existingDoc = await getDocumentById(documentId, userId);
      if (!existingDoc) {
        throw new Error("Document not found or access denied");
      }
    }
    
    const updateData: any = { ...updates };
    if (updateData.uploadedAt) {
      const date = updateData.uploadedAt instanceof Date 
        ? updateData.uploadedAt 
        : new Date(updateData.uploadedAt);
      updateData.uploadedAt = dateToFirestoreTimestamp(date) as Timestamp;
    }
    
    await updateDocument(COLLECTION_NAME, documentId, updateData);
  } catch (error) {
    console.error("[Firestore Documents] Error updating document:", error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocumentById(
  documentId: string,
  userId?: string
): Promise<boolean> {
  try {
    // Verify ownership if userId is provided
    if (userId) {
      const existingDoc = await getDocumentById(documentId, userId);
      if (!existingDoc) {
        return false;
      }
    }
    
    await deleteDocument(COLLECTION_NAME, documentId);
    return true;
  } catch (error) {
    console.error("[Firestore Documents] Error deleting document:", error);
    return false;
  }
}

/**
 * Get documents by type
 */
export async function getDocumentsByType(
  userId: string,
  documentType: string
): Promise<DocumentRecord[]> {
  try {
    const constraints = [
      where("userId", "==", userId),
      where("documentType", "==", documentType),
      orderBy("uploadedAt", "desc"),
    ];
    
    const docs = await getDocuments<FirestoreDocumentRecord>(
      COLLECTION_NAME,
      constraints
    );
    
    return docs.map(firestoreToDocument);
  } catch (error) {
    console.error("[Firestore Documents] Error getting documents by type:", error);
    throw error;
  }
}

/**
 * Get document by filePath (for file serving endpoint)
 */
export async function getDocumentByFilePath(
  filePath: string,
  userId: string
): Promise<DocumentRecord | null> {
  try {
    const constraints = [
      where("userId", "==", userId),
      where("filePath", "==", filePath),
    ];
    
    const docs = await getDocuments<FirestoreDocumentRecord>(
      COLLECTION_NAME,
      constraints
    );
    
    if (docs.length === 0) {
      return null;
    }
    
    // Return first match (should only be one)
    return firestoreToDocument(docs[0]);
  } catch (error) {
    console.error("[Firestore Documents] Error getting document by filePath:", error);
    return null;
  }
}

/**
 * Search documents by filename
 */
export async function searchDocuments(
  userId: string,
  searchTerm: string,
  limitCount: number = 50
): Promise<DocumentRecord[]> {
  try {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or similar
    // For now, we'll get all documents and filter client-side
    const constraints = [
      where("userId", "==", userId),
      orderBy("uploadedAt", "desc"),
      firestoreLimit(limitCount),
    ];
    
    const docs = await getDocuments<FirestoreDocumentRecord>(
      COLLECTION_NAME,
      constraints
    );
    
    // Filter by filename (case-insensitive)
    const filtered = docs.filter((doc) =>
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.map(firestoreToDocument);
  } catch (error) {
    console.error("[Firestore Documents] Error searching documents:", error);
    throw error;
  }
}


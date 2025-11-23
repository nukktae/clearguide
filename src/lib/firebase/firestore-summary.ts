/**
 * Firestore operations for summaries
 */

import {
  Timestamp,
  where,
  orderBy,
} from "firebase/firestore";
import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
} from "./firestore";
import type { Summary } from "@/src/lib/parsing/types";

const SUMMARY_COLLECTION_NAME = "summaries";

/**
 * Summary stored in Firestore
 */
type FirestoreSummary = {
  userId: string;
  documentId: string;
  summary: Summary;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Save summary to Firestore
 */
export async function saveSummary(
  userId: string,
  documentId: string,
  summary: Summary
): Promise<string> {
  try {
    const summaryData: Omit<FirestoreSummary, "id"> = {
      userId,
      documentId,
      summary,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const summaryId = await createDocument<FirestoreSummary>(
      SUMMARY_COLLECTION_NAME,
      summaryData as any
    );
    
    return summaryId;
  } catch (error) {
    console.error("[Firestore Summary] Error saving summary:", error);
    throw error;
  }
}

/**
 * Get summary by ID
 */
export async function getSummaryById(
  summaryId: string,
  userId?: string
): Promise<{ summary: Summary; documentId: string; createdAt: Date; updatedAt: Date } | null> {
  try {
    const summaryDoc = await getDocument<FirestoreSummary>(
      SUMMARY_COLLECTION_NAME,
      summaryId
    );
    
    if (!summaryDoc) {
      return null;
    }
    
    // If userId is provided, verify ownership
    if (userId && summaryDoc.userId !== userId) {
      return null;
    }
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (summaryDoc.createdAt) {
      if (typeof summaryDoc.createdAt.toDate === 'function') {
        createdAt = summaryDoc.createdAt.toDate();
      } else if (summaryDoc.createdAt instanceof Date) {
        createdAt = summaryDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (summaryDoc.updatedAt) {
      if (typeof summaryDoc.updatedAt.toDate === 'function') {
        updatedAt = summaryDoc.updatedAt.toDate();
      } else if (summaryDoc.updatedAt instanceof Date) {
        updatedAt = summaryDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      summary: summaryDoc.summary,
      documentId: summaryDoc.documentId,
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Summary] Error getting summary:", error);
    throw error;
  }
}

/**
 * Get summary by document ID
 */
export async function getSummaryByDocumentId(
  documentId: string,
  userId: string
): Promise<{ id: string; summary: Summary; createdAt: Date; updatedAt: Date } | null> {
  try {
    const constraints = [
      where("documentId", "==", documentId),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];
    
    const summaries = await getDocuments<FirestoreSummary & { id: string }>(
      SUMMARY_COLLECTION_NAME,
      constraints
    );
    
    if (summaries.length === 0) {
      return null;
    }
    
    const summaryDoc = summaries[0];
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (summaryDoc.createdAt) {
      if (typeof summaryDoc.createdAt.toDate === 'function') {
        createdAt = summaryDoc.createdAt.toDate();
      } else if (summaryDoc.createdAt instanceof Date) {
        createdAt = summaryDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (summaryDoc.updatedAt) {
      if (typeof summaryDoc.updatedAt.toDate === 'function') {
        updatedAt = summaryDoc.updatedAt.toDate();
      } else if (summaryDoc.updatedAt instanceof Date) {
        updatedAt = summaryDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      id: summaryDoc.id,
      summary: summaryDoc.summary,
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Summary] Error getting summary by document ID:", error);
    throw error;
  }
}

/**
 * Get all summaries for a user
 */
export async function getAllUserSummaries(userId: string): Promise<Array<{
  id: string;
  documentId: string;
  summary: Summary;
  createdAt: Date;
  updatedAt: Date;
}>> {
  try {
    const constraints = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];
    
    const summaries = await getDocuments<FirestoreSummary & { id: string }>(
      SUMMARY_COLLECTION_NAME,
      constraints
    );
    
    return summaries.map((doc) => {
      // Convert Firestore Timestamp to Date
      let createdAt: Date;
      if (doc.createdAt) {
        if (typeof doc.createdAt.toDate === 'function') {
          createdAt = doc.createdAt.toDate();
        } else if (doc.createdAt instanceof Date) {
          createdAt = doc.createdAt;
        } else {
          createdAt = new Date();
        }
      } else {
        createdAt = new Date();
      }

      let updatedAt: Date;
      if (doc.updatedAt) {
        if (typeof doc.updatedAt.toDate === 'function') {
          updatedAt = doc.updatedAt.toDate();
        } else if (doc.updatedAt instanceof Date) {
          updatedAt = doc.updatedAt;
        } else {
          updatedAt = new Date();
        }
      } else {
        updatedAt = new Date();
      }

      return {
        id: doc.id,
        documentId: doc.documentId,
        summary: doc.summary,
        createdAt,
        updatedAt,
      };
    });
  } catch (error) {
    console.error("[Firestore Summary] Error getting user summaries:", error);
    throw error;
  }
}

/**
 * Update summary
 */
export async function updateSummary(
  summaryId: string,
  userId: string,
  summary: Summary
): Promise<void> {
  try {
    // Verify ownership first
    const existing = await getSummaryById(summaryId, userId);
    if (!existing) {
      throw new Error("Summary not found or access denied");
    }
    
    await updateDocument<FirestoreSummary>(
      SUMMARY_COLLECTION_NAME,
      summaryId,
      {
        summary,
        updatedAt: Timestamp.now(),
      } as any
    );
  } catch (error) {
    console.error("[Firestore Summary] Error updating summary:", error);
    throw error;
  }
}


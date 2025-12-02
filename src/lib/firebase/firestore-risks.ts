/**
 * Firestore operations for risk alerts
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
import type { RiskAlert } from "@/src/lib/parsing/types";

const RISKS_COLLECTION_NAME = "risks";

/**
 * Risk alerts stored in Firestore
 */
type FirestoreRisks = {
  userId: string;
  documentId: string;
  risks: RiskAlert[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Save risk alerts to Firestore
 */
export async function saveRisks(
  userId: string,
  documentId: string,
  risks: RiskAlert[]
): Promise<string> {
  try {
    const risksData: Omit<FirestoreRisks, "id"> = {
      userId,
      documentId,
      risks,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const risksId = await createDocument<FirestoreRisks>(
      RISKS_COLLECTION_NAME,
      risksData as any
    );
    
    return risksId;
  } catch (error) {
    console.error("[Firestore Risks] Error saving risks:", error);
    throw error;
  }
}

/**
 * Get risk alerts by ID
 */
export async function getRisksById(
  risksId: string,
  userId?: string
): Promise<{ risks: RiskAlert[]; documentId: string; createdAt: Date; updatedAt: Date } | null> {
  try {
    const risksDoc = await getDocument<FirestoreRisks>(
      RISKS_COLLECTION_NAME,
      risksId
    );
    
    if (!risksDoc) {
      return null;
    }
    
    // If userId is provided, verify ownership
    if (userId && risksDoc.userId !== userId) {
      return null;
    }
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (risksDoc.createdAt) {
      if (typeof risksDoc.createdAt.toDate === 'function') {
        createdAt = risksDoc.createdAt.toDate();
      } else if (risksDoc.createdAt instanceof Date) {
        createdAt = risksDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (risksDoc.updatedAt) {
      if (typeof risksDoc.updatedAt.toDate === 'function') {
        updatedAt = risksDoc.updatedAt.toDate();
      } else if (risksDoc.updatedAt instanceof Date) {
        updatedAt = risksDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      risks: risksDoc.risks,
      documentId: risksDoc.documentId,
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Risks] Error getting risks:", error);
    throw error;
  }
}

/**
 * Get risk alerts by document ID
 */
export async function getRisksByDocumentId(
  documentId: string,
  userId: string
): Promise<{ id: string; risks: RiskAlert[]; createdAt: Date; updatedAt: Date } | null> {
  try {
    // Try with orderBy first (requires composite index)
    let risksDocs: Array<FirestoreRisks & { id: string }>;
    
    try {
      const constraints = [
        where("documentId", "==", documentId),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      ];
      
      risksDocs = await getDocuments<FirestoreRisks & { id: string }>(
        RISKS_COLLECTION_NAME,
        constraints
      );
    } catch (orderByError: any) {
      // If orderBy fails (likely missing index), try without orderBy
      if (orderByError?.message?.includes("index") || orderByError?.code === "failed-precondition") {
        console.warn("[Firestore Risks] OrderBy failed (missing index), trying without orderBy");
        const constraints = [
          where("documentId", "==", documentId),
          where("userId", "==", userId),
        ];
        
        risksDocs = await getDocuments<FirestoreRisks & { id: string }>(
          RISKS_COLLECTION_NAME,
          constraints
        );
        
        // Sort manually
        risksDocs.sort((a, b) => {
          let aTime: number;
          if (a.createdAt) {
            if (typeof a.createdAt.toDate === 'function') {
              aTime = a.createdAt.toDate().getTime();
            } else if (a.createdAt instanceof Date) {
              aTime = a.createdAt.getTime();
            } else {
              aTime = new Date().getTime();
            }
          } else {
            aTime = new Date().getTime();
          }
          
          let bTime: number;
          if (b.createdAt) {
            if (typeof b.createdAt.toDate === 'function') {
              bTime = b.createdAt.toDate().getTime();
            } else if (b.createdAt instanceof Date) {
              bTime = b.createdAt.getTime();
            } else {
              bTime = new Date().getTime();
            }
          } else {
            bTime = new Date().getTime();
          }
          
          return bTime - aTime; // Descending order
        });
      } else {
        throw orderByError;
      }
    }
    
    if (risksDocs.length === 0) {
      return null;
    }
    
    const risksDoc = risksDocs[0];
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (risksDoc.createdAt) {
      if (typeof risksDoc.createdAt.toDate === 'function') {
        createdAt = risksDoc.createdAt.toDate();
      } else if (risksDoc.createdAt instanceof Date) {
        createdAt = risksDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (risksDoc.updatedAt) {
      if (typeof risksDoc.updatedAt.toDate === 'function') {
        updatedAt = risksDoc.updatedAt.toDate();
      } else if (risksDoc.updatedAt instanceof Date) {
        updatedAt = risksDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      id: risksDoc.id,
      risks: risksDoc.risks,
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Risks] Error getting risks by document ID:", error);
    throw error;
  }
}

/**
 * Get all risk alerts for a user
 */
export async function getAllUserRisks(userId: string): Promise<Array<{
  id: string;
  documentId: string;
  risks: RiskAlert[];
  createdAt: Date;
  updatedAt: Date;
}>> {
  try {
    const constraints = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];
    
    const risksDocs = await getDocuments<FirestoreRisks & { id: string }>(
      RISKS_COLLECTION_NAME,
      constraints
    );
    
    return risksDocs.map((doc) => {
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
        risks: doc.risks,
        createdAt,
        updatedAt,
      };
    });
  } catch (error) {
    console.error("[Firestore Risks] Error getting user risks:", error);
    throw error;
  }
}

/**
 * Update risk alerts
 */
export async function updateRisks(
  risksId: string,
  userId: string,
  risks: RiskAlert[]
): Promise<void> {
  try {
    // Verify ownership first
    const existing = await getRisksById(risksId, userId);
    if (!existing) {
      throw new Error("Risk alerts not found or access denied");
    }
    
    await updateDocument<FirestoreRisks>(
      RISKS_COLLECTION_NAME,
      risksId,
      {
        risks,
        updatedAt: Timestamp.now(),
      } as any
    );
  } catch (error) {
    console.error("[Firestore Risks] Error updating risks:", error);
    throw error;
  }
}


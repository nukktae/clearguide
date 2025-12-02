/**
 * Firestore operations for checklists
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
  getFirestoreTimestamp,
} from "./firestore";
import type { ChecklistItem } from "@/src/lib/parsing/types";

const CHECKLIST_COLLECTION_NAME = "checklists";

/**
 * Convert deadline from Timestamp/Date to string (YYYY-MM-DD)
 */
function convertDeadlineToString(deadline: any): string | undefined {
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
}

/**
 * Convert actions array, converting deadline fields from Timestamp to string
 * Also ensures each action has a valid string ID
 */
function convertActionsDeadlines(actions: ChecklistItem[]): ChecklistItem[] {
  return actions.map((action, index) => {
    // Ensure ID is a string (not an object)
    let actionId: string;
    if (action.id && typeof action.id === "string") {
      actionId = action.id;
    } else if (action.id && typeof action.id === "object") {
      // If ID is an object, generate a new one
      actionId = `action-${Date.now()}-${index}`;
      console.warn(`[Firestore Checklist] Action ID was an object, generated new ID: ${actionId}`);
    } else {
      // If ID is missing, generate one
      actionId = `action-${Date.now()}-${index}`;
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
}

/**
 * Checklist stored in Firestore
 */
type FirestoreChecklist = {
  userId: string;
  documentId: string;
  actions: ChecklistItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Save checklist to Firestore
 */
export async function saveChecklist(
  userId: string,
  documentId: string,
  actions: ChecklistItem[]
): Promise<string> {
  try {
    const now = getFirestoreTimestamp();
    const checklistData: Omit<FirestoreChecklist, "id"> = {
      userId,
      documentId,
      actions,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
    };
    
    const checklistId = await createDocument<FirestoreChecklist>(
      CHECKLIST_COLLECTION_NAME,
      checklistData as any
    );
    
    return checklistId;
  } catch (error) {
    console.error("[Firestore Checklist] Error saving checklist:", error);
    throw error;
  }
}

/**
 * Get checklist by ID
 */
export async function getChecklistById(
  checklistId: string,
  userId?: string
): Promise<{ actions: ChecklistItem[]; documentId: string; createdAt: Date; updatedAt: Date } | null> {
  try {
    const checklistDoc = await getDocument<FirestoreChecklist>(
      CHECKLIST_COLLECTION_NAME,
      checklistId
    );
    
    if (!checklistDoc) {
      return null;
    }
    
    // If userId is provided, verify ownership
    if (userId && checklistDoc.userId !== userId) {
      return null;
    }
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (checklistDoc.createdAt) {
      if (typeof checklistDoc.createdAt.toDate === 'function') {
        createdAt = checklistDoc.createdAt.toDate();
      } else if (checklistDoc.createdAt instanceof Date) {
        createdAt = checklistDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (checklistDoc.updatedAt) {
      if (typeof checklistDoc.updatedAt.toDate === 'function') {
        updatedAt = checklistDoc.updatedAt.toDate();
      } else if (checklistDoc.updatedAt instanceof Date) {
        updatedAt = checklistDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      actions: convertActionsDeadlines(checklistDoc.actions),
      documentId: checklistDoc.documentId,
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Checklist] Error getting checklist:", error);
    throw error;
  }
}

/**
 * Get checklist by document ID
 */
export async function getChecklistByDocumentId(
  documentId: string,
  userId: string
): Promise<{ id: string; actions: ChecklistItem[]; createdAt: Date; updatedAt: Date } | null> {
  try {
    console.log("[Firestore Checklist] Getting checklist by documentId:", { documentId, userId });
    
    let checklists: Array<FirestoreChecklist & { id: string }>;
    
    // Try with orderBy first (requires composite index)
    try {
      const constraints = [
        where("documentId", "==", documentId),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
      ];
      
      checklists = await getDocuments<FirestoreChecklist & { id: string }>(
        CHECKLIST_COLLECTION_NAME,
        constraints
      );
      
      console.log("[Firestore Checklist] Checklist found with orderBy");
    } catch (orderByError: any) {
      // If orderBy fails (likely missing index), try without orderBy
      if (orderByError?.message?.includes("index") || orderByError?.code === "failed-precondition") {
        console.warn("[Firestore Checklist] OrderBy failed (missing index), trying without orderBy");
        const constraints = [
          where("documentId", "==", documentId),
          where("userId", "==", userId),
        ];
        
        checklists = await getDocuments<FirestoreChecklist & { id: string }>(
          CHECKLIST_COLLECTION_NAME,
          constraints
        );
        
        // Sort manually
        checklists.sort((a, b) => {
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
          
          return bTime - aTime;
        });
        
        console.log("[Firestore Checklist] Checklist found without orderBy (sorted manually)");
      } else {
        throw orderByError;
      }
    }
    
    if (checklists.length === 0) {
      console.log("[Firestore Checklist] No checklist found");
      return null;
    }
    
    const checklistDoc = checklists[0];
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (checklistDoc.createdAt) {
      if (typeof checklistDoc.createdAt.toDate === 'function') {
        createdAt = checklistDoc.createdAt.toDate();
      } else if (checklistDoc.createdAt instanceof Date) {
        createdAt = checklistDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }

    let updatedAt: Date;
    if (checklistDoc.updatedAt) {
      if (typeof checklistDoc.updatedAt.toDate === 'function') {
        updatedAt = checklistDoc.updatedAt.toDate();
      } else if (checklistDoc.updatedAt instanceof Date) {
        updatedAt = checklistDoc.updatedAt;
      } else {
        updatedAt = new Date();
      }
    } else {
      updatedAt = new Date();
    }
    
    return {
      id: checklistDoc.id,
      actions: convertActionsDeadlines(checklistDoc.actions),
      createdAt,
      updatedAt,
    };
  } catch (error) {
    console.error("[Firestore Checklist] Error getting checklist by document ID:", error);
    throw error;
  }
}

/**
 * Get all checklists for a user
 */
export async function getAllUserChecklists(userId: string): Promise<Array<{
  id: string;
  documentId: string;
  actions: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}>> {
  try {
    const constraints = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];
    
    const checklists = await getDocuments<FirestoreChecklist & { id: string }>(
      CHECKLIST_COLLECTION_NAME,
      constraints
    );
    
    return checklists.map((doc) => {
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
        actions: convertActionsDeadlines(doc.actions),
        createdAt,
        updatedAt,
      };
    });
  } catch (error) {
    console.error("[Firestore Checklist] Error getting user checklists:", error);
    throw error;
  }
}

/**
 * Update checklist (e.g., mark items as completed)
 */
export async function updateChecklist(
  checklistId: string,
  userId: string,
  actions: ChecklistItem[]
): Promise<void> {
  try {
    // Verify ownership first
    const existing = await getChecklistById(checklistId, userId);
    if (!existing) {
      throw new Error("Checklist not found or access denied");
    }
    
    const updateNow = getFirestoreTimestamp();
    await updateDocument<FirestoreChecklist>(
      CHECKLIST_COLLECTION_NAME,
      checklistId,
      {
        actions,
        updatedAt: updateNow as Timestamp,
      } as any
    );
  } catch (error) {
    console.error("[Firestore Checklist] Error updating checklist:", error);
    throw error;
  }
}


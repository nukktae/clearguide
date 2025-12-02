/**
 * Firestore operations for OCR results
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
  deleteDocument,
  firestoreQuery,
  getFirestoreTimestamp,
} from "./firestore";

const OCR_COLLECTION_NAME = "ocr_results";

/**
 * OCR Result stored in Firestore
 */
type FirestoreOCRResult = {
  userId: string;
  text: string;
  confidence?: number;
  pageCount?: number;
  fileType: string;
  fileName: string;
  documentId?: string; // Optional: link to document
  createdAt: Timestamp;
};

/**
 * Save OCR result to Firestore
 */
export async function saveOCRResult(
  userId: string,
  text: string,
  fileType: string,
  fileName: string,
  confidence?: number,
  pageCount?: number,
  documentId?: string
): Promise<string> {
  try {
    const ocrData: Omit<FirestoreOCRResult, "id"> = {
      userId,
      text,
      confidence,
      pageCount,
      fileType,
      fileName,
      documentId,
      createdAt: getFirestoreTimestamp() as Timestamp,
    };
    
    const ocrId = await createDocument<FirestoreOCRResult>(
      OCR_COLLECTION_NAME,
      ocrData as any
    );
    
    return ocrId;
  } catch (error) {
    console.error("[Firestore OCR] Error saving OCR result:", error);
    throw error;
  }
}

/**
 * Get OCR result by ID
 */
export async function getOCRResultById(
  ocrId: string,
  userId?: string
): Promise<{ text: string; confidence?: number; pageCount?: number } | null> {
  try {
    const ocrDoc = await getDocument<FirestoreOCRResult>(
      OCR_COLLECTION_NAME,
      ocrId
    );
    
    if (!ocrDoc) {
      return null;
    }
    
    // If userId is provided, verify ownership
    if (userId && ocrDoc.userId !== userId) {
      return null;
    }
    
    return {
      text: ocrDoc.text,
      confidence: ocrDoc.confidence,
      pageCount: ocrDoc.pageCount,
    };
  } catch (error) {
    console.error("[Firestore OCR] Error getting OCR result:", error);
    throw error;
  }
}

/**
 * Get OCR result by documentId (preferred method)
 */
export async function getOCRResultByDocumentId(
  documentId: string,
  userId: string
): Promise<{ id: string; text: string; confidence?: number; pageCount?: number; createdAt: Date } | null> {
  try {
    console.log("[Firestore OCR] Getting OCR result by documentId:", { documentId, userId });
    
    const constraints = [
      where("documentId", "==", documentId),
      where("userId", "==", userId),
    ];
    
    const ocrDocs = await getDocuments<FirestoreOCRResult & { id: string }>(
      OCR_COLLECTION_NAME,
      constraints
    );
    
    if (ocrDocs.length === 0) {
      console.log("[Firestore OCR] No OCR result found for documentId:", documentId);
      return null;
    }
    
    // Sort manually by createdAt (most recent first)
    ocrDocs.sort((a, b) => {
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
    
    const ocrDoc = ocrDocs[0];
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (ocrDoc.createdAt) {
      if (typeof ocrDoc.createdAt.toDate === 'function') {
        createdAt = ocrDoc.createdAt.toDate();
      } else if (ocrDoc.createdAt instanceof Date) {
        createdAt = ocrDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }
    
    console.log("[Firestore OCR] OCR result found by documentId:", { id: ocrDoc.id, textLength: ocrDoc.text.length });
    
    return {
      id: ocrDoc.id,
      text: ocrDoc.text,
      confidence: ocrDoc.confidence,
      pageCount: ocrDoc.pageCount,
      createdAt,
    };
  } catch (error) {
    console.error("[Firestore OCR] Error getting OCR result by documentId:", error);
    return null;
  }
}

/**
 * Get OCR result by document fileName (for matching with document)
 */
export async function getOCRResultByFileName(
  fileName: string,
  userId: string
): Promise<{ id: string; text: string; confidence?: number; pageCount?: number; createdAt: Date } | null> {
  try {
    console.log("[Firestore OCR] Getting OCR result by fileName:", { fileName, userId });
    
    const constraints = [
      where("fileName", "==", fileName),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];
    
    const ocrDocs = await getDocuments<FirestoreOCRResult & { id: string }>(
      OCR_COLLECTION_NAME,
      constraints
    );
    
    if (ocrDocs.length === 0) {
      console.log("[Firestore OCR] No OCR result found for fileName:", fileName);
      return null;
    }
    
    const ocrDoc = ocrDocs[0];
    
    // Convert Firestore Timestamp to Date
    let createdAt: Date;
    if (ocrDoc.createdAt) {
      if (typeof ocrDoc.createdAt.toDate === 'function') {
        createdAt = ocrDoc.createdAt.toDate();
      } else if (ocrDoc.createdAt instanceof Date) {
        createdAt = ocrDoc.createdAt;
      } else {
        createdAt = new Date();
      }
    } else {
      createdAt = new Date();
    }
    
    console.log("[Firestore OCR] OCR result found:", { id: ocrDoc.id, textLength: ocrDoc.text.length });
    
    return {
      id: ocrDoc.id,
      text: ocrDoc.text,
      confidence: ocrDoc.confidence,
      pageCount: ocrDoc.pageCount,
      createdAt,
    };
  } catch (error) {
    console.error("[Firestore OCR] Error getting OCR result by fileName:", error);
    // If orderBy fails (missing index), try without orderBy
    if (error instanceof Error && (error.message.includes("index") || (error as any).code === "failed-precondition")) {
      console.warn("[Firestore OCR] OrderBy failed, trying without orderBy");
      try {
        const constraints = [
          where("fileName", "==", fileName),
          where("userId", "==", userId),
        ];
        
        const ocrDocs = await getDocuments<FirestoreOCRResult & { id: string }>(
          OCR_COLLECTION_NAME,
          constraints
        );
        
        if (ocrDocs.length === 0) {
          return null;
        }
        
        // Sort manually
        ocrDocs.sort((a, b) => {
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
        
        const ocrDoc = ocrDocs[0];
        
        let createdAt: Date;
        if (ocrDoc.createdAt) {
          if (typeof ocrDoc.createdAt.toDate === 'function') {
            createdAt = ocrDoc.createdAt.toDate();
          } else if (ocrDoc.createdAt instanceof Date) {
            createdAt = ocrDoc.createdAt;
          } else {
            createdAt = new Date();
          }
        } else {
          createdAt = new Date();
        }
        
        return {
          id: ocrDoc.id,
          text: ocrDoc.text,
          confidence: ocrDoc.confidence,
          pageCount: ocrDoc.pageCount,
          createdAt,
        };
      } catch (fallbackError) {
        console.error("[Firestore OCR] Fallback query also failed:", fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

/**
 * Get all OCR results for a user
 */
export async function getAllUserOCRResults(userId: string): Promise<Array<{
  id: string;
  text: string;
  confidence?: number;
  pageCount?: number;
  fileType: string;
  fileName: string;
  createdAt: Date;
}>> {
  try {
    const constraints = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
    ];
    
    const ocrDocs = await getDocuments<FirestoreOCRResult & { id: string }>(
      OCR_COLLECTION_NAME,
      constraints
    );
    
    return ocrDocs.map((doc) => {
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

      return {
        id: doc.id,
        text: doc.text,
        confidence: doc.confidence,
        pageCount: doc.pageCount,
        fileType: doc.fileType,
        fileName: doc.fileName,
        createdAt,
      };
    });
  } catch (error) {
    console.error("[Firestore OCR] Error getting user OCR results:", error);
    throw error;
  }
}

/**
 * Delete OCR result by fileName
 */
export async function deleteOCRResultByFileName(
  fileName: string,
  userId: string
): Promise<boolean> {
  try {
    const constraints = [
      where("fileName", "==", fileName),
      where("userId", "==", userId),
    ];
    
    const ocrDocs = await getDocuments<FirestoreOCRResult & { id: string }>(
      OCR_COLLECTION_NAME,
      constraints
    );
    
    // Delete all OCR results for this fileName
    for (const ocrDoc of ocrDocs) {
      await deleteDocument(OCR_COLLECTION_NAME, ocrDoc.id);
    }
    
    return true;
  } catch (error) {
    console.error("[Firestore OCR] Error deleting OCR result:", error);
    return false;
  }
}

/**
 * Delete OCR result by ID
 */
export async function deleteOCRResultById(
  ocrId: string,
  userId?: string
): Promise<boolean> {
  try {
    // Verify ownership if userId is provided
    if (userId) {
      const ocrDoc = await getDocument<FirestoreOCRResult>(
        OCR_COLLECTION_NAME,
        ocrId
      );
      
      if (!ocrDoc || ocrDoc.userId !== userId) {
        return false;
      }
    }
    
    await deleteDocument(OCR_COLLECTION_NAME, ocrId);
    return true;
  } catch (error) {
    console.error("[Firestore OCR] Error deleting OCR result:", error);
    return false;
  }
}


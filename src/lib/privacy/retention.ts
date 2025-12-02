/**
 * Retention & Auto-Delete System
 * Document lifecycle management with TTL tracking
 */

import { Timestamp, where } from 'firebase/firestore';
import {
  getDocument,
  getDocuments,
  createDocument,
  deleteDocument,
  updateDocument,
} from '@/src/lib/firebase/firestore';

const RETENTION_COLLECTION = 'document_retention';

/**
 * Retention record in Firestore
 */
interface RetentionRecord {
  documentId: string;
  userId: string;
  expiresAt: Timestamp | Date | string;
  autoDelete: boolean;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
}

/**
 * Save document with TTL (Time To Live)
 */
export async function saveWithTTL(
  documentId: string,
  userId: string,
  ttlInHours: number
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlInHours);
    
    const retentionData: Omit<RetentionRecord, 'id'> = {
      documentId,
      userId,
      expiresAt: Timestamp.fromDate(expiresAt),
      autoDelete: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Use documentId as the Firestore document ID for easy lookup
    await createDocument<RetentionRecord>(
      RETENTION_COLLECTION,
      { ...retentionData, id: documentId } as any
    );
    
    console.log(`[Retention] Saved TTL for document ${documentId}: expires in ${ttlInHours} hours`);
  } catch (error) {
    console.error('[Retention] Error saving TTL:', error);
    throw error;
  }
}

/**
 * Schedule deletion for a document
 */
export async function scheduleDeletion(
  documentId: string,
  userId: string,
  ttlInHours: number
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlInHours);
    
    const retentionData: Omit<RetentionRecord, 'id'> = {
      documentId,
      userId,
      expiresAt: Timestamp.fromDate(expiresAt),
      autoDelete: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Use documentId as the Firestore document ID
    await createDocument<RetentionRecord>(
      RETENTION_COLLECTION,
      { ...retentionData, id: documentId } as any
    );
    
    console.log(`[Retention] Scheduled deletion for document ${documentId}: expires in ${ttlInHours} hours`);
  } catch (error) {
    console.error('[Retention] Error scheduling deletion:', error);
    throw error;
  }
}

/**
 * Check if document has expired and delete if so
 */
export async function deleteIfExpired(
  documentId: string,
  userId: string
): Promise<boolean> {
  try {
    const retentionDoc = await getDocument<RetentionRecord>(
      RETENTION_COLLECTION,
      documentId
    );
    
    if (!retentionDoc) {
      return false; // No retention record, not expired
    }
    
    // Verify ownership
    if (retentionDoc.userId !== userId) {
      console.warn(`[Retention] User ${userId} attempted to check expiration for document ${documentId} owned by ${retentionDoc.userId}`);
      return false;
    }
    
    // Get expiration time
    let expiresAt: Date;
    if (retentionDoc.expiresAt instanceof Timestamp) {
      expiresAt = retentionDoc.expiresAt.toDate();
    } else if (retentionDoc.expiresAt instanceof Date) {
      expiresAt = retentionDoc.expiresAt;
    } else {
      expiresAt = new Date(retentionDoc.expiresAt);
    }
    
    // Check if expired
    const now = new Date();
    if (now >= expiresAt) {
      console.log(`[Retention] Document ${documentId} has expired, deleting...`);
      await deleteNow(documentId, userId);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Retention] Error checking expiration:', error);
    return false;
  }
}

/**
 * Delete document immediately (document, OCR result, file, RAG chunks, canonical data)
 */
export async function deleteNow(
  documentId: string,
  userId: string
): Promise<boolean> {
  try {
    console.log(`[Retention] Deleting document ${documentId} and all related data...`);
    
    // Import deletion functions
    const { deleteDocumentAndRelatedData } = await import('@/src/lib/storage/files');
    
    // Delete all related data
    await deleteDocumentAndRelatedData(documentId, userId);
    
    // Delete retention record
    try {
      await deleteDocument(RETENTION_COLLECTION, documentId);
    } catch (error) {
      // Non-critical if retention record doesn't exist
      console.warn('[Retention] Could not delete retention record:', error);
    }
    
    console.log(`[Retention] Successfully deleted document ${documentId} and all related data`);
    return true;
  } catch (error) {
    console.error('[Retention] Error deleting document:', error);
    return false;
  }
}

/**
 * Get retention record for a document
 */
export async function getRetentionRecord(
  documentId: string,
  userId: string
): Promise<RetentionRecord | null> {
  try {
    const retentionDoc = await getDocument<RetentionRecord>(
      RETENTION_COLLECTION,
      documentId
    );
    
    if (!retentionDoc) {
      return null;
    }
    
    // Verify ownership
    if (retentionDoc.userId !== userId) {
      return null;
    }
    
    return retentionDoc;
  } catch (error) {
    console.error('[Retention] Error getting retention record:', error);
    return null;
  }
}

/**
 * Update retention record
 */
export async function updateRetentionRecord(
  documentId: string,
  userId: string,
  updates: Partial<RetentionRecord>
): Promise<void> {
  try {
    // Verify ownership
    const existing = await getRetentionRecord(documentId, userId);
    if (!existing) {
      throw new Error('Retention record not found or access denied');
    }
    
    await updateDocument<RetentionRecord>(
      RETENTION_COLLECTION,
      documentId,
      {
        ...updates,
        updatedAt: Timestamp.now(),
      } as any
    );
  } catch (error) {
    console.error('[Retention] Error updating retention record:', error);
    throw error;
  }
}

/**
 * Get all expired documents for a user (for cleanup jobs)
 */
export async function getExpiredDocuments(userId: string): Promise<string[]> {
  try {
    const now = Timestamp.now();
    const constraints = [
      where('userId', '==', userId),
      where('expiresAt', '<=', now),
    ];
    
    const expiredRecords = await getDocuments<RetentionRecord>(
      RETENTION_COLLECTION,
      constraints
    );
    
    return expiredRecords.map(record => record.documentId);
  } catch (error) {
    console.error('[Retention] Error getting expired documents:', error);
    return [];
  }
}


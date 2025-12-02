/**
 * Firestore operations for privacy settings
 */

import { Timestamp } from 'firebase/firestore';
import {
  getDocument,
  createDocument,
  updateDocument,
  getFirestoreTimestamp,
} from './firestore';
import type { PrivacySettings } from '@/src/lib/privacy/settings';
import { DEFAULT_PRIVACY_SETTINGS } from '@/src/lib/privacy/settings';

const COLLECTION_NAME = 'user_privacy_settings';

/**
 * Firestore privacy settings type with Timestamp fields
 */
type FirestorePrivacySettings = PrivacySettings & {
  userId: string;
  createdAt?: Timestamp | Date | string;
  updatedAt?: Timestamp | Date | string;
};

/**
 * Get privacy settings for a user
 * Returns default settings if none exist
 */
export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  try {
    const doc = await getDocument<FirestorePrivacySettings>(
      COLLECTION_NAME,
      userId
    );
    
    if (!doc) {
      // Return defaults if no settings exist
      return DEFAULT_PRIVACY_SETTINGS;
    }
    
    // Return settings (excluding Firestore metadata)
    return {
      maskBeforeLLM: doc.maskBeforeLLM ?? DEFAULT_PRIVACY_SETTINGS.maskBeforeLLM,
      outgoingMasking: doc.outgoingMasking ?? DEFAULT_PRIVACY_SETTINGS.outgoingMasking,
      autoDelete: doc.autoDelete ?? DEFAULT_PRIVACY_SETTINGS.autoDelete,
      maskingMode: doc.maskingMode ?? DEFAULT_PRIVACY_SETTINGS.maskingMode,
      localOnly: doc.localOnly ?? DEFAULT_PRIVACY_SETTINGS.localOnly,
    };
  } catch (error) {
    console.error('[Firestore Privacy] Error getting privacy settings:', error);
    // Return defaults on error
    return DEFAULT_PRIVACY_SETTINGS;
  }
}

/**
 * Save privacy settings for a user
 */
export async function savePrivacySettings(
  userId: string,
  settings: PrivacySettings
): Promise<void> {
  try {
    const now = getFirestoreTimestamp();
    const data: Omit<FirestorePrivacySettings, 'id'> = {
      userId,
      ...settings,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
    };
    
    // Use userId as document ID
    await createDocument<FirestorePrivacySettings>(
      COLLECTION_NAME,
      { ...data, id: userId } as any
    );
    
    console.log(`[Firestore Privacy] Saved privacy settings for user ${userId}`);
  } catch (error) {
    console.error('[Firestore Privacy] Error saving privacy settings:', error);
    throw error;
  }
}

/**
 * Update privacy settings for a user
 */
export async function updatePrivacySettings(
  userId: string,
  updates: Partial<PrivacySettings>
): Promise<void> {
  try {
    // Get existing settings to merge
    const existing = await getPrivacySettings(userId);
    const merged = { ...existing, ...updates };
    
    // Save merged settings
    await savePrivacySettings(userId, merged);
    
    console.log(`[Firestore Privacy] Updated privacy settings for user ${userId}`);
  } catch (error) {
    console.error('[Firestore Privacy] Error updating privacy settings:', error);
    throw error;
  }
}


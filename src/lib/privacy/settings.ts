/**
 * Privacy Settings Management
 * User-level privacy controls
 */

export interface PrivacySettings {
  maskBeforeLLM: boolean;        // Mask before sending to OpenAI
  outgoingMasking: boolean;      // Mask LLM responses
  autoDelete: 'none' | '24h' | 'immediate';
  maskingMode: 'minimal' | 'strict';
  localOnly: boolean;           // Disable LLM calls (optional Phase 8)
}

/**
 * Default privacy settings
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  maskBeforeLLM: true,
  outgoingMasking: true,
  autoDelete: '24h',
  maskingMode: 'strict',
  localOnly: false,
};

/**
 * Get default privacy settings
 */
export function getDefaultPrivacySettings(): PrivacySettings {
  return { ...DEFAULT_PRIVACY_SETTINGS };
}


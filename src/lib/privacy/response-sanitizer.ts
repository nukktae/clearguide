/**
 * Response Sanitizer
 * Prevents PII leakage in LLM output by re-masking any detected PII
 */

import { maskAll } from './masker';

/**
 * Sanitize LLM response by re-masking any PII
 * Uses strict mode by default to catch all PII types
 */
export function sanitizeLLMResponse(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }
  
  // Use strict mode to catch all PII types
  const result = maskAll(text, {
    mode: 'strict',
    preserveFormat: true,
  });
  
  // Log if PII was found and masked
  if (result.metadata.maskedItems.length > 0) {
    console.warn('[Response Sanitizer] Detected and masked PII in LLM response:', {
      piiTypes: result.metadata.piiTypes,
      itemsCount: result.metadata.maskedItems.length,
    });
  }
  
  return result.maskedText;
}


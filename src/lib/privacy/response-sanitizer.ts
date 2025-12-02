/**
 * Response Sanitizer
 * Prevents PII leakage in LLM output by re-masking any detected PII
 */

import { maskAll } from './masker';
import { dedupeOCRText } from '../ocr/textCleaner';

/**
 * Sanitize LLM response by re-masking any PII
 * Uses strict mode by default to catch all PII types
 * Also cleans up duplicate lines and repeated patterns (common in OCR output)
 */
export function sanitizeLLMResponse(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }
  
  // First, clean up duplicate lines and repeated patterns (common in OCR output)
  const { cleanedText, stats } = dedupeOCRText(text);
  if (stats.duplicateLinesRemoved > 0 || stats.repeatedPatternsRemoved > 0 || stats.consecutiveBlocksCollapsed > 0) {
    console.log('[Response Sanitizer] Cleaned duplicate lines:', {
      duplicateLinesRemoved: stats.duplicateLinesRemoved,
      repeatedPatternsRemoved: stats.repeatedPatternsRemoved,
      consecutiveBlocksCollapsed: stats.consecutiveBlocksCollapsed,
    });
  }
  
  // Use strict mode to catch all PII types
  const result = maskAll(cleanedText, {
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


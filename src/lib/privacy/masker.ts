/**
 * PII Masking Engine
 * Core masking logic with minimal/strict modes
 */

import { detectPII, maskPII, type PIIItem, type MaskOptions } from './pii-rules';

export interface MaskOptionsFull {
  mode?: 'minimal' | 'strict';
  preserveFormat?: boolean;
  maskChar?: string;
}

export interface MaskResult {
  maskedText: string;
  metadata: {
    maskedItems: PIIItem[];
    originalLength: number;
    maskedLength: number;
    piiTypes: string[];
  };
}

/**
 * PII types for minimal mode (strong identifiers only)
 */
const MINIMAL_MODE_TYPES = ['ssn', 'account', 'phone'];

/**
 * Mask all PII in text based on mode
 */
export function maskAll(text: string, options: MaskOptionsFull = {}): MaskResult {
  const { mode = 'strict', preserveFormat = true, maskChar = '*' } = options;
  
  // Detect all PII
  const allItems = detectPII(text);
  
  // Filter by mode
  let itemsToMask: PIIItem[];
  if (mode === 'minimal') {
    // Only mask strong identifiers
    itemsToMask = allItems.filter(item => MINIMAL_MODE_TYPES.includes(item.type));
  } else {
    // Strict mode: mask everything
    itemsToMask = allItems;
  }
  
  // Mask the text
  const maskOptions: MaskOptions = { preserveFormat, maskChar };
  let maskedText = text;
  
  // Process from end to start to preserve indices
  for (let i = itemsToMask.length - 1; i >= 0; i--) {
    const item = itemsToMask[i];
    const originalValue = item.value;
    let maskedValue: string;
    
    // Apply masking based on type
    switch (item.type) {
      case 'ssn':
        // 990101-*******
        maskedValue = originalValue.substring(0, 7) + maskChar.repeat(7);
        break;
        
      case 'account':
        // Preserve format: 301-****-****-90
        if (preserveFormat && originalValue.includes('-')) {
          const parts = originalValue.split('-');
          if (parts.length >= 2) {
            const firstPart = parts[0];
            const lastPart = parts[parts.length - 1];
            const middleParts = parts.slice(1, -1).map(() => maskChar.repeat(4));
            maskedValue = [firstPart, ...middleParts, lastPart].join('-');
          } else {
            maskedValue = maskChar.repeat(originalValue.length);
          }
        } else {
          // Mask all but first 2 and last 2 digits
          if (originalValue.length >= 4) {
            const firstTwo = originalValue.substring(0, 2);
            const lastTwo = originalValue.substring(originalValue.length - 2);
            const middle = maskChar.repeat(Math.max(0, originalValue.length - 4));
            maskedValue = firstTwo + middle + lastTwo;
          } else {
            maskedValue = maskChar.repeat(originalValue.length);
          }
        }
        break;
        
      case 'phone':
        // 010-****-****
        if (preserveFormat && originalValue.includes('-')) {
          const parts = originalValue.split('-');
          if (parts.length >= 2) {
            const firstPart = parts[0];
            const rest = parts.slice(1).map(() => maskChar.repeat(4));
            maskedValue = [firstPart, ...rest].join('-');
          } else {
            maskedValue = maskChar.repeat(originalValue.length);
          }
        } else {
          maskedValue = maskChar.repeat(originalValue.length);
        }
        break;
        
      case 'email':
        // user@****.com
        const [localPart, domain] = originalValue.split('@');
        if (domain) {
          const [domainName, ...tldParts] = domain.split('.');
          const tld = tldParts.join('.');
          maskedValue = localPart + '@' + maskChar.repeat(Math.max(3, domainName.length)) + '.' + tld;
        } else {
          maskedValue = maskChar.repeat(originalValue.length);
        }
        break;
        
      case 'name':
        // 홍** (mask last 1-2 characters)
        if (originalValue.length >= 2) {
          const visibleChars = Math.max(1, Math.floor(originalValue.length / 2));
          maskedValue = originalValue.substring(0, visibleChars) + maskChar.repeat(originalValue.length - visibleChars);
        } else {
          maskedValue = maskChar.repeat(originalValue.length);
        }
        break;
        
      case 'address':
        // 서울시 강남구 ***동
        const addressParts = originalValue.split(/\s+/);
        if (addressParts.length >= 2) {
          const lastPart = addressParts[addressParts.length - 1];
          const maskedLastPart = maskChar.repeat(Math.max(1, Math.floor(lastPart.length / 2))) + lastPart.substring(Math.floor(lastPart.length / 2));
          maskedValue = addressParts.slice(0, -1).join(' ') + ' ' + maskedLastPart;
        } else {
          maskedValue = maskChar.repeat(originalValue.length);
        }
        break;
        
      case 'card':
        // 1234-****-****-5678
        if (preserveFormat && originalValue.includes('-')) {
          const parts = originalValue.split('-');
          if (parts.length === 4) {
            maskedValue = parts[0] + '-' + maskChar.repeat(4) + '-' + maskChar.repeat(4) + '-' + parts[3];
          } else {
            maskedValue = maskChar.repeat(originalValue.length);
          }
        } else {
          // Mask middle 8 digits
          if (originalValue.length >= 8) {
            const firstFour = originalValue.substring(0, 4);
            const lastFour = originalValue.substring(originalValue.length - 4);
            maskedValue = firstFour + maskChar.repeat(8) + lastFour;
          } else {
            maskedValue = maskChar.repeat(originalValue.length);
          }
        }
        break;
        
      default:
        maskedValue = maskChar.repeat(originalValue.length);
    }
    
    // Replace in text
    maskedText = maskedText.substring(0, item.startIndex) + maskedValue + maskedText.substring(item.endIndex);
  }
  
  // Get unique PII types
  const piiTypes = [...new Set(itemsToMask.map(item => item.type))];
  
  return {
    maskedText,
    metadata: {
      maskedItems: itemsToMask,
      originalLength: text.length,
      maskedLength: maskedText.length,
      piiTypes,
    },
  };
}


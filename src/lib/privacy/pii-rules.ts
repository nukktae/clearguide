/**
 * PII Detection Rules
 * Regex-based detectors for Korean PII (Personally Identifiable Information)
 */

export interface PIIItem {
  type: string;
  value: string;
  startIndex: number;
  endIndex: number;
}

export interface MaskOptions {
  preserveFormat?: boolean;
  maskChar?: string;
}

/**
 * Detect Korean 주민등록번호 (SSN)
 * Format: 6 digits - 7 digits
 * First digit of first 6 digits should be 0-4 (birth year indicator)
 */
function detectSSN(text: string): PIIItem[] {
  const items: PIIItem[] = [];
  // Pattern: 6 digits - 7 digits
  const ssnPattern = /\b(\d{6})-(\d{7})\b/g;
  let match: RegExpExecArray | null;

  while ((match = ssnPattern.exec(text)) !== null) {
    const firstSix = match[1];
    // Validate: first digit should be 0-4 for valid birth year indicator
    if (firstSix[0] >= '0' && firstSix[0] <= '4') {
      items.push({
        type: 'ssn',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return items;
}

/**
 * Detect 계좌번호 (Account Numbers)
 * Format: 10-14 digits, optionally with hyphens
 * Common patterns: 301-1234-5678-90, 1234567890, etc.
 */
function detectAccountNumber(text: string): PIIItem[] {
  const items: PIIItem[] = [];
  
  // Pattern 1: With hyphens (e.g., 301-1234-5678-90)
  const hyphenPattern = /\b(\d{2,4})-(\d{3,4})-(\d{3,4})-(\d{2,4})\b/g;
  let match: RegExpExecArray | null;
  
  while ((match = hyphenPattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const totalDigits = fullMatch.replace(/-/g, '').length;
    // Account numbers are typically 10-14 digits
    if (totalDigits >= 10 && totalDigits <= 14) {
      items.push({
        type: 'account',
        value: fullMatch,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
      });
    }
  }

  // Pattern 2: Plain digits (10-14 digits)
  const plainPattern = /\b(\d{10,14})\b/g;
  while ((match = plainPattern.exec(text)) !== null) {
    // Avoid matching SSNs (already detected)
    const isSSN = /\d{6}-\d{7}/.test(text.substring(Math.max(0, match.index - 10), match.index + match[0].length + 10));
    if (!isSSN) {
      items.push({
        type: 'account',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return items;
}

/**
 * Detect 전화번호 (Phone Numbers)
 * Formats: 010-XXXX-XXXX, 02-XXXX-XXXX, 031-XXX-XXXX, etc.
 */
function detectPhoneNumber(text: string): PIIItem[] {
  const items: PIIItem[] = [];
  
  // Mobile: 010-XXXX-XXXX, 011-XXXX-XXXX, 016-XXXX-XXXX, etc.
  const mobilePattern = /\b(01[0-9])-(\d{3,4})-(\d{4})\b/g;
  let match: RegExpExecArray | null;
  
  while ((match = mobilePattern.exec(text)) !== null) {
    items.push({
      type: 'phone',
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Landline: 02-XXXX-XXXX, 031-XXX-XXXX, 032-XXX-XXXX, etc.
  const landlinePattern = /\b(0[2-9]\d{1,2})-(\d{3,4})-(\d{4})\b/g;
  while ((match = landlinePattern.exec(text)) !== null) {
    items.push({
      type: 'phone',
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return items;
}

/**
 * Detect 주소 (Addresses)
 * Korean address patterns: 동, 로, 길, 번지
 */
function detectAddress(text: string): PIIItem[] {
  const items: PIIItem[] = [];
  
  // Pattern: 시/도 + 구/군 + 동/읍/면 + 번지
  // Examples: 서울시 강남구 역삼동 123번지, 부산시 해운대구 우동 456번지
  const addressPattern = /\b([가-힣]+(?:시|도|특별시|광역시))\s+([가-힣]+(?:구|군|시))\s+([가-힣]+(?:동|읍|면|리))\s*(\d+번지|\d+-\d+)?/g;
  let match: RegExpExecArray | null;
  
  while ((match = addressPattern.exec(text)) !== null) {
    items.push({
      type: 'address',
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Pattern: 간단한 주소 (동/로/길 포함)
  const simpleAddressPattern = /\b([가-힣]+(?:동|로|길))\s*(\d+번지|\d+-\d+|\d+호)?/g;
  while ((match = simpleAddressPattern.exec(text)) !== null) {
    // Avoid duplicates
    const matchIndex = match.index;
    const matchLength = match[0].length;
    const isDuplicate = items.some(item => 
      item.startIndex <= matchIndex && item.endIndex >= matchIndex + matchLength
    );
    if (!isDuplicate) {
      items.push({
        type: 'address',
        value: match[0],
        startIndex: matchIndex,
        endIndex: matchIndex + matchLength,
      });
    }
  }

  return items;
}

/**
 * Detect 이름 (Names)
 * 2-3 Hangul characters with context keywords
 */
function detectName(text: string): PIIItem[] {
  const items: PIIItem[] = [];
  
  // Context keywords that indicate a name follows
  const nameKeywords = ['성명', '이름', '신청인', '청구인', '피청구인', '당사자', '대표자', '담당자'];
  
  // Pattern: keyword + optional colon/space + 2-3 Hangul characters
  const namePattern = new RegExp(
    `(${nameKeywords.join('|')})\\s*[:：]?\\s*([가-힣]{2,3})`,
    'g'
  );
  
  let match: RegExpExecArray | null;
  while ((match = namePattern.exec(text)) !== null) {
    const name = match[2];
    // Only capture the name part, not the keyword
    const nameStartIndex = match.index + match[1].length;
    const nameEndIndex = match.index + match[0].length;
    
    items.push({
      type: 'name',
      value: name,
      startIndex: nameStartIndex,
      endIndex: nameEndIndex,
    });
  }

  // Also detect standalone 2-3 Hangul names in specific contexts
  // Pattern: "홍길동" style names (but be careful not to match common words)
  const standalonePattern = /\b([가-힣]{2,3})\b/g;
  const commonWords = ['문서', '신청', '제출', '확인', '처리', '완료', '대상', '내용', '항목', '사항'];
  
  while ((match = standalonePattern.exec(text)) !== null) {
    const potentialName = match[0];
    // Skip if it's a common word
    if (commonWords.includes(potentialName)) continue;
    
    // Check if it's in a name-like context (before/after name indicators)
    const context = text.substring(Math.max(0, match.index - 10), Math.min(text.length, match.index + match[0].length + 10));
    const hasNameContext = nameKeywords.some(keyword => context.includes(keyword));
    
    if (hasNameContext) {
      // Avoid duplicates
      const matchIndex = match.index;
      const matchLength = match[0].length;
      const isDuplicate = items.some(item => 
        item.startIndex <= matchIndex && item.endIndex >= matchIndex + matchLength
      );
      if (!isDuplicate) {
        items.push({
          type: 'name',
          value: potentialName,
          startIndex: matchIndex,
          endIndex: matchIndex + matchLength,
        });
      }
    }
  }

  return items;
}

/**
 * Detect 이메일 (Email)
 * Standard email regex
 */
function detectEmail(text: string): PIIItem[] {
  const items: PIIItem[] = [];
  
  // Standard email pattern
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  let match: RegExpExecArray | null;
  
  while ((match = emailPattern.exec(text)) !== null) {
    items.push({
      type: 'email',
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return items;
}

/**
 * Detect 카드번호 (Card Numbers)
 * Format: 4-4-4-4 (16 digits with hyphens/spaces)
 */
function detectCardNumber(text: string): PIIItem[] {
  const items: PIIItem[] = [];
  
  // Pattern: 4-4-4-4 with hyphens or spaces
  const cardPattern = /\b(\d{4})[- ](\d{4})[- ](\d{4})[- ](\d{4})\b/g;
  let match: RegExpExecArray | null;
  
  while ((match = cardPattern.exec(text)) !== null) {
    items.push({
      type: 'card',
      value: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Pattern: 16 consecutive digits (less common but possible)
  const plainCardPattern = /\b(\d{16})\b/g;
  while ((match = plainCardPattern.exec(text)) !== null) {
    // Avoid matching account numbers (already detected)
    const isAccount = /\d{10,14}/.test(text.substring(Math.max(0, match.index - 5), match.index + match[0].length + 5));
    if (!isAccount) {
      items.push({
        type: 'card',
        value: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }

  return items;
}

/**
 * Detect all PII in text
 */
export function detectPII(text: string): PIIItem[] {
  const allItems: PIIItem[] = [];
  
  // Run all detectors
  allItems.push(...detectSSN(text));
  allItems.push(...detectAccountNumber(text));
  allItems.push(...detectPhoneNumber(text));
  allItems.push(...detectAddress(text));
  allItems.push(...detectName(text));
  allItems.push(...detectEmail(text));
  allItems.push(...detectCardNumber(text));
  
  // Sort by start index
  allItems.sort((a, b) => a.startIndex - b.startIndex);
  
  // Remove overlaps (keep first occurrence)
  const filtered: PIIItem[] = [];
  for (const item of allItems) {
    const overlaps = filtered.some(existing => 
      (item.startIndex >= existing.startIndex && item.startIndex < existing.endIndex) ||
      (item.endIndex > existing.startIndex && item.endIndex <= existing.endIndex) ||
      (item.startIndex <= existing.startIndex && item.endIndex >= existing.endIndex)
    );
    
    if (!overlaps) {
      filtered.push(item);
    }
  }
  
  return filtered;
}

/**
 * Mask PII in text
 */
export function maskPII(text: string, options: MaskOptions = {}): string {
  const { preserveFormat = true, maskChar = '*' } = options;
  const items = detectPII(text);
  
  if (items.length === 0) {
    return text;
  }
  
  // Build masked text by replacing PII items
  let maskedText = text;
  // Process from end to start to preserve indices
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    const originalValue = item.value;
    let maskedValue: string;
    
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
  
  return maskedText;
}


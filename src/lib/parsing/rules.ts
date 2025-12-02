/**
 * Rule-based extraction for legal terminology protection
 * Uses deterministic regex and keyword patterns only - no LLM calls
 */

export interface Deadline {
  date: string; // Normalized to YYYY-MM-DD format
  context: string; // Surrounding text for context
  type: string; // e.g., "납부기한", "제출기한", "신청기한"
}

export interface Obligation {
  description: string; // Extracted obligation text
  context: string; // Surrounding text for context
}

export interface Penalty {
  amount: string; // Normalized amount (e.g., "100000" for 10만원)
  type: string; // e.g., "과태료", "벌금"
  context: string; // Surrounding text for context
}

/**
 * Normalize Korean date to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string | null {
  // YYYY년 MM월 DD일 format
  const koreanDateMatch = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanDateMatch) {
    const year = koreanDateMatch[1];
    const month = koreanDateMatch[2].padStart(2, '0');
    const day = koreanDateMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD format
  const isoDateMatch = dateStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (isoDateMatch) {
    const year = isoDateMatch[1];
    const month = isoDateMatch[2].padStart(2, '0');
    const day = isoDateMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // MM월 DD일 (assume current year)
  const monthDayMatch = dateStr.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (monthDayMatch) {
    const currentYear = new Date().getFullYear();
    const month = monthDayMatch[1].padStart(2, '0');
    const day = monthDayMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  return null;
}

/**
 * Extract context around a match (50 chars before and after)
 */
function getContext(text: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - 50);
  const end = Math.min(text.length, matchIndex + matchLength + 50);
  return text.substring(start, end).trim();
}

/**
 * Extract deadlines from text using regex and keyword patterns
 */
export function extractDeadlines(text: string): Deadline[] {
  const deadlines: Deadline[] = [];
  const seen = new Set<string>();

  // Deadline keywords
  const deadlineKeywords = [
    '기한',
    '마감',
    '납부일',
    '납부기한',
    '제출일',
    '제출기한',
    '신청일',
    '신청기한',
    '접수기한',
    '접수일',
    '처리기한',
    '완료기한',
    '마감일',
    '기일',
    '까지',
    '이전',
  ];

  // Pattern 1: Keyword followed by date
  for (const keyword of deadlineKeywords) {
    // Korean date format: 기한: 2025년 1월 31일
    const pattern1 = new RegExp(
      `${keyword}[는은을를]?\\s*[:：]?\\s*(\\d{4}년\\s*\\d{1,2}월\\s*\\d{1,2}일)`,
      'gi'
    );
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const normalizedDate = normalizeDate(match[1]);
      if (normalizedDate && !seen.has(normalizedDate)) {
        seen.add(normalizedDate);
        deadlines.push({
          date: normalizedDate,
          context: getContext(text, match.index, match[0].length),
          type: keyword,
        });
      }
    }

    // ISO date format: 기한: 2025-01-31
    const pattern2 = new RegExp(
      `${keyword}[는은을를]?\\s*[:：]?\\s*(\\d{4}[.\\-\\/]\\d{1,2}[.\\-\\/]\\d{1,2})`,
      'gi'
    );
    while ((match = pattern2.exec(text)) !== null) {
      const normalizedDate = normalizeDate(match[1]);
      if (normalizedDate && !seen.has(normalizedDate)) {
        seen.add(normalizedDate);
        deadlines.push({
          date: normalizedDate,
          context: getContext(text, match.index, match[0].length),
          type: keyword,
        });
      }
    }

    // Date followed by keyword: 2025년 1월 31일까지
    const pattern3 = new RegExp(
      `(\\d{4}년\\s*\\d{1,2}월\\s*\\d{1,2}일)\\s*${keyword}`,
      'gi'
    );
    while ((match = pattern3.exec(text)) !== null) {
      const normalizedDate = normalizeDate(match[1]);
      if (normalizedDate && !seen.has(normalizedDate)) {
        seen.add(normalizedDate);
        deadlines.push({
          date: normalizedDate,
          context: getContext(text, match.index, match[0].length),
          type: keyword,
        });
      }
    }
  }

  // Pattern 2: Direct date patterns near deadline context
  const datePatterns = [
    /(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)/g,
    /(\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})/g,
  ];

  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const normalizedDate = normalizeDate(match[1]);
      if (!normalizedDate || seen.has(normalizedDate)) continue;

      // Check if date is near deadline keywords (within 30 chars)
      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      const contextWindow = text.substring(start, end);

      const hasDeadlineKeyword = deadlineKeywords.some(keyword =>
        contextWindow.includes(keyword)
      );

      if (hasDeadlineKeyword) {
        seen.add(normalizedDate);
        deadlines.push({
          date: normalizedDate,
          context: getContext(text, match.index, match[0].length),
          type: 'deadline',
        });
      }
    }
  }

  return deadlines;
}

/**
 * Extract obligations from text using keyword patterns
 */
export function extractObligations(text: string): Obligation[] {
  const obligations: Obligation[] = [];
  const seen = new Set<string>();

  // Obligation keywords and patterns
  const obligationPatterns = [
    // Direct obligation keywords
    {
      pattern: /(의무|필수|반드시|해야\s*함|해야\s*합니다|해야\s*한다|해야\s*할|해야\s*한다고)/gi,
      type: 'obligation',
    },
    // Must do patterns
    {
      pattern: /([가-힣\s]+)\s*(해야\s*합니다|해야\s*함|해야\s*한다|해야\s*할|해야\s*한다고)/gi,
      type: 'must_do',
    },
    // Required patterns
    {
      pattern: /([가-힣\s]+)\s*(필수|의무|반드시)/gi,
      type: 'required',
    },
    // Prohibition patterns (negative obligations)
    {
      pattern: /([가-힣\s]+)\s*(하지\s*않으면|하지\s*않을\s*경우|하지\s*않으면\s*안\s*됨)/gi,
      type: 'prohibition',
    },
    // Legal requirement patterns
    {
      pattern: /(법률|규정|법령|조례|규칙|지침)\s*(에\s*따라|에\s*의해|에\s*의하면)\s*([가-힣\s]+)/gi,
      type: 'legal_requirement',
    },
  ];

  for (const { pattern, type } of obligationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Extract the obligation description
      let description = '';
      if (match.length > 1) {
        // Use the first capture group or full match
        description = match[1] || match[0];
      } else {
        description = match[0];
      }

      // Clean up description
      description = description.trim().substring(0, 200); // Limit length

      // Create a hash for deduplication
      const hash = description.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(hash)) continue;
      seen.add(hash);

      obligations.push({
        description,
        context: getContext(text, match.index, match[0].length),
      });
    }
  }

  // Extract sentences containing obligation keywords
  const sentences = text.split(/[.!?。！？\n]/);
  for (const sentence of sentences) {
    const hasObligationKeyword = /(의무|필수|반드시|해야|하지\s*않으면)/i.test(sentence);
    if (hasObligationKeyword && sentence.trim().length > 10) {
      const hash = sentence.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(hash)) {
        seen.add(hash);
        obligations.push({
          description: sentence.trim().substring(0, 200),
          context: sentence.trim(),
        });
      }
    }
  }

  return obligations;
}

/**
 * Normalize Korean currency amount to numeric string
 */
function normalizeAmount(amountStr: string): string {
  // Remove commas and spaces
  let cleaned = amountStr.replace(/[,,\s]/g, '');

  // Handle 만원 (10,000)
  const manMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*만원?/);
  if (manMatch) {
    const value = parseFloat(manMatch[1]) * 10000;
    return Math.floor(value).toString();
  }

  // Handle 억원 (100,000,000)
  const eokMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*억원?/);
  if (eokMatch) {
    const value = parseFloat(eokMatch[1]) * 100000000;
    return Math.floor(value).toString();
  }

  // Handle 원 (direct)
  const wonMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*원/);
  if (wonMatch) {
    return Math.floor(parseFloat(wonMatch[1])).toString();
  }

  // Extract just numbers
  const numbers = cleaned.replace(/[^\d]/g, '');
  return numbers || amountStr;
}

/**
 * Extract penalties from text using regex and keyword patterns
 */
export function extractPenalties(text: string): Penalty[] {
  const penalties: Penalty[] = [];
  const seen = new Set<string>();

  // Penalty keywords
  const penaltyKeywords = ['과태료', '벌금', '처벌', '제재', '징계', '불이익'];

  // Pattern 1: Penalty keyword followed by amount
  for (const keyword of penaltyKeywords) {
    // 과태료 10만원
    const pattern1 = new RegExp(
      `${keyword}\\s*[:：]?\\s*(\\d+(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:원|만원|억원)?)`,
      'gi'
    );
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const normalizedAmount = normalizeAmount(match[1]);
      const hash = `${keyword}:${normalizedAmount}`;
      if (!seen.has(hash)) {
        seen.add(hash);
        penalties.push({
          amount: normalizedAmount,
          type: keyword,
          context: getContext(text, match.index, match[0].length),
        });
      }
    }

    // Amount followed by penalty keyword: 10만원의 과태료
    const pattern2 = new RegExp(
      `(\\d+(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:원|만원|억원)?)\\s*(?:의|에\s*해당하는)?\\s*${keyword}`,
      'gi'
    );
    while ((match = pattern2.exec(text)) !== null) {
      const normalizedAmount = normalizeAmount(match[1]);
      const hash = `${keyword}:${normalizedAmount}`;
      if (!seen.has(hash)) {
        seen.add(hash);
        penalties.push({
          amount: normalizedAmount,
          type: keyword,
          context: getContext(text, match.index, match[0].length),
        });
      }
    }
  }

  // Pattern 2: General penalty patterns
  const penaltyPatterns = [
    // 과태료 patterns
    /과태료\s*(?:는|은|가)?\s*(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:원|만원|억원)?)/gi,
    // 벌금 patterns
    /벌금\s*(?:는|은|가)?\s*(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?\\s*(?:원|만원|억원)?)/gi,
    // 처벌 patterns
    /처벌\s*(?:받을|받게|받는)/gi,
  ];

  for (const pattern of penaltyPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // Try to extract amount from context
      const context = getContext(text, match.index, match[0].length);
      const amountMatch = context.match(/(\d+(?:,\d{3})*(?:\.\d+)?\s*(?:원|만원|억원)?)/);
      
      if (amountMatch) {
        const normalizedAmount = normalizeAmount(amountMatch[1]);
        const hash = `penalty:${normalizedAmount}`;
        if (!seen.has(hash)) {
          seen.add(hash);
          penalties.push({
            amount: normalizedAmount,
            type: 'penalty',
            context,
          });
        }
      } else {
        // Penalty mentioned but no amount found
        const hash = match[0].toLowerCase();
        if (!seen.has(hash)) {
          seen.add(hash);
          penalties.push({
            amount: '0', // Unknown amount
            type: 'penalty',
            context,
          });
        }
      }
    }
  }

  return penalties;
}


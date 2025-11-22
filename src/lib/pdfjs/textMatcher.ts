import { TextItem, PageText } from "./textExtractor";

export interface MatchResult {
  textItem: TextItem;
  confidence: number;
  matchedText: string;
}

/**
 * Normalize Korean text for matching
 */
function normalizeKoreanText(text: string): string {
  return text
    .replace(/\s+/g, "") // Remove all whitespace
    .replace(/[년월일]/g, "") // Remove date markers
    .replace(/[,.\-]/g, "") // Remove punctuation
    .toLowerCase();
}

/**
 * Normalize date string for matching
 */
function normalizeDate(dateStr: string): string {
  // Remove common date separators and markers
  return dateStr
    .replace(/[년월일]/g, "")
    .replace(/[.\-\/]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Extract year, month, day from date string
 */
function parseDate(dateStr: string): { year?: number; month?: number; day?: number } | null {
  // Try YYYY-MM-DD format
  const isoMatch = dateStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1]),
      month: parseInt(isoMatch[2]),
      day: parseInt(isoMatch[3]),
    };
  }
  
  // Try YYYY년 MM월 DD일 format
  const koreanMatch = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanMatch) {
    return {
      year: parseInt(koreanMatch[1]),
      month: parseInt(koreanMatch[2]),
      day: parseInt(koreanMatch[3]),
    };
  }
  
  return null;
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Match a date string to text items in PDF
 */
export function matchDate(
  dateStr: string,
  pages: PageText[]
): MatchResult[] {
  const normalizedDate = normalizeDate(dateStr);
  const parsedDate = parseDate(dateStr);
  const matches: MatchResult[] = [];
  
  for (const page of pages) {
    for (const item of page.items) {
      const itemNormalized = normalizeDate(item.text);
      
      // Exact match
      if (itemNormalized === normalizedDate) {
        matches.push({
          textItem: item,
          confidence: 1.0,
          matchedText: item.text,
        });
        continue;
      }
      
      // Try parsing and comparing
      if (parsedDate) {
        const itemParsed = parseDate(item.text);
        if (
          itemParsed &&
          itemParsed.year === parsedDate.year &&
          itemParsed.month === parsedDate.month &&
          itemParsed.day === parsedDate.day
        ) {
          matches.push({
            textItem: item,
            confidence: 0.95,
            matchedText: item.text,
          });
          continue;
        }
      }
      
      // Fuzzy match
      const similarity = calculateSimilarity(normalizedDate, itemNormalized);
      if (similarity > 0.7) {
        matches.push({
          textItem: item,
          confidence: similarity,
          matchedText: item.text,
        });
      }
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match a text string to text items in PDF (fuzzy matching)
 */
export function matchText(
  searchText: string,
  pages: PageText[],
  threshold: number = 0.7
): MatchResult[] {
  const normalizedSearch = normalizeKoreanText(searchText);
  const matches: MatchResult[] = [];
  
  for (const page of pages) {
    for (const item of page.items) {
      const normalizedItem = normalizeKoreanText(item.text);
      
      // Exact match
      if (normalizedItem === normalizedSearch) {
        matches.push({
          textItem: item,
          confidence: 1.0,
          matchedText: item.text,
        });
        continue;
      }
      
      // Check if search text is contained in item
      if (normalizedItem.includes(normalizedSearch) || normalizedSearch.includes(normalizedItem)) {
        matches.push({
          textItem: item,
          confidence: 0.9,
          matchedText: item.text,
        });
        continue;
      }
      
      // Fuzzy match
      const similarity = calculateSimilarity(normalizedSearch, normalizedItem);
      if (similarity >= threshold) {
        matches.push({
          textItem: item,
          confidence: similarity,
          matchedText: item.text,
        });
      }
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match an amount string to text items in PDF
 */
export function matchAmount(
  amountStr: string,
  pages: PageText[]
): MatchResult[] {
  // Extract numbers from amount string
  const amountNumbers = amountStr.replace(/[^\d]/g, "");
  const matches: MatchResult[] = [];
  
  for (const page of pages) {
    for (const item of page.items) {
      const itemNumbers = item.text.replace(/[^\d]/g, "");
      
      // Exact number match
      if (itemNumbers === amountNumbers && itemNumbers.length > 0) {
        matches.push({
          textItem: item,
          confidence: 0.95,
          matchedText: item.text,
        });
        continue;
      }
      
      // Check if amount is contained in item
      if (item.text.includes(amountStr) || amountStr.includes(item.text)) {
        matches.push({
          textItem: item,
          confidence: 0.9,
          matchedText: item.text,
        });
      }
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Match multiple entities to PDF text
 */
export function matchEntities(
  entities: {
    dates?: string[];
    names?: string[];
    amounts?: string[];
    keyPhrases?: string[];
  },
  pages: PageText[]
): Map<string, MatchResult[]> {
  const matches = new Map<string, MatchResult[]>();
  
  if (entities.dates) {
    for (const date of entities.dates) {
      const dateMatches = matchDate(date, pages);
      if (dateMatches.length > 0) {
        matches.set(`date:${date}`, dateMatches);
      }
    }
  }
  
  if (entities.names) {
    for (const name of entities.names) {
      const nameMatches = matchText(name, pages, 0.8);
      if (nameMatches.length > 0) {
        matches.set(`name:${name}`, nameMatches);
      }
    }
  }
  
  if (entities.amounts) {
    for (const amount of entities.amounts) {
      const amountMatches = matchAmount(amount, pages);
      if (amountMatches.length > 0) {
        matches.set(`amount:${amount}`, amountMatches);
      }
    }
  }
  
  if (entities.keyPhrases) {
    for (const phrase of entities.keyPhrases) {
      const phraseMatches = matchText(phrase, pages, 0.6);
      if (phraseMatches.length > 0) {
        matches.set(`phrase:${phrase}`, phraseMatches);
      }
    }
  }
  
  return matches;
}


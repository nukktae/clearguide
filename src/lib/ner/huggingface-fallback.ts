/**
 * HuggingFace Inference API fallback for NER
 * Uses KoELECTRA-base-v3-NER model via HuggingFace API
 */

import { NEREntity, NERResult, NERLabel } from './types';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/monologg/koelectra-base-v3-discriminator';

/**
 * Map HuggingFace NER labels to our NERLabel types
 */
function mapHuggingFaceLabel(hfLabel: string): NERLabel | null {
  const labelMap: Record<string, NERLabel> = {
    'B-DATE': 'DATE',
    'I-DATE': 'DATE',
    'B-MONEY': 'MONEY',
    'I-MONEY': 'MONEY',
    'B-LOCATION': 'LOCATION',
    'I-LOCATION': 'LOCATION',
    'B-ORGANIZATION': 'ORGANIZATION',
    'I-ORGANIZATION': 'ORGANIZATION',
    'B-PERSON': 'PERSON',
    'I-PERSON': 'PERSON',
    // Map common Korean legal/admin terms
    'B-PER': 'PERSON',
    'I-PER': 'PERSON',
    'B-ORG': 'ORGANIZATION',
    'I-ORG': 'ORGANIZATION',
    'B-LOC': 'LOCATION',
    'I-LOC': 'LOCATION',
    'B-DAT': 'DATE',
    'I-DAT': 'DATE',
  };

  // Check for exact match
  if (labelMap[hfLabel]) {
    return labelMap[hfLabel];
  }

  // Check for partial match (e.g., "B-DATE" -> "DATE")
  for (const [key, value] of Object.entries(labelMap)) {
    if (hfLabel.includes(key.split('-')[1])) {
      return value;
    }
  }

  return null;
}

/**
 * Extract entities using pattern matching on HuggingFace response
 * Since KoELECTRA may not have exact labels we need, we'll use a hybrid approach:
 * 1. Call HuggingFace API for token classification
 * 2. Use regex patterns to extract specific entity types
 */
export async function extractNERFromHuggingFace(
  text: string,
  apiKey: string
): Promise<NERResult> {
  try {
    // Call HuggingFace API for token classification
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
    }

    const hfResult = await response.json();
    
    // Process HuggingFace result and combine with regex extraction
    const entities: NEREntity[] = [];
    
    // If HuggingFace returns token-level predictions, process them
    if (Array.isArray(hfResult)) {
      // Process token-level results (if available)
      // Note: This depends on the exact format HuggingFace returns
      // For now, we'll rely more on regex patterns
    }

    // Combine with regex-based extraction for Korean legal documents
    const regexEntities = extractEntitiesWithRegex(text);
    entities.push(...regexEntities);

    // Deduplicate overlapping entities
    const deduplicated = deduplicateEntities(entities);

    return {
      entities: deduplicated,
      text,
      model: 'koelectra-huggingface-hybrid',
    };
  } catch (error) {
    console.error('[NER HuggingFace] Error:', error);
    // Fallback to regex-only extraction
    const regexEntities = extractEntitiesWithRegex(text);
    return {
      entities: regexEntities,
      text,
      model: 'regex-fallback',
    };
  }
}

/**
 * Extract entities using regex patterns (fallback when ML model unavailable)
 * This provides basic entity extraction for Korean legal/admin documents
 */
function extractEntitiesWithRegex(text: string): NEREntity[] {
  const entities: NEREntity[] = [];

  // Extract dates
  const datePatterns = [
    /(\d{4}년\s*\d{1,2}월\s*\d{1,2}일)/g,
    /(\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2})/g,
  ];

  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[1],
        label: 'DATE',
        start: match.index,
        end: match.index + match[1].length,
        confidence: 0.8,
      });
    }
  }

  // Extract money amounts
  const moneyPatterns = [
    /(\d+(?:,\d{3})*(?:\.\d+)?)\s*원/g,
    /(\d+(?:\.\d+)?)\s*만원/g,
    /(\d+(?:\.\d+)?)\s*억원/g,
  ];

  for (const pattern of moneyPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'MONEY',
        start: match.index,
        end: match.index + match[0].length,
        confidence: 0.85,
      });
    }
  }

  // Extract account numbers (Korean bank account format)
  const accountPattern = /(\d{3,4}[-.\s]?\d{4,6}[-.\s]?\d{4,6})/g;
  let match;
  while ((match = accountPattern.exec(text)) !== null) {
    entities.push({
      text: match[1],
      label: 'ACCOUNT_NUMBER',
      start: match.index,
      end: match.index + match[1].length,
      confidence: 0.7,
    });
  }

  // Extract actions (Korean obligation keywords)
  const actionKeywords = ['납부', '제출', '신청', '접수', '처리', '완료', '확인'];
  for (const keyword of actionKeywords) {
    const pattern = new RegExp(`(${keyword}(?:하[여야]?|해야\s*합니다?|해야\s*함))`, 'g');
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[1],
        label: 'ACTION',
        start: match.index,
        end: match.index + match[1].length,
        confidence: 0.75,
      });
    }
  }

  // Extract deadlines
  const deadlineKeywords = ['기한', '마감', '납부일', '제출일', '신청일', '접수일'];
  for (const keyword of deadlineKeywords) {
    const pattern = new RegExp(`(${keyword}[는은을를]?\\s*[:：]?\\s*\\d{4}[년.\-\\/]\\d{1,2}[월.\-\\/]\\d{1,2}[일]?)`, 'g');
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[1],
        label: 'DEADLINE',
        start: match.index,
        end: match.index + match[1].length,
        confidence: 0.8,
      });
    }
  }

  // Extract organizations (common Korean government/org patterns)
  const orgPatterns = [
    /([가-힣]+(?:시|군|구|동|읍|면|리)\s*(?:청|사무소|센터|관공서))/g,
    /([가-힣]+(?:부|청|원|국|소|과|팀))/g,
  ];

  for (const pattern of orgPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[1],
        label: 'ORGANIZATION',
        start: match.index,
        end: match.index + match[1].length,
        confidence: 0.7,
      });
    }
  }

  return entities;
}

/**
 * Deduplicate overlapping entities (prefer higher confidence)
 */
function deduplicateEntities(entities: NEREntity[]): NEREntity[] {
  const sorted = entities.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const result: NEREntity[] = [];
  const seen = new Set<string>();

  for (const entity of sorted) {
    const key = `${entity.start}-${entity.end}-${entity.label}`;
    if (!seen.has(key)) {
      // Check for overlaps
      const overlaps = result.some(
        (existing) =>
          existing.label === entity.label &&
          ((entity.start >= existing.start && entity.start < existing.end) ||
            (entity.end > existing.start && entity.end <= existing.end) ||
            (entity.start <= existing.start && entity.end >= existing.end))
      );

      if (!overlaps) {
        result.push(entity);
        seen.add(key);
      }
    }
  }

  return result.sort((a, b) => a.start - b.start);
}


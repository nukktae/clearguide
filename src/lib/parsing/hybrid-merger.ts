/**
 * Hybrid Merging Engine
 * Combines NER entities + regex entities into canonical set
 * Links entities using RE results
 */

import { NEREntity } from '@/src/lib/ner/types';
import { Deadline, Obligation, Penalty } from './rules';
import { Relation } from './relation-types';
import { extractDeadlines, extractObligations, extractPenalties } from './rules';

export interface MergedEntity {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence: number;
  sources: ('ner' | 'regex')[];
}

export interface MergedData {
  entities: MergedEntity[];
  deadlines: Deadline[];
  obligations: Obligation[];
  penalties: Penalty[];
  relations: Relation[];
}

/**
 * Merge NER entities and regex-extracted data into canonical set
 * Strategy: Prefer NER when overlapping, keep both when distinct
 */
export function mergeNERAndRegex(
  nerEntities: NEREntity[],
  text: string
): MergedData {
  // Extract regex-based data
  const regexDeadlines = extractDeadlines(text);
  const regexObligations = extractObligations(text);
  const regexPenalties = extractPenalties(text);

  // Convert regex deadlines to entities for merging
  const regexDeadlineEntities: MergedEntity[] = regexDeadlines.map((deadline) => {
    // Find the date text in the original text
    const dateMatch = text.indexOf(deadline.date);
    return {
      text: deadline.date,
      label: 'DATE',
      start: dateMatch >= 0 ? dateMatch : 0,
      end: dateMatch >= 0 ? dateMatch + deadline.date.length : deadline.date.length,
      confidence: 0.8,
      sources: ['regex'],
    };
  });

  // Convert regex penalties to entities
  const regexPenaltyEntities: MergedEntity[] = regexPenalties.map((penalty) => {
    // Find penalty amount in context
    const contextMatch = text.indexOf(penalty.context);
    return {
      text: penalty.amount,
      label: 'MONEY',
      start: contextMatch >= 0 ? contextMatch : 0,
      end: contextMatch >= 0 ? contextMatch + penalty.amount.length : penalty.amount.length,
      confidence: 0.75,
      sources: ['regex'],
    };
  });

  // Convert NER entities to MergedEntity format
  const nerMergedEntities: MergedEntity[] = nerEntities.map((entity) => ({
    text: entity.text,
    label: entity.label,
    start: entity.start,
    end: entity.end,
    confidence: entity.confidence || 0.7,
    sources: ['ner'] as ('ner' | 'regex')[],
  }));

  // Merge all entities
  const allEntities = [...nerMergedEntities, ...regexDeadlineEntities, ...regexPenaltyEntities];
  const mergedEntities = deduplicateAndMergeEntities(allEntities);

  return {
    entities: mergedEntities,
    deadlines: regexDeadlines,
    obligations: regexObligations,
    penalties: regexPenalties,
    relations: [], // Will be populated by RE extraction
  };
}

/**
 * Deduplicate and merge overlapping entities
 * Prefer NER over regex when overlapping
 */
function deduplicateAndMergeEntities(entities: MergedEntity[]): MergedEntity[] {
  // Sort by start position
  const sorted = [...entities].sort((a, b) => a.start - b.start);
  const result: MergedEntity[] = [];

  for (const entity of sorted) {
    // Check for overlaps with existing entities
    const overlapping = result.find((existing) => {
      const overlaps =
        (entity.start >= existing.start && entity.start < existing.end) ||
        (entity.end > existing.start && entity.end <= existing.end) ||
        (entity.start <= existing.start && entity.end >= existing.end);

      return overlaps && entity.label === existing.label;
    });

    if (!overlapping) {
      // No overlap, add as new entity
      result.push(entity);
    } else {
      // Overlap detected - prefer NER over regex
      const hasNER = entity.sources.includes('ner');
      const existingHasNER = overlapping.sources.includes('ner');

      if (hasNER && !existingHasNER) {
        // Replace regex with NER
        const index = result.indexOf(overlapping);
        result[index] = entity;
      } else if (hasNER && existingHasNER) {
        // Both are NER - prefer higher confidence or longer match
        if (
          entity.confidence > overlapping.confidence ||
          (entity.confidence === overlapping.confidence &&
            entity.end - entity.start > overlapping.end - overlapping.start)
        ) {
          const index = result.indexOf(overlapping);
          result[index] = entity;
        }
      } else if (!hasNER && !existingHasNER) {
        // Both are regex - merge sources if same text
        if (entity.text === overlapping.text) {
          const index = result.indexOf(overlapping);
          result[index] = {
            ...overlapping,
            sources: [...new Set([...overlapping.sources, ...entity.sources])],
          };
        } else {
          // Different text, prefer longer match
          if (entity.end - entity.start > overlapping.end - overlapping.start) {
            const index = result.indexOf(overlapping);
            result[index] = entity;
          }
        }
      }
    }
  }

  return result.sort((a, b) => a.start - b.start);
}

/**
 * Add relations to merged data
 */
export function addRelationsToMergedData(
  mergedData: MergedData,
  relations: Relation[]
): MergedData {
  return {
    ...mergedData,
    relations,
  };
}

/**
 * Compare LLM extracted data against merged canonical set
 * Returns mismatches and contradictions
 */
export function compareLLMAgainstMerged(
  llmText: string,
  mergedData: MergedData
): {
  matches: boolean;
  issues: string[];
  missingEntities: MergedEntity[];
  contradictoryEntities: Array<{ merged: MergedEntity; llm: string }>;
} {
  const issues: string[] = [];
  const missingEntities: MergedEntity[] = [];
  const contradictoryEntities: Array<{ merged: MergedEntity; llm: string }> = [];

  // Extract from LLM text using regex (same patterns as rule-based extraction)
  const llmDeadlines = extractDeadlines(llmText);
  const llmObligations = extractObligations(llmText);
  const llmPenalties = extractPenalties(llmText);

  // Check deadlines
  for (const mergedDeadline of mergedData.deadlines) {
    const matchingLLMDeadline = llmDeadlines.find((llmDeadline) => {
      // Normalize dates for comparison
      return normalizeDate(llmDeadline.date) === normalizeDate(mergedDeadline.date);
    });

    if (!matchingLLMDeadline) {
      missingEntities.push({
        text: mergedDeadline.date,
        label: 'DATE',
        start: 0,
        end: mergedDeadline.date.length,
        confidence: 0.8,
        sources: ['regex'],
      });
      issues.push(`Missing deadline: ${mergedDeadline.date} not mentioned in LLM response`);
    }
  }

  // Check for LLM-added deadlines not in merged data
  for (const llmDeadline of llmDeadlines) {
    const matchingMergedDeadline = mergedData.deadlines.find((mergedDeadline) => {
      return normalizeDate(llmDeadline.date) === normalizeDate(mergedDeadline.date);
    });

    if (!matchingMergedDeadline) {
      issues.push(`Added deadline: LLM mentions ${llmDeadline.date} not found in merged data`);
    }
  }

  // Check penalties
  for (const mergedPenalty of mergedData.penalties) {
    if (mergedPenalty.amount === '0') continue;

    const matchingLLMPenalty = llmPenalties.find((llmPenalty) => {
      return normalizeAmount(llmPenalty.amount) === normalizeAmount(mergedPenalty.amount);
    });

    if (!matchingLLMPenalty) {
      issues.push(`Missing penalty: ${mergedPenalty.amount}원 not mentioned in LLM response`);
    } else if (
      normalizeAmount(matchingLLMPenalty.amount) !== normalizeAmount(mergedPenalty.amount)
    ) {
      contradictoryEntities.push({
        merged: {
          text: mergedPenalty.amount,
          label: 'MONEY',
          start: 0,
          end: mergedPenalty.amount.length,
          confidence: 0.75,
          sources: ['regex'],
        },
        llm: matchingLLMPenalty.amount,
      });
      issues.push(
        `Contradictory penalty: Merged ${mergedPenalty.amount}원 vs LLM ${matchingLLMPenalty.amount}원`
      );
    }
  }

  // Check obligations (less strict - allow paraphrasing)
  const missingObligations = mergedData.obligations.filter((mergedObligation) => {
    return !llmObligations.some((llmObligation) => {
      // Fuzzy match on description
      const mergedDesc = mergedObligation.description.toLowerCase();
      const llmDesc = llmObligation.description.toLowerCase();
      return mergedDesc.includes(llmDesc) || llmDesc.includes(mergedDesc);
    });
  });

  if (missingObligations.length > 0) {
    issues.push(
      `Missing obligations: ${missingObligations.length} obligations not mentioned in LLM response`
    );
  }

  return {
    matches: issues.length === 0,
    issues,
    missingEntities,
    contradictoryEntities,
  };
}

/**
 * Normalize date for comparison
 */
function normalizeDate(dateStr: string): string {
  // YYYY-MM-DD format
  const isoMatch = dateStr.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // YYYY년 MM월 DD일 format
  const koreanMatch = dateStr.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (koreanMatch) {
    const year = koreanMatch[1];
    const month = koreanMatch[2].padStart(2, '0');
    const day = koreanMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}

/**
 * Normalize amount for comparison
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


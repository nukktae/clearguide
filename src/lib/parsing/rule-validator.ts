/**
 * Rule-based validator for LLM responses
 * Compares LLM text against deterministic rule-based findings
 */

import {
  extractDeadlines,
  extractObligations,
  extractPenalties,
  type Deadline,
  type Obligation,
  type Penalty,
} from './rules';
import { NEREntity } from '@/src/lib/ner/types';
import { Relation } from './relation-types';
import { MergedData } from './hybrid-merger';

export interface RuleBasedData {
  deadlines: Deadline[];
  obligations: Obligation[];
  penalties: Penalty[];
}

export interface HybridData extends RuleBasedData {
  nerEntities?: NEREntity[];
  relations?: Relation[];
  mergedData?: MergedData;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * Normalize date for comparison (handles variations)
 */
function normalizeDateForComparison(dateStr: string): string | null {
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
 * Normalize amount for comparison
 */
function normalizeAmountForComparison(amountStr: string): string {
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
 * Check if two dates are the same (within tolerance for formatting differences)
 */
function datesMatch(date1: string, date2: string): boolean {
  const normalized1 = normalizeDateForComparison(date1);
  const normalized2 = normalizeDateForComparison(date2);
  
  if (!normalized1 || !normalized2) {
    // If we can't normalize, do fuzzy string match
    return date1.includes(date2) || date2.includes(date1);
  }
  
  return normalized1 === normalized2;
}

/**
 * Check if two amounts are the same
 */
function amountsMatch(amount1: string, amount2: string): boolean {
  const normalized1 = normalizeAmountForComparison(amount1);
  const normalized2 = normalizeAmountForComparison(amount2);
  
  if (!normalized1 || !normalized2 || normalized1 === '0' || normalized2 === '0') {
    // If amounts are unknown or zero, don't compare strictly
    return true;
  }
  
  return normalized1 === normalized2;
}

/**
 * Check if obligation descriptions are similar
 */
function obligationsMatch(desc1: string, desc2: string): boolean {
  // Normalize both descriptions
  const norm1 = desc1.toLowerCase().replace(/\s+/g, ' ').trim();
  const norm2 = desc2.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // Check if one contains the other (fuzzy match)
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return true;
  }
  
  // Check for key obligation keywords
  const keywords = ['의무', '필수', '반드시', '해야'];
  const hasKeywords1 = keywords.some(kw => norm1.includes(kw));
  const hasKeywords2 = keywords.some(kw => norm2.includes(kw));
  
  // If both have obligation keywords, consider them related
  if (hasKeywords1 && hasKeywords2) {
    // Check if they share significant words
    const words1 = norm1.split(/\s+/).filter(w => w.length > 2);
    const words2 = norm2.split(/\s+/).filter(w => w.length > 2);
    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length > 0;
  }
  
  return false;
}

/**
 * Validate LLM response against rule-based findings
 */
export function validateLLMResponse(
  llmText: string,
  ruleBasedData: RuleBasedData
): ValidationResult {
  const issues: string[] = [];

  // Extract data from LLM response using same patterns
  const llmDeadlines = extractDeadlines(llmText);
  const llmObligations = extractObligations(llmText);
  const llmPenalties = extractPenalties(llmText);

  // Check deadlines
  // 1. Check for contradictions (different dates)
  for (const ruleDeadline of ruleBasedData.deadlines) {
    const matchingLLMDeadline = llmDeadlines.find(llmDeadline =>
      datesMatch(llmDeadline.date, ruleDeadline.date)
    );

    if (!matchingLLMDeadline) {
      // Rule-based deadline not mentioned in LLM response
      issues.push(
        `Missing deadline: Rule-based extraction found deadline ${ruleDeadline.date} (${ruleDeadline.type}) but LLM response does not mention it`
      );
    } else {
      // Check if dates match exactly
      if (!datesMatch(matchingLLMDeadline.date, ruleDeadline.date)) {
        issues.push(
          `Contradictory deadline: Rule-based extraction found ${ruleDeadline.date} but LLM mentions ${matchingLLMDeadline.date}`
        );
      }
    }
  }

  // 2. Check for additions (LLM adds deadlines not found by rules)
  for (const llmDeadline of llmDeadlines) {
    const matchingRuleDeadline = ruleBasedData.deadlines.find(ruleDeadline =>
      datesMatch(ruleDeadline.date, llmDeadline.date)
    );

    if (!matchingRuleDeadline) {
      issues.push(
        `Added deadline: LLM response mentions deadline ${llmDeadline.date} that was not found by rule-based extraction`
      );
    }
  }

  // Filter out disclaimers and fragments from obligations
  const disclaimerKeywords = [
    '행정서비스',
    '법적인 의무나 권리가 발생하지 않습니다',
    '통지문',
    '제공하는 것으로',
  ];
  
  const isDisclaimer = (text: string): boolean => {
    const normalized = text.toLowerCase();
    return disclaimerKeywords.some(keyword => normalized.includes(keyword.toLowerCase()));
  };
  
  const isValidObligation = (text: string): boolean => {
    // Skip if it's a disclaimer
    if (isDisclaimer(text)) return false;
    // Skip if it's too short (likely a fragment)
    if (text.length < 10) return false;
    // Skip if it's just "의무..." without context
    if (text.trim().startsWith('의무') && text.length < 20) return false;
    return true;
  };

  // Check obligations
  // 1. Check for missing obligations (only for valid obligations)
  const validRuleObligations = ruleBasedData.obligations.filter(ob => isValidObligation(ob.description));
  
  for (const ruleObligation of validRuleObligations) {
    const matchingLLMObligation = llmObligations.find(llmObligation =>
      obligationsMatch(llmObligation.description, ruleObligation.description)
    );

    if (!matchingLLMObligation) {
      // Only flag if it's a significant obligation (not a minor one)
      // Check if it contains important keywords
      const importantKeywords = ['신고', '신청', '제출', '납부', '기한', '만료'];
      const hasImportantKeywords = importantKeywords.some(kw => 
        ruleObligation.description.includes(kw)
      );
      
      if (hasImportantKeywords) {
        issues.push(
          `Missing obligation: Rule-based extraction found obligation "${ruleObligation.description.substring(0, 50)}..." but LLM response does not mention it`
        );
      }
    }
  }

  // 2. Check for added obligations (less strict - LLM might paraphrase)
  // Only flag if LLM adds many obligations not found by rules AND they're significant
  const unmatchedLLMObligations = llmObligations.filter(
    llmObligation =>
      isValidObligation(llmObligation.description) &&
      !validRuleObligations.some(ruleObligation =>
        obligationsMatch(ruleObligation.description, llmObligation.description)
      )
  );

  // Only flag if significantly more obligations than found by rules (allowing for paraphrasing)
  if (unmatchedLLMObligations.length > Math.max(3, validRuleObligations.length * 1.5)) {
    issues.push(
      `Added obligations: LLM response mentions ${unmatchedLLMObligations.length} obligations not found by rule-based extraction`
    );
  }

  // Check penalties
  // 1. Check for contradictions (different amounts)
  for (const rulePenalty of ruleBasedData.penalties) {
    if (rulePenalty.amount === '0') continue; // Skip unknown amounts

    const matchingLLMPenalty = llmPenalties.find(llmPenalty =>
      amountsMatch(llmPenalty.amount, rulePenalty.amount) ||
      llmPenalty.type === rulePenalty.type
    );

    if (!matchingLLMPenalty) {
      issues.push(
        `Missing penalty: Rule-based extraction found penalty ${rulePenalty.amount}원 (${rulePenalty.type}) but LLM response does not mention it`
      );
    } else {
      // Check if amounts match
      if (
        rulePenalty.amount !== '0' &&
        matchingLLMPenalty.amount !== '0' &&
        !amountsMatch(matchingLLMPenalty.amount, rulePenalty.amount)
      ) {
        issues.push(
          `Contradictory penalty: Rule-based extraction found ${rulePenalty.amount}원 but LLM mentions ${matchingLLMPenalty.amount}원`
        );
      }
    }
  }

  // 2. Check for added penalties
  for (const llmPenalty of llmPenalties) {
    if (llmPenalty.amount === '0') continue; // Skip unknown amounts

    const matchingRulePenalty = ruleBasedData.penalties.find(
      rulePenalty =>
        amountsMatch(rulePenalty.amount, llmPenalty.amount) ||
        rulePenalty.type === llmPenalty.type
    );

    if (!matchingRulePenalty) {
      issues.push(
        `Added penalty: LLM response mentions penalty ${llmPenalty.amount}원 (${llmPenalty.type}) that was not found by rule-based extraction`
      );
    }
  }

  // Validation: Allow some minor issues but reject if too many or critical ones
  // Filter out minor issues (disclaimers, fragments)
  const criticalIssues = issues.filter(issue => {
    // Skip issues about disclaimers
    if (issue.includes('행정서비스') || issue.includes('법적인 의무나 권리가 발생하지 않습니다')) {
      return false;
    }
    // Skip issues about fragments
    if (issue.includes('의무...') && issue.length < 100) {
      return false;
    }
    return true;
  });
  
  // Only invalidate if there are critical issues
  return {
    isValid: criticalIssues.length === 0,
    issues: criticalIssues,
  };
}

/**
 * Enhanced hybrid validation: Validate LLM response against NER + regex + RE
 * This is the core hybrid validation that checks:
 * - NER dates vs LLM dates
 * - NER obligations vs LLM obligations
 * - NER penalties vs LLM penalties
 * - Relations (e.g., if LLM says "납부 by 2025-05-31" but RE found no DEADLINE_OF relation → reject)
 */
export function validateLLMResponseHybrid(
  llmText: string,
  hybridData: HybridData
): ValidationResult {
  const issues: string[] = [];

  // First run standard rule-based validation
  const ruleBasedResult = validateLLMResponse(llmText, {
    deadlines: hybridData.deadlines,
    obligations: hybridData.obligations,
    penalties: hybridData.penalties,
  });

  issues.push(...ruleBasedResult.issues);

  // If we have NER entities, validate against them
  if (hybridData.nerEntities && hybridData.nerEntities.length > 0) {
    const nerIssues = validateAgainstNER(llmText, hybridData.nerEntities);
    issues.push(...nerIssues);
  }

  // If we have relations, validate LLM respects them
  if (hybridData.relations && hybridData.relations.length > 0) {
    const relationIssues = validateRelations(llmText, hybridData.relations);
    issues.push(...relationIssues);
  }

  // If we have merged data, use hybrid comparison
  if (hybridData.mergedData) {
    const { compareLLMAgainstMerged } = require('./hybrid-merger');
    const comparison = compareLLMAgainstMerged(llmText, hybridData.mergedData);
    issues.push(...comparison.issues);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validate LLM response against NER entities
 */
function validateAgainstNER(llmText: string, nerEntities: NEREntity[]): string[] {
  const issues: string[] = [];

  // Extract dates, money, actions from LLM text
  const llmDeadlines = extractDeadlines(llmText);
  const llmPenalties = extractPenalties(llmText);

  // Check NER DATE entities against LLM deadlines
  const nerDates = nerEntities.filter((e) => e.label === 'DATE' || e.label === 'DEADLINE');
  for (const nerDate of nerDates) {
    const matchingLLMDeadline = llmDeadlines.find((llmDeadline) => {
      return datesMatch(llmDeadline.date, nerDate.text);
    });

    // Check if date appears in LLM text (even if not extracted as deadline)
    const dateInText = llmText.includes(nerDate.text) || 
      llmText.includes(nerDate.text.replace(/[.\-\/]/g, '')) ||
      llmText.includes(nerDate.text.replace(/\./g, '-'));
    
    // Only flag if date is completely missing from response (not even mentioned)
    if (!matchingLLMDeadline && !dateInText) {
      // Check if it's a critical date (has year, month, day)
      const hasFullDate = /\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}/.test(nerDate.text);
      if (hasFullDate) {
        issues.push(
          `Missing NER deadline: NER found ${nerDate.text} but LLM response does not mention it`
        );
      }
    }
    // Don't flag date format differences as contradictions - allow paraphrasing
  }

  // Check NER MONEY entities against LLM penalties
  const nerMoney = nerEntities.filter((e) => e.label === 'MONEY');
  for (const nerMoneyEntity of nerMoney) {
    const matchingLLMPenalty = llmPenalties.find((llmPenalty) => {
      return amountsMatch(llmPenalty.amount, nerMoneyEntity.text);
    });

    if (!matchingLLMPenalty) {
      // Check if money is mentioned in LLM text (might be in different context)
      const moneyInLLM = llmText.includes(nerMoneyEntity.text) || 
        amountsMatch(extractAmountFromText(llmText, nerMoneyEntity.start), nerMoneyEntity.text);
      
      if (!moneyInLLM) {
        issues.push(
          `Missing NER amount: NER found ${nerMoneyEntity.text} but LLM response does not mention it`
        );
      }
    } else {
      // Check if amounts match
      if (!amountsMatch(matchingLLMPenalty.amount, nerMoneyEntity.text)) {
        issues.push(
          `Contradictory NER amount: NER found ${nerMoneyEntity.text} but LLM mentions ${matchingLLMPenalty.amount}원`
        );
      }
    }
  }

  // Check NER ACTION entities
  const nerActions = nerEntities.filter((e) => e.label === 'ACTION');
  const llmObligations = extractObligations(llmText);
  
  for (const nerAction of nerActions) {
    const actionMentioned = llmObligations.some((obligation) => {
      return obligation.description.includes(nerAction.text) ||
        nerAction.text.includes(obligation.description.substring(0, 20));
    });

    if (!actionMentioned && !llmText.includes(nerAction.text)) {
      issues.push(
        `Missing NER action: NER found "${nerAction.text}" but LLM response does not mention it`
      );
    }
  }

  return issues;
}

/**
 * Validate that LLM response respects extracted relations
 */
function validateRelations(llmText: string, relations: Relation[]): string[] {
  const issues: string[] = [];

  for (const relation of relations) {
    // Check DEADLINE_OF relations
    if (relation.type === 'DEADLINE_OF') {
      const dateText = relation.source.text;
      const actionText = relation.target.text;

      // Check if LLM mentions both date and action together
      const dateInLLM = llmText.includes(dateText) || extractDeadlines(llmText).some(d => datesMatch(d.date, dateText));
      const actionInLLM = llmText.includes(actionText);

      if (dateInLLM && actionInLLM) {
        // Check if they're mentioned together (within reasonable distance)
        const dateIndex = llmText.indexOf(dateText);
        const actionIndex = llmText.indexOf(actionText);
        
        if (dateIndex >= 0 && actionIndex >= 0) {
          const distance = Math.abs(actionIndex - dateIndex);
          if (distance > 200) {
            // Date and action are too far apart, might not be related
            issues.push(
              `Weak relation: LLM mentions deadline ${dateText} and action "${actionText}" but they are far apart in the response`
            );
          }
        }
      } else if (dateInLLM && !actionInLLM) {
        issues.push(
          `Missing relation target: LLM mentions deadline ${dateText} but not the related action "${actionText}"`
        );
      } else if (!dateInLLM && actionInLLM) {
        issues.push(
          `Missing relation source: LLM mentions action "${actionText}" but not the related deadline ${dateText}`
        );
      }
    }

    // Check PAYMENT_AMOUNT_FOR relations
    if (relation.type === 'PAYMENT_AMOUNT_FOR') {
      const amountText = relation.source.text;
      const targetText = relation.target.text;

      const amountInLLM = llmText.includes(amountText) || 
        extractPenalties(llmText).some(p => amountsMatch(p.amount, amountText));
      const targetInLLM = llmText.includes(targetText);

      if (amountInLLM && !targetInLLM) {
        issues.push(
          `Missing payment target: LLM mentions amount ${amountText} but not what it's for: "${targetText}"`
        );
      }
    }

    // Check PENALTY_FOR relations
    if (relation.type === 'PENALTY_FOR') {
      const penaltyAmount = relation.source.text;
      const penaltyTarget = relation.target.text;

      const amountInLLM = llmText.includes(penaltyAmount) ||
        extractPenalties(llmText).some(p => amountsMatch(p.amount, penaltyAmount));
      const targetInLLM = llmText.includes(penaltyTarget);

      if (amountInLLM && !targetInLLM) {
        issues.push(
          `Missing penalty context: LLM mentions penalty ${penaltyAmount} but not what it's for: "${penaltyTarget}"`
        );
      }
    }
  }

  return issues;
}

/**
 * Extract amount from text near a position (helper for NER validation)
 */
function extractAmountFromText(text: string, position: number): string {
  const start = Math.max(0, position - 50);
  const end = Math.min(text.length, position + 50);
  const context = text.substring(start, end);
  
  const amountMatch = context.match(/(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:원|만원|억원)?/);
  return amountMatch ? amountMatch[0] : '';
}


/**
 * Canonical Output Structure Builder
 * Creates unified, verified structure from NER + regex + RE + LLM
 */

import { MergedData } from './hybrid-merger';
import { Relation } from './relation-types';
import { Deadline, Obligation, Penalty } from './rules';
import { NEREntity } from '@/src/lib/ner/types';

export interface VerifiedDeadline {
  date: string; // Normalized YYYY-MM-DD
  context: string;
  type: string;
  verified: boolean;
  sources: ('ner' | 'regex' | 'llm')[];
}

export interface VerifiedAction {
  description: string;
  context: string;
  verified: boolean;
  sources: ('ner' | 'regex' | 'llm')[];
}

export interface VerifiedPenalty {
  amount: string; // Normalized numeric string
  type: string;
  context: string;
  verified: boolean;
  sources: ('ner' | 'regex' | 'llm')[];
}

export interface VerifiedAmount {
  amount: string; // Normalized numeric string
  currency: string; // e.g., "KRW"
  context: string;
  verified: boolean;
  sources: ('ner' | 'regex' | 'llm')[];
}

export interface VerifiedAccount {
  accountNumber: string;
  bankName?: string;
  accountHolder?: string;
  context: string;
  verified: boolean;
  sources: ('ner' | 'regex' | 'llm')[];
}

export interface CanonicalDocumentData {
  deadlines: VerifiedDeadline[];
  required_actions: VerifiedAction[];
  penalties: VerifiedPenalty[];
  amounts: VerifiedAmount[];
  account_numbers: VerifiedAccount[];
  verified: boolean;
  source: 'ner' | 'regex' | 'hybrid';
  createdAt: string;
  documentId?: string;
}

/**
 * Build canonical output structure from merged data
 */
export function buildCanonicalOutput(
  mergedData: MergedData,
  documentId?: string
): CanonicalDocumentData {
  // Convert deadlines
  const verifiedDeadlines: VerifiedDeadline[] = mergedData.deadlines.map((deadline) => ({
    date: normalizeDate(deadline.date),
    context: deadline.context,
    type: deadline.type,
    verified: true,
    sources: ['regex'] as ('ner' | 'regex' | 'llm')[],
  }));

  // Convert obligations to actions
  const verifiedActions: VerifiedAction[] = mergedData.obligations.map((obligation) => ({
    description: obligation.description,
    context: obligation.context,
    verified: true,
    sources: ['regex'] as ('ner' | 'regex' | 'llm')[],
  }));

  // Convert penalties
  const verifiedPenalties: VerifiedPenalty[] = mergedData.penalties.map((penalty) => ({
    amount: normalizeAmount(penalty.amount),
    type: penalty.type,
    context: penalty.context,
    verified: true,
    sources: ['regex'] as ('ner' | 'regex' | 'llm')[],
  }));

  // Extract amounts from entities
  const verifiedAmounts: VerifiedAmount[] = mergedData.entities
    .filter((e) => e.label === 'MONEY')
    .map((entity) => ({
      amount: normalizeAmount(entity.text),
      currency: 'KRW',
      context: entity.text,
      verified: true,
      sources: entity.sources as ('ner' | 'regex' | 'llm')[],
    }));

  // Extract account numbers from entities
  const verifiedAccounts: VerifiedAccount[] = mergedData.entities
    .filter((e) => e.label === 'ACCOUNT_NUMBER')
    .map((entity) => ({
      accountNumber: entity.text,
      context: entity.text,
      verified: true,
      sources: entity.sources as ('ner' | 'regex' | 'llm')[],
    }));

  // Determine source type
  const hasNER = mergedData.entities.some((e) => e.sources.includes('ner'));
  const hasRegex = mergedData.entities.some((e) => e.sources.includes('regex'));
  const source: 'ner' | 'regex' | 'hybrid' = hasNER && hasRegex ? 'hybrid' : hasNER ? 'ner' : 'regex';

  return {
    deadlines: verifiedDeadlines,
    required_actions: verifiedActions,
    penalties: verifiedPenalties,
    amounts: verifiedAmounts,
    account_numbers: verifiedAccounts,
    verified: true,
    source,
    createdAt: new Date().toISOString(),
    documentId,
  };
}

/**
 * Normalize date to YYYY-MM-DD format
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

  // MM월 DD일 (assume current year)
  const monthDayMatch = dateStr.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (monthDayMatch) {
    const currentYear = new Date().getFullYear();
    const month = monthDayMatch[1].padStart(2, '0');
    const day = monthDayMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  return dateStr;
}

/**
 * Normalize amount to numeric string
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


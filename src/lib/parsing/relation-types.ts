/**
 * Relation Extraction types
 */

import { NEREntity } from '@/src/lib/ner/types';

export type RelationType =
  | 'DEADLINE_OF'
  | 'PAYMENT_AMOUNT_FOR'
  | 'ACTION_REQUIRED'
  | 'PENALTY_FOR'
  | 'ACCOUNT_FOR'
  | 'ORGANIZATION_OF';

export interface Relation {
  type: RelationType;
  source: NEREntity;
  target: NEREntity;
  confidence?: number;
  context?: string; // Surrounding text for context
}

export interface RelationExtractionResult {
  relations: Relation[];
  text: string;
}


/**
 * NER entity types and interfaces
 */

export type NERLabel =
  | 'DATE'
  | 'MONEY'
  | 'LOCATION'
  | 'ORGANIZATION'
  | 'LAW_TERM'
  | 'ACTION'
  | 'DEADLINE'
  | 'PERSON'
  | 'ACCOUNT_NUMBER'
  | 'TAX_TYPE';

export interface NEREntity {
  text: string;
  label: NERLabel;
  start: number;
  end: number;
  confidence?: number;
}

export interface NERResult {
  entities: NEREntity[];
  text: string;
  model?: string;
}


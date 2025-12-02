/**
 * Pattern-based Relation Extraction (RE)
 * Links entities together using dependency parsing patterns and keywords
 */

import { NEREntity, NERLabel } from '@/src/lib/ner/types';
import { Relation, RelationType, RelationExtractionResult } from './relation-types';

/**
 * Entity-like interface for flexible input
 */
interface EntityLike {
  text: string;
  label: string | NERLabel;
  start: number;
  end: number;
}

/**
 * Extract relations between entities using pattern-based approach
 * Accepts both NEREntity and MergedEntity types
 */
export function extractRelations(
  text: string,
  entities: EntityLike[]
): RelationExtractionResult {
  const relations: Relation[] = [];

  // Convert entities to NEREntity format for relation extraction
  const nerEntities: NEREntity[] = entities.map((e) => ({
    text: e.text,
    label: (e.label as NERLabel) || ('UNKNOWN' as NERLabel),
    start: e.start,
    end: e.end,
  }));

  // Sort entities by position
  const sortedEntities = [...nerEntities].sort((a, b) => a.start - b.start);

  // Extract DEADLINE_OF relations (DATE/DEADLINE → ACTION)
  const deadlineRelations = extractDeadlineOfRelations(text, sortedEntities);
  relations.push(...deadlineRelations);

  // Extract PAYMENT_AMOUNT_FOR relations (MONEY → TAX_TYPE/ACTION)
  const paymentRelations = extractPaymentAmountForRelations(text, sortedEntities);
  relations.push(...paymentRelations);

  // Extract ACTION_REQUIRED relations (ACTION → context)
  const actionRelations = extractActionRequiredRelations(text, sortedEntities);
  relations.push(...actionRelations);

  // Extract PENALTY_FOR relations (MONEY → ACTION/DEADLINE)
  const penaltyRelations = extractPenaltyForRelations(text, sortedEntities);
  relations.push(...penaltyRelations);

  // Extract ACCOUNT_FOR relations (ACCOUNT_NUMBER → ACTION/ORGANIZATION)
  const accountRelations = extractAccountForRelations(text, sortedEntities);
  relations.push(...accountRelations);

  return {
    relations,
    text,
  };
}

/**
 * Extract DEADLINE_OF relations: DATE/DEADLINE → ACTION
 * Pattern: "2025년 5월 31일까지 납부하세요" or "납부 기한: 2025년 5월 31일"
 */
function extractDeadlineOfRelations(
  text: string,
  entities: NEREntity[]
): Relation[] {
  const relations: Relation[] = [];
  const dateEntities = entities.filter((e) => e.label === 'DATE' || e.label === 'DEADLINE');
  const actionEntities = entities.filter((e) => e.label === 'ACTION');

  for (const dateEntity of dateEntities) {
    // Find actions within 100 characters of the date
    const nearbyActions = actionEntities.filter((action) => {
      const distance = Math.abs(action.start - dateEntity.end);
      return distance <= 100;
    });

    for (const action of nearbyActions) {
      // Check if there's a connection keyword between them
      const start = Math.min(dateEntity.start, action.start);
      const end = Math.max(dateEntity.end, action.end);
      const context = text.substring(start, end);

      // Check for connection keywords
      const connectionKeywords = ['까지', '이전', '기한', '마감', '납부일', '제출일'];
      const hasConnection = connectionKeywords.some((keyword) => context.includes(keyword));

      if (hasConnection || Math.abs(action.start - dateEntity.end) <= 30) {
        relations.push({
          type: 'DEADLINE_OF',
          source: dateEntity,
          target: action,
          confidence: hasConnection ? 0.9 : 0.7,
          context: context.substring(0, 100),
        });
      }
    }
  }

  return relations;
}

/**
 * Extract PAYMENT_AMOUNT_FOR relations: MONEY → TAX_TYPE/ACTION
 * Pattern: "87,000원의 지방세" or "납부액: 87,000원"
 */
function extractPaymentAmountForRelations(
  text: string,
  entities: NEREntity[]
): Relation[] {
  const relations: Relation[] = [];
  const moneyEntities = entities.filter((e) => e.label === 'MONEY');
  const taxTypeEntities = entities.filter((e) => e.label === 'TAX_TYPE');
  const actionEntities = entities.filter((e) => e.label === 'ACTION');

  for (const moneyEntity of moneyEntities) {
    // Find tax types or actions within 50 characters
    const nearbyTaxTypes = taxTypeEntities.filter(
      (tax) => Math.abs(tax.start - moneyEntity.end) <= 50
    );
    const nearbyActions = actionEntities.filter(
      (action) => Math.abs(action.start - moneyEntity.end) <= 50
    );

    // Check for connection keywords
    const connectionKeywords = ['의', '납부액', '금액', '비용', '요금'];

    for (const taxType of nearbyTaxTypes) {
      const start = Math.min(moneyEntity.start, taxType.start);
      const end = Math.max(moneyEntity.end, taxType.end);
      const context = text.substring(start, end);
      const hasConnection = connectionKeywords.some((keyword) => context.includes(keyword));

      if (hasConnection || Math.abs(taxType.start - moneyEntity.end) <= 20) {
        relations.push({
          type: 'PAYMENT_AMOUNT_FOR',
          source: moneyEntity,
          target: taxType,
          confidence: hasConnection ? 0.85 : 0.65,
          context: context.substring(0, 100),
        });
      }
    }

    for (const action of nearbyActions) {
      const start = Math.min(moneyEntity.start, action.start);
      const end = Math.max(moneyEntity.end, action.end);
      const context = text.substring(start, end);
      const hasConnection = connectionKeywords.some((keyword) => context.includes(keyword));

      if (hasConnection || Math.abs(action.start - moneyEntity.end) <= 20) {
        relations.push({
          type: 'PAYMENT_AMOUNT_FOR',
          source: moneyEntity,
          target: action,
          confidence: hasConnection ? 0.8 : 0.6,
          context: context.substring(0, 100),
        });
      }
    }
  }

  return relations;
}

/**
 * Extract ACTION_REQUIRED relations: ACTION → context keywords
 * Pattern: "서류 제출 필수" or "반드시 납부해야 합니다"
 */
function extractActionRequiredRelations(
  text: string,
  entities: NEREntity[]
): Relation[] {
  const relations: Relation[] = [];
  const actionEntities = entities.filter((e) => e.label === 'ACTION');

  const requiredKeywords = ['필수', '의무', '반드시', '해야', '해야함', '해야합니다'];

  for (const action of actionEntities) {
    // Check for required keywords near the action
    const start = Math.max(0, action.start - 30);
    const end = Math.min(text.length, action.end + 30);
    const context = text.substring(start, end);

    const hasRequiredKeyword = requiredKeywords.some((keyword) => context.includes(keyword));

    if (hasRequiredKeyword) {
      // Create a virtual "REQUIRED" entity for the relation target
      const requiredEntity: NEREntity = {
        text: '필수',
        label: 'ACTION',
        start: context.indexOf('필수') >= 0 ? context.indexOf('필수') + start : action.start,
        end: context.indexOf('필수') >= 0 ? context.indexOf('필수') + start + 2 : action.end,
        confidence: 0.9,
      };

      relations.push({
        type: 'ACTION_REQUIRED',
        source: action,
        target: requiredEntity,
        confidence: 0.85,
        context: context.substring(0, 100),
      });
    }
  }

  return relations;
}

/**
 * Extract PENALTY_FOR relations: MONEY → ACTION/DEADLINE
 * Pattern: "기한 초과 시 가산세 5%" or "과태료 10만원"
 */
function extractPenaltyForRelations(
  text: string,
  entities: NEREntity[]
): Relation[] {
  const relations: Relation[] = [];
  const moneyEntities = entities.filter((e) => e.label === 'MONEY');
  const actionEntities = entities.filter((e) => e.label === 'ACTION');
  const deadlineEntities = entities.filter((e) => e.label === 'DEADLINE' || e.label === 'DATE');

  const penaltyKeywords = ['과태료', '벌금', '가산세', '처벌', '제재', '불이익'];

  for (const moneyEntity of moneyEntities) {
    // Check if money is near penalty keywords
    const start = Math.max(0, moneyEntity.start - 50);
    const end = Math.min(text.length, moneyEntity.end + 50);
    const context = text.substring(start, end);

    const hasPenaltyKeyword = penaltyKeywords.some((keyword) => context.includes(keyword));

    if (hasPenaltyKeyword) {
      // Find nearby actions or deadlines
      const nearbyActions = actionEntities.filter(
        (action) => Math.abs(action.start - moneyEntity.end) <= 100
      );
      const nearbyDeadlines = deadlineEntities.filter(
        (deadline) => Math.abs(deadline.start - moneyEntity.end) <= 100
      );

      for (const action of nearbyActions) {
        relations.push({
          type: 'PENALTY_FOR',
          source: moneyEntity,
          target: action,
          confidence: 0.8,
          context: context.substring(0, 100),
        });
      }

      for (const deadline of nearbyDeadlines) {
        relations.push({
          type: 'PENALTY_FOR',
          source: moneyEntity,
          target: deadline,
          confidence: 0.75,
          context: context.substring(0, 100),
        });
      }
    }
  }

  return relations;
}

/**
 * Extract ACCOUNT_FOR relations: ACCOUNT_NUMBER → ACTION/ORGANIZATION
 * Pattern: "계좌번호: 123-456-789 (납부)" or "입금계좌: 123-456-789"
 */
function extractAccountForRelations(
  text: string,
  entities: NEREntity[]
): Relation[] {
  const relations: Relation[] = [];
  const accountEntities = entities.filter((e) => e.label === 'ACCOUNT_NUMBER');
  const actionEntities = entities.filter((e) => e.label === 'ACTION');
  const orgEntities = entities.filter((e) => e.label === 'ORGANIZATION');

  const accountKeywords = ['계좌', '입금', '납부', '송금'];

  for (const accountEntity of accountEntities) {
    // Check for account keywords nearby
    const start = Math.max(0, accountEntity.start - 50);
    const end = Math.min(text.length, accountEntity.end + 50);
    const context = text.substring(start, end);

    const hasAccountKeyword = accountKeywords.some((keyword) => context.includes(keyword));

    if (hasAccountKeyword) {
      // Find nearby actions or organizations
      const nearbyActions = actionEntities.filter(
        (action) => Math.abs(action.start - accountEntity.end) <= 100
      );
      const nearbyOrgs = orgEntities.filter(
        (org) => Math.abs(org.start - accountEntity.end) <= 100
      );

      for (const action of nearbyActions) {
        relations.push({
          type: 'ACCOUNT_FOR',
          source: accountEntity,
          target: action,
          confidence: 0.75,
          context: context.substring(0, 100),
        });
      }

      for (const org of nearbyOrgs) {
        relations.push({
          type: 'ACCOUNT_FOR',
          source: accountEntity,
          target: org,
          confidence: 0.7,
          context: context.substring(0, 100),
        });
      }
    }
  }

  return relations;
}


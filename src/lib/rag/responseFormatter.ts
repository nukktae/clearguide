/**
 * Response formatting and citation system for RAG
 * Handles citation formatting, validation, and refusal logic
 */

import type { RetrievedChunk } from "@/src/lib/supabase/client";

export interface Citation {
  sourceNumber: number;
  chunkText: string;
  pageNumber?: number;
  similarity: number;
}

export interface FormattedResponse {
  answer: string;
  citations: Citation[];
  hasEvidence: boolean;
  isRefusal: boolean;
}

/**
 * Refusal messages when no relevant evidence is found
 */
const REFUSAL_MESSAGES = {
  ko: `죄송합니다. 제공된 문서에서 해당 질문에 대한 정보를 찾을 수 없습니다.

다음과 같은 경우일 수 있습니다:
- 질문이 문서 내용과 관련이 없을 수 있습니다
- 문서에 해당 정보가 포함되어 있지 않을 수 있습니다

문서에 포함된 내용에 대해 다시 질문해 주세요.`,
  en: `I'm sorry, but I couldn't find information about your question in the provided document.

This could be because:
- Your question may not be related to the document content
- The document may not contain this information

Please try asking about something that's included in the document.`,
};

/**
 * Build citation-enforced system prompt for RAG
 */
export function buildRAGSystemPrompt(
  baseSystemPrompt: string,
  hasContext: boolean
): string {
  if (!hasContext) {
    return baseSystemPrompt;
  }

  const ragInstructions = `

## 중요: 증거 기반 답변 규칙

당신은 아래 제공된 문서 출처(Sources)에서만 정보를 찾아 답변해야 합니다.

### 반드시 지켜야 할 규칙:
1. **오직 제공된 출처에서만 정보를 사용하세요**
2. **답변할 때 반드시 [출처 N] 형식으로 인용하세요**
3. **출처에 없는 정보는 절대 추측하거나 만들어내지 마세요**
4. **출처에서 찾을 수 없는 질문에는 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 답하세요**
5. **번역 요청의 경우: 사용자가 문서나 문서 내용을 번역해달라고 요청하면, 제공된 출처의 내용을 번역해드릴 수 있습니다**

### 답변 형식:
- 각 정보 뒤에 [출처 1], [출처 2] 등의 인용을 포함하세요
- 여러 출처에서 정보를 조합할 경우 모든 관련 출처를 인용하세요
- 불확실한 경우 "문서에 따르면" 또는 "출처에 의하면" 등의 표현을 사용하세요

### 예시:
❌ 잘못된 답변: "납부 기한은 1월 31일입니다."
✅ 올바른 답변: "납부 기한은 2025년 1월 31일까지입니다. [출처 1]"`;

  return baseSystemPrompt + ragInstructions;
}

/**
 * Build user prompt with RAG context
 */
export function buildRAGUserPrompt(
  userMessage: string,
  ragContext: string | null,
  chunks: RetrievedChunk[]
): string {
  if (!ragContext || chunks.length === 0) {
    return userMessage;
  }

  return `## 문서 출처 (Sources)

아래는 질문과 관련된 문서의 일부입니다. 이 출처들만 사용하여 답변하세요.

${ragContext}

---

## 사용자 질문

${userMessage}

---

위 출처를 참고하여 답변해주세요. 출처에 없는 정보는 답변하지 마세요.`;
}

/**
 * Generate refusal response when no relevant content found
 */
export function generateRefusalResponse(language: "ko" | "en" = "ko"): FormattedResponse {
  return {
    answer: REFUSAL_MESSAGES[language],
    citations: [],
    hasEvidence: false,
    isRefusal: true,
  };
}

/**
 * Extract citations from AI response
 */
export function extractCitations(
  response: string,
  chunks: RetrievedChunk[]
): Citation[] {
  const citations: Citation[] = [];
  const citationPattern = /\[출처\s*(\d+)\]/g;
  const usedSources = new Set<number>();

  let match;
  while ((match = citationPattern.exec(response)) !== null) {
    const sourceNum = parseInt(match[1], 10);
    usedSources.add(sourceNum);
  }

  // Build citations for each used source
  usedSources.forEach(sourceNum => {
    const chunkIndex = sourceNum - 1;
    if (chunkIndex >= 0 && chunkIndex < chunks.length) {
      const chunk = chunks[chunkIndex];
      citations.push({
        sourceNumber: sourceNum,
        chunkText: chunk.chunk_text,
        pageNumber: chunk.metadata?.pageNumber,
        similarity: chunk.similarity,
      });
    }
  });

  // Sort by source number
  citations.sort((a, b) => a.sourceNumber - b.sourceNumber);

  return citations;
}

/**
 * Format response with citation footer
 */
export function formatResponseWithCitations(
  aiResponse: string,
  chunks: RetrievedChunk[]
): FormattedResponse {
  // Check if response indicates no information found
  const noInfoIndicators = [
    "찾을 수 없습니다",
    "없습니다",
    "포함되어 있지 않",
    "확인할 수 없",
    "couldn't find",
    "cannot find",
    "not found",
    "no information",
  ];

  const isRefusal = noInfoIndicators.some(indicator => 
    aiResponse.toLowerCase().includes(indicator.toLowerCase())
  );

  if (isRefusal && chunks.length === 0) {
    return generateRefusalResponse();
  }

  // Extract citations from response
  const citations = extractCitations(aiResponse, chunks);
  const hasEvidence = citations.length > 0;

  // Build formatted answer with citation footer if citations exist
  let answer = aiResponse;

  if (citations.length > 0) {
    const citationFooter = buildCitationFooter(citations);
    answer = `${aiResponse}\n\n${citationFooter}`;
  }

  return {
    answer,
    citations,
    hasEvidence,
    isRefusal: false,
  };
}

/**
 * Build citation footer for response
 */
function buildCitationFooter(citations: Citation[]): string {
  if (citations.length === 0) {
    return "";
  }

  const footer = ["---", "📚 **출처:**"];

  citations.forEach(citation => {
    const pageInfo = citation.pageNumber ? ` (페이지 ${citation.pageNumber})` : "";
    // Truncate long quotes
    const truncatedText = citation.chunkText.length > 100 
      ? citation.chunkText.substring(0, 100) + "..."
      : citation.chunkText;
    
    footer.push(`[${citation.sourceNumber}]${pageInfo} "${truncatedText}"`);
  });

  return footer.join("\n");
}

/**
 * Validate that response properly uses citations
 */
export function validateResponse(
  response: string,
  chunks: RetrievedChunk[]
): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if response has any citations when chunks were provided
  if (chunks.length > 0) {
    const citationPattern = /\[출처\s*\d+\]/g;
    const hasCitations = citationPattern.test(response);

    if (!hasCitations) {
      issues.push("Response does not include any source citations");
    }
  }

  // Check for invalid citation numbers
  const citationNumbers = [...response.matchAll(/\[출처\s*(\d+)\]/g)]
    .map(match => parseInt(match[1], 10));
  
  const invalidCitations = citationNumbers.filter(num => num < 1 || num > chunks.length);
  if (invalidCitations.length > 0) {
    issues.push(`Invalid citation numbers: ${invalidCitations.join(", ")}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Post-process AI response for citation consistency
 */
export function postProcessResponse(
  response: string,
  chunks: RetrievedChunk[]
): string {
  // Normalize citation format
  let processed = response
    .replace(/\[소스\s*(\d+)\]/gi, "[출처 $1]")
    .replace(/\[source\s*(\d+)\]/gi, "[출처 $1]")
    .replace(/\[Source\s*(\d+)\]/gi, "[출처 $1]")
    .replace(/\[출처(\d+)\]/g, "[출처 $1]");

  return processed;
}


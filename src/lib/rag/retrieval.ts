/**
 * Semantic retrieval pipeline for RAG system
 * Handles query embedding and chunk retrieval with similarity filtering
 */

import { embedQuery } from "./embeddings";
import { searchSimilarChunks, hasChunks } from "@/src/lib/supabase/vectors";
import { isSupabaseConfigured, type RetrievedChunk } from "@/src/lib/supabase/client";

export interface RetrievalOptions {
  topK?: number;                    // Number of chunks to retrieve (default: 5)
  similarityThreshold?: number;     // Minimum similarity score (default: 0.7)
  includeMetadata?: boolean;        // Include chunk metadata (default: true)
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  hasRelevantContent: boolean;
  query: string;
  documentId: string;
}

const DEFAULT_TOP_K = 5;
const DEFAULT_SIMILARITY_THRESHOLD = 0.7;

/**
 * Retrieve relevant chunks for a user query
 */
export async function retrieveRelevantChunks(
  query: string,
  documentId: string,
  userId: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  const {
    topK = DEFAULT_TOP_K,
    similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
  } = options;

  // Check if RAG is available
  if (!isSupabaseConfigured()) {
    console.warn("[Retrieval] Supabase not configured, RAG not available");
    return {
      chunks: [],
      hasRelevantContent: false,
      query,
      documentId,
    };
  }

  // Check if document has embeddings
  const documentHasChunks = await hasChunks(documentId, userId);
  if (!documentHasChunks) {
    console.log(`[Retrieval] No chunks found for document: ${documentId}`);
    return {
      chunks: [],
      hasRelevantContent: false,
      query,
      documentId,
    };
  }

  try {
    // Generate query embedding
    console.log(`[Retrieval] Generating embedding for query: "${query.substring(0, 50)}..."`);
    const queryEmbedding = await embedQuery(query);

    // Search for similar chunks
    console.log(`[Retrieval] Searching for similar chunks (threshold: ${similarityThreshold}, topK: ${topK})`);
    const chunks = await searchSimilarChunks(
      queryEmbedding,
      documentId,
      userId,
      {
        limit: topK,
        similarityThreshold,
      }
    );

    const hasRelevantContent = chunks.length > 0;

    console.log(`[Retrieval] Found ${chunks.length} relevant chunks`);
    if (chunks.length > 0) {
      console.log(`[Retrieval] Top chunk similarity: ${chunks[0].similarity.toFixed(3)}`);
    }

    return {
      chunks,
      hasRelevantContent,
      query,
      documentId,
    };
  } catch (error) {
    console.error("[Retrieval] Error retrieving chunks:", error);
    throw error;
  }
}

/**
 * Format retrieved chunks for prompt context
 * 
 * Note: Chunks are numbered [출처 1], [출처 2], etc. in the order they are retrieved,
 * which matches the similarity-sorted order from Supabase (most similar first).
 * This ensures citation numbers correspond to relevance ranking.
 */
export function formatChunksForContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "";
  }

  const formattedChunks = chunks.map((chunk, index) => {
    const sourceNum = index + 1;
    const pageInfo = chunk.metadata?.pageNumber 
      ? ` (페이지 ${chunk.metadata.pageNumber})` 
      : "";
    
    return `[출처 ${sourceNum}]${pageInfo}:\n"${chunk.chunk_text}"`;
  });

  return formattedChunks.join("\n\n");
}

/**
 * Build RAG context for chat prompt
 * Returns null if no relevant content found
 */
export async function buildRAGContext(
  query: string,
  documentId: string,
  userId: string,
  options: RetrievalOptions = {}
): Promise<{
  context: string | null;
  chunks: RetrievedChunk[];
  hasRelevantContent: boolean;
}> {
  const result = await retrieveRelevantChunks(query, documentId, userId, options);

  if (!result.hasRelevantContent) {
    return {
      context: null,
      chunks: [],
      hasRelevantContent: false,
    };
  }

  const context = formatChunksForContext(result.chunks);

  return {
    context,
    chunks: result.chunks,
    hasRelevantContent: true,
  };
}

/**
 * Check if a query should use RAG
 * Some queries (greetings, general questions) don't need document context
 */
export function shouldUseRAG(query: string): boolean {
  const lowercaseQuery = query.toLowerCase().trim();

  // Patterns that don't need RAG
  const noRAGPatterns = [
    /^안녕/,
    /^hello/i,
    /^hi$/i,
    /^고마워/,
    /^감사/,
    /^thank/i,
    /^도움이? ?됐/,
    /^잘 ?했/,
  ];

  for (const pattern of noRAGPatterns) {
    if (pattern.test(lowercaseQuery)) {
      return false;
    }
  }

  // If the query mentions the document or asks about content, use RAG
  const ragIndicators = [
    "문서",
    "내용",
    "뭐",
    "무엇",
    "어떻게",
    "언제",
    "어디",
    "누가",
    "왜",
    "기한",
    "마감",
    "납부",
    "신청",
    "제출",
    "what",
    "when",
    "where",
    "who",
    "why",
    "how",
    "document",
    "content",
  ];

  for (const indicator of ragIndicators) {
    if (lowercaseQuery.includes(indicator)) {
      return true;
    }
  }

  // Default to using RAG for safety
  return true;
}

/**
 * Estimate query complexity for dynamic threshold adjustment
 */
export function estimateQueryComplexity(query: string): "simple" | "medium" | "complex" {
  const wordCount = query.split(/\s+/).length;
  const hasMultipleQuestions = (query.match(/[?？]/g) || []).length > 1;
  
  if (wordCount <= 5 && !hasMultipleQuestions) {
    return "simple";
  } else if (wordCount <= 15 || hasMultipleQuestions) {
    return "medium";
  } else {
    return "complex";
  }
}

/**
 * Get adaptive retrieval options based on query complexity
 */
export function getAdaptiveOptions(query: string): RetrievalOptions {
  const complexity = estimateQueryComplexity(query);

  switch (complexity) {
    case "simple":
      return {
        topK: 3,
        similarityThreshold: 0.75,
      };
    case "medium":
      return {
        topK: 5,
        similarityThreshold: 0.7,
      };
    case "complex":
      return {
        topK: 7,
        similarityThreshold: 0.65,
      };
    default:
      return {
        topK: DEFAULT_TOP_K,
        similarityThreshold: DEFAULT_SIMILARITY_THRESHOLD,
      };
  }
}


/**
 * RAG (Retrieval-Augmented Generation) module
 * 
 * This module provides:
 * - Document chunking with metadata
 * - Embedding generation using OpenAI
 * - Semantic search and retrieval
 * - Citation-enforced response formatting
 */

// Chunking utilities
export {
  chunkText,
  chunkTextWithPages,
  getOptimalChunkParams,
  type TextChunk,
  type ChunkMetadata,
  type ChunkingOptions,
} from "./chunking";

// Embedding generation
export {
  generateEmbedding,
  generateEmbeddings,
  embedChunks,
  embedQuery,
  cosineSimilarity,
} from "./embeddings";

// Retrieval pipeline
export {
  retrieveRelevantChunks,
  formatChunksForContext,
  buildRAGContext,
  shouldUseRAG,
  estimateQueryComplexity,
  getAdaptiveOptions,
  type RetrievalOptions,
  type RetrievalResult,
} from "./retrieval";

// Response formatting
export {
  buildRAGSystemPrompt,
  buildRAGUserPrompt,
  generateRefusalResponse,
  extractCitations,
  formatResponseWithCitations,
  validateResponse,
  postProcessResponse,
  type Citation,
  type FormattedResponse,
} from "./responseFormatter";


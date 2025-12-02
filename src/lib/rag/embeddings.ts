/**
 * Embedding generation for RAG system
 * Uses OpenAI text-embedding-3-small for cost-effective embeddings
 */

import { openai } from "@/src/lib/openai/client";
import type { TextChunk } from "./chunking";
import type { DocumentChunk } from "@/src/lib/supabase/client";

// OpenAI embedding model configuration
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 100; // OpenAI allows up to 2048 inputs, but we limit for safety

export interface EmbeddingResult {
  embedding: number[];
  index: number;
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("[Embeddings] Error generating single embedding:", error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  // Filter out empty texts and track indices
  const validTexts: { text: string; originalIndex: number }[] = [];
  texts.forEach((text, index) => {
    if (text && text.trim().length > 0) {
      validTexts.push({ text: text.trim(), originalIndex: index });
    }
  });

  if (validTexts.length === 0) {
    return texts.map(() => []);
  }

  try {
    // Process in batches if necessary
    const allEmbeddings: { embedding: number[]; originalIndex: number }[] = [];

    for (let i = 0; i < validTexts.length; i += MAX_BATCH_SIZE) {
      const batch = validTexts.slice(i, i + MAX_BATCH_SIZE);
      const batchTexts = batch.map(item => item.text);

      console.log(`[Embeddings] Processing batch ${Math.floor(i / MAX_BATCH_SIZE) + 1}/${Math.ceil(validTexts.length / MAX_BATCH_SIZE)}`);

      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batchTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      // Map embeddings back to original indices
      response.data.forEach((embedding, batchIndex) => {
        allEmbeddings.push({
          embedding: embedding.embedding,
          originalIndex: batch[batchIndex].originalIndex,
        });
      });
    }

    // Reconstruct array with embeddings in original order
    const result: number[][] = texts.map(() => []);
    allEmbeddings.forEach(({ embedding, originalIndex }) => {
      result[originalIndex] = embedding;
    });

    return result;
  } catch (error) {
    console.error("[Embeddings] Error generating batch embeddings:", error);
    throw error;
  }
}

/**
 * Generate embeddings for text chunks and prepare for storage
 */
export async function embedChunks(
  chunks: TextChunk[],
  documentId: string,
  userId: string
): Promise<DocumentChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  console.log(`[Embeddings] Generating embeddings for ${chunks.length} chunks`);

  try {
    // Extract texts from chunks
    const texts = chunks.map(chunk => chunk.text);

    // Generate embeddings in batch
    const embeddings = await generateEmbeddings(texts);

    // Combine chunks with their embeddings
    const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => ({
      document_id: documentId,
      user_id: userId,
      chunk_index: chunk.metadata.chunkIndex,
      chunk_text: chunk.text,
      embedding: embeddings[index],
      metadata: {
        startChar: chunk.metadata.startChar,
        endChar: chunk.metadata.endChar,
        pageNumber: chunk.metadata.pageNumber,
        fileName: chunk.metadata.fileName,
      },
    }));

    console.log(`[Embeddings] Generated ${documentChunks.length} embedded chunks`);
    return documentChunks;
  } catch (error) {
    console.error("[Embeddings] Error embedding chunks:", error);
    throw error;
  }
}

/**
 * Generate embedding for a user query
 * Optimized for question-style text
 */
export async function embedQuery(query: string): Promise<number[]> {
  if (!query || query.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty query");
  }

  try {
    // For queries, we don't need to truncate as they're typically short
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query.trim(),
      dimensions: EMBEDDING_DIMENSIONS,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("[Embeddings] Error generating query embedding:", error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 * Used for local similarity calculations if needed
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have the same dimension");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}


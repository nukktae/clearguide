/**
 * Vector storage CRUD operations for Supabase
 * Handles document chunk embeddings for RAG system
 */

import { supabase, isSupabaseConfigured, type DocumentChunk, type RetrievedChunk } from "./client";

const TABLE_NAME = "document_chunks";

/**
 * Store a document chunk with its embedding
 */
export async function storeChunk(chunk: DocumentChunk): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn("[Vectors] Supabase not configured, skipping chunk storage");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        document_id: chunk.document_id,
        user_id: chunk.user_id,
        chunk_index: chunk.chunk_index,
        chunk_text: chunk.chunk_text,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Vectors] Error storing chunk:", error);
      throw error;
    }

    return data?.id || null;
  } catch (error) {
    console.error("[Vectors] Failed to store chunk:", error);
    throw error;
  }
}

/**
 * Store multiple chunks in batch
 */
export async function storeChunks(chunks: DocumentChunk[]): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn("[Vectors] Supabase not configured, skipping batch chunk storage");
    return 0;
  }

  if (chunks.length === 0) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(
        chunks.map((chunk) => ({
          document_id: chunk.document_id,
          user_id: chunk.user_id,
          chunk_index: chunk.chunk_index,
          chunk_text: chunk.chunk_text,
          embedding: chunk.embedding,
          metadata: chunk.metadata,
        }))
      )
      .select("id");

    if (error) {
      console.error("[Vectors] Error storing chunks:", error);
      throw error;
    }

    console.log(`[Vectors] Stored ${data?.length || 0} chunks successfully`);
    return data?.length || 0;
  } catch (error) {
    console.error("[Vectors] Failed to store chunks:", error);
    throw error;
  }
}

/**
 * Search for similar chunks using vector similarity
 * Uses Supabase's built-in vector similarity search with pgvector
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  documentId: string,
  userId: string,
  options: {
    limit?: number;
    similarityThreshold?: number;
  } = {}
): Promise<RetrievedChunk[]> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn("[Vectors] Supabase not configured, returning empty results");
    return [];
  }

  const { limit = 5, similarityThreshold = 0.7 } = options;

  try {
    // Use Supabase's RPC function for vector similarity search
    // Note: Results are sorted by similarity (most similar first) via ORDER BY in SQL function
    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_document_id: documentId,
      match_user_id: userId,
      match_threshold: similarityThreshold,
      match_count: limit,
    });

    if (error) {
      console.error("[Vectors] Error searching similar chunks:", error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      document_id: row.document_id,
      user_id: row.user_id,
      chunk_index: row.chunk_index,
      chunk_text: row.chunk_text,
      metadata: row.metadata,
      similarity: row.similarity,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error("[Vectors] Failed to search similar chunks:", error);
    throw error;
  }
}

/**
 * Get all chunks for a document
 */
export async function getChunksByDocumentId(
  documentId: string,
  userId: string
): Promise<DocumentChunk[]> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn("[Vectors] Supabase not configured, returning empty results");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .order("chunk_index", { ascending: true });

    if (error) {
      console.error("[Vectors] Error getting chunks:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("[Vectors] Failed to get chunks:", error);
    throw error;
  }
}

/**
 * Delete all chunks for a document
 */
export async function deleteChunksByDocumentId(
  documentId: string,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn("[Vectors] Supabase not configured, skipping deletion");
    return false;
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Vectors] Error deleting chunks:", error);
      throw error;
    }

    console.log(`[Vectors] Deleted chunks for document: ${documentId}`);
    return true;
  } catch (error) {
    console.error("[Vectors] Failed to delete chunks:", error);
    throw error;
  }
}

/**
 * Check if a document has chunks stored
 */
export async function hasChunks(documentId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { count, error } = await supabase
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
      .eq("document_id", documentId)
      .eq("user_id", userId);

    if (error) {
      console.error("[Vectors] Error checking chunks:", error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error("[Vectors] Failed to check chunks:", error);
    return false;
  }
}


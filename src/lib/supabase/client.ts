/**
 * Supabase client for vector database operations and file storage
 * Used for RAG (Retrieval-Augmented Generation) system and document file storage
 */

import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("[Supabase] SUPABASE_URL is not set - RAG features will be disabled");
}

if (!supabaseServiceKey) {
  console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set - RAG features will be disabled");
}

/**
 * Supabase client instance
 * Uses service role key for server-side operations
 */
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Document chunk type stored in Supabase
 */
export interface DocumentChunk {
  id?: string;
  document_id: string;
  user_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding?: number[];
  metadata?: {
    startChar: number;
    endChar: number;
    pageNumber?: number;
    fileName?: string;
  };
  created_at?: string;
}

/**
 * Retrieved chunk with similarity score
 */
export interface RetrievedChunk extends DocumentChunk {
  similarity: number;
}


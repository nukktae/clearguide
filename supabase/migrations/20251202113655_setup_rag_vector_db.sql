-- Supabase Schema for RAG System
-- Run this in the Supabase SQL Editor to set up the vector database

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the document_chunks table for storing embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(1536),  -- text-embedding-3-small produces 1536 dimensions
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_user ON document_chunks(document_id, user_id);

-- Create IVFFlat index for vector similarity search
-- Note: Run this AFTER inserting some data, as IVFFlat requires training data
-- For small datasets, you can use HNSW instead which doesn't require training
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Create the similarity search function
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(1536),
  match_document_id TEXT,
  match_user_id TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id TEXT,
  user_id TEXT,
  chunk_index INTEGER,
  chunk_text TEXT,
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.user_id,
    dc.chunk_index,
    dc.chunk_text,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.created_at
  FROM document_chunks dc
  WHERE 
    dc.document_id = match_document_id
    AND dc.user_id = match_user_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON document_chunks TO authenticated;
-- GRANT EXECUTE ON FUNCTION match_document_chunks TO authenticated;

-- Row Level Security (RLS) policies
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own chunks
CREATE POLICY "Users can view own chunks"
  ON document_chunks
  FOR SELECT
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own chunks"
  ON document_chunks
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own chunks"
  ON document_chunks
  FOR DELETE
  USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

-- Service role bypass for server-side operations
CREATE POLICY "Service role full access"
  ON document_chunks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


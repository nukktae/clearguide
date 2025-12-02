/**
 * Supabase Storage utilities for file operations
 */

import { supabase } from "@/src/lib/supabase/client";

const SUPABASE_BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "clearguide-files";

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFileFromSupabase(fileName: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const { error } = await supabase
    .storage
    .from(SUPABASE_BUCKET_NAME)
    .remove([fileName]);

  if (error) {
    throw new Error(`Failed to delete file from Supabase: ${error.message}`);
  }
}

/**
 * Check if a file exists in Supabase Storage
 */
export async function fileExistsInSupabase(fileName: string): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .storage
    .from(SUPABASE_BUCKET_NAME)
    .list(fileName.split('/').slice(0, -1).join('/') || '', {
      search: fileName.split('/').pop() || '',
    });

  if (error) {
    return false;
  }

  return data && data.length > 0;
}


/**
 * Supabase Admin Client (Server-only)
 * Uses SERVICE_ROLE_KEY for full admin access to private buckets
 * DO NOT expose this client to the client-side
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('[Supabase Server] SUPABASE_URL is required');
}

if (!supabaseServiceKey) {
  throw new Error('[Supabase Server] SUPABASE_SERVICE_ROLE_KEY is required');
}

/**
 * Supabase Admin client instance
 * Uses service role key for server-side operations with full admin access
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);


import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  // FIXED: Use server-only SUPABASE_URL when available; fall back to public URL.
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  return createSupabaseClient(url, serviceKey);
}

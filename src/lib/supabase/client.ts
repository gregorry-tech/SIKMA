import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // With autoRefreshToken disabled to prevent navigator.locks issues,
  // we rely on explicit token refresh when needed.
  // Session persistence is still enabled for login state.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    }
  );
}

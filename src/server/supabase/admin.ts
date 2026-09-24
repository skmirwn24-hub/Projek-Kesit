import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client using NEXT_SUPABASE_SECRET (Service Role Key).
 * WARNING: This client bypasses Row Level Security (RLS).
 * Only use in server-side services (Server Actions, Route Handlers) for administrative tasks
 * such as pre-login username-to-email resolution and system sync.
 * NEVER expose this or import this into client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret = process.env.NEXT_SUPABASE_SECRET;

  if (!supabaseUrl || !supabaseSecret) {
    throw new Error('Supabase admin environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_SUPABASE_SECRET) are missing');
  }

  return createClient(supabaseUrl, supabaseSecret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

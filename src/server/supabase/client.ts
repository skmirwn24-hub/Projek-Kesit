import { createBrowserClient } from '@supabase/ssr';
import { authCookieOptions } from './config';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: authCookieOptions,
  });
}

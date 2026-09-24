/**
 * Supabase Client Shared Configuration
 *
 * Mengambil nama cookie dari environment variable NEXT_PUBLIC_AUTH_COOKIE_NAME
 * dengan fallback default 'kesit_auth_token'.
 */

export const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME;

export const authCookieOptions = {
  name: AUTH_COOKIE_NAME,
};

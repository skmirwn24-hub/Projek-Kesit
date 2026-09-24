/**
 * Supabase Client Shared Cookie Configuration
 *
 * Mengambil nama cookie dan opsi sameSite dari environment variable:
 * - NEXT_PUBLIC_AUTH_COOKIE_NAME (default: 'kesit_token')
 * - NEXT_PUBLIC_AUTH_COOKIE_SAMESITE (default: 'lax')
 */

export const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || 'kesit_token';

export const authCookieOptions = {
  name: AUTH_COOKIE_NAME,
  path: '/',
  // httpOnly HARUS false agar browser client Supabase (@supabase/ssr) dapat membaca session token
  httpOnly: false,
  // Otomatis aktif (HTTPS) saat production
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NEXT_PUBLIC_AUTH_COOKIE_SAMESITE as 'lax' | 'strict') || 'lax',
  // 400 hari (standar RFC 6265bis)
  maxAge: 400 * 24 * 60 * 60,
};

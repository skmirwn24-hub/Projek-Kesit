/**
 * Supabase Client Shared Cookie Configuration
 *
 * Mengambil nama cookie dan opsi dari environment variable:
 * - NEXT_PUBLIC_AUTH_COOKIE_NAME: Nama cookie (default: 'kesit_auth_token')
 * - NEXT_PUBLIC_AUTH_COOKIE_SAMESITE: 'lax' (default standar) atau 'strict'
 */

export const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || 'kesit_auth_token';

const sameSiteEnv = process.env.NEXT_PUBLIC_AUTH_COOKIE_SAMESITE?.toLowerCase();
export const AUTH_COOKIE_SAMESITE: 'lax' | 'strict' =
  sameSiteEnv === 'strict' ? 'strict' : 'lax';

export const authCookieOptions = {
  name: AUTH_COOKIE_NAME,
  path: '/',
  // httpOnly HARUS false agar browser client Supabase (@supabase/ssr) dapat membaca session token
  httpOnly: false,
  // Otomatis aktif (HTTPS) saat production, aman untuk localhost dev
  secure: process.env.NODE_ENV === 'production',
  // 'lax' direkomendasikan untuk mencegah user ter-logout saat membuka link dari WhatsApp/Email
  sameSite: AUTH_COOKIE_SAMESITE,
  // 400 hari (standar RFC 6265bis)
  maxAge: 400 * 24 * 60 * 60,
};

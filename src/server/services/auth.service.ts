import { createClient } from '@/server/supabase/server';
import * as userRepo from '@/server/repositories/user.repository';
import { UserProfile } from '@/types/auth';
import type { User } from '@supabase/supabase-js';

export async function loginWithIdentifier(
  identifier: string,
  password: string
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const supabase = await createClient();

  let emailToUse = identifier.trim();

  // If not an email, find email by username
  if (!emailToUse.includes('@')) {
    const foundEmail = await userRepo.findEmailByUsername(emailToUse);
    if (!foundEmail) {
      return { success: false, error: 'Username atau password tidak sesuai.' };
    }
    emailToUse = foundEmail;
  }

  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (authError || !authData.user) {
    return { success: false, error: 'Email/username atau password tidak sesuai.' };
  }

  // Fetch profile
  const profile = await userRepo.getUserProfile(authData.user.id);

  if (!profile) {
    await supabase.auth.signOut();
    return { success: false, error: 'Akun belum terdaftar sebagai pengguna KESIT Management.' };
  }

  if (profile.status_akun !== 'Aktif') {
    await supabase.auth.signOut();
    return { success: false, error: 'Akun sedang tidak aktif. Hubungi Owner/Admin KESIT.' };
  }

  if (!profile.aktivasi_selesai) {
    await supabase.auth.signOut();
    return { success: false, error: 'Aktivasi akun belum selesai.' };
  }

  return { success: true, profile };
}

export async function getCurrentUser(): Promise<{
  user: User | null;
  profile: UserProfile | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await userRepo.getUserProfile(user.id);
  return { user, profile };
}

export async function logoutUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

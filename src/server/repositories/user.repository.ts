import { createClient } from '@/server/supabase/server';
import { UserProfile } from '@/types/auth';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, nama_tampilan, role, status_akun, pelatih_id, aktivasi_selesai')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile | null;
}

export async function findEmailByUsername(username: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('kesit_email_dari_username', {
    p_username: username,
  });

  if (error) {
    console.error('Error finding email by username:', error);
    return null;
  }

  return (data as string) || null;
}

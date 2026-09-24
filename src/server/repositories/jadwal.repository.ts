import { createClient } from '@/server/supabase/server';
import { JadwalPelatih, JadwalPelatihView } from '@/types/database';
import { JadwalPelatihInput } from '@/server/validators/jadwal.schema';

export async function getAllJadwal(): Promise<JadwalPelatihView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('v_jadwal_pelatih')
    .select('*')
    .order('hari')
    .order('jam_mulai');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getJadwalByPelatih(pelatihId: string): Promise<JadwalPelatihView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('v_jadwal_pelatih')
    .select('*')
    .eq('pelatih_id', pelatihId)
    .order('hari')
    .order('jam_mulai');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createJadwal(input: JadwalPelatihInput): Promise<JadwalPelatih> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jadwal_pelatih')
    .insert([input])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateJadwal(id: string, input: Partial<JadwalPelatihInput>): Promise<JadwalPelatih> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jadwal_pelatih')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteJadwal(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('jadwal_pelatih')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

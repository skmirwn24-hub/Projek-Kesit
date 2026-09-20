import { createClient } from '@/server/supabase/server';
import { Pelatih } from '@/types/database';
import { PelatihInput } from '@/server/validators/pelatih.schema';

export async function getAllPelatih(): Promise<Pelatih[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pelatih')
    .select('*')
    .order('nama', { ascending: true });

  if (error) {
    console.error('Error fetching pelatih:', error);
    throw new Error(error.message);
  }

  return (data || []) as Pelatih[];
}

export async function getPelatihById(id: string): Promise<Pelatih | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pelatih')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching pelatih by id:', error);
    return null;
  }

  return data as Pelatih | null;
}

export async function createPelatih(input: PelatihInput): Promise<Pelatih> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pelatih')
    .insert([
      {
        nama: input.nama,
        no_hp: input.no_hp || null,
        email: input.email || null,
        alamat: input.alamat || null,
        tanggal_lahir: input.tanggal_lahir || null,
        pendidikan: input.pendidikan || null,
        sertifikat: input.sertifikat || null,
        status: input.status,
        tanggal_mulai_training: input.tanggal_mulai_training || null,
        tanggal_berakhir_training: input.tanggal_berakhir_training || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating pelatih:', error);
    throw new Error(error.message);
  }

  return data as Pelatih;
}

export async function updatePelatih(id: string, input: PelatihInput): Promise<Pelatih> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pelatih')
    .update({
      nama: input.nama,
      no_hp: input.no_hp || null,
      email: input.email || null,
      alamat: input.alamat || null,
      tanggal_lahir: input.tanggal_lahir || null,
      pendidikan: input.pendidikan || null,
      sertifikat: input.sertifikat || null,
      status: input.status,
      tanggal_mulai_training: input.tanggal_mulai_training || null,
      tanggal_berakhir_training: input.tanggal_berakhir_training || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating pelatih:', error);
    throw new Error(error.message);
  }

  return data as Pelatih;
}

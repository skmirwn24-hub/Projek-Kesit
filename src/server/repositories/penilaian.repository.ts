import { createClient } from '@/server/supabase/server';
import { PenilaianPelatihView } from '@/types/database';
import { PenilaianInput } from '@/server/validators/penilaian.schema';

export async function getAllPenilaian(): Promise<PenilaianPelatihView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('v_penilaian_pelatih')
    .select('*')
    .order('tanggal_penilaian', { ascending: false });

  if (error) {
    console.error('Error fetching v_penilaian_pelatih:', error);
    throw new Error(error.message);
  }

  return (data || []) as PenilaianPelatihView[];
}

export async function createPenilaian(
  data: PenilaianInput
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('penilaian_pelatih').insert([
    {
      pelatih_id: data.pelatih_id,
      tanggal_penilaian: data.tanggal_penilaian,
      kedisiplinan: data.kedisiplinan,
      kehadiran: data.kehadiran,
      kualitas_mengajar: data.kualitas_mengajar,
      komunikasi: data.komunikasi,
      administrasi_laporan: data.administrasi_laporan,
      catatan: data.catatan || null,
      dinilai_oleh: data.dinilai_oleh || null,
      diinput_oleh: data.diinput_oleh || null,
      kategori_pelanggaran: data.kategori_pelanggaran || 'Tidak Ada',
      detail_pelanggaran: data.detail_pelanggaran || null,
      jenis_sanksi: data.jenis_sanksi || 'Tidak Ada',
      tanggal_mulai_sanksi: data.tanggal_mulai_sanksi || null,
      persentase_denda: data.persentase_denda || 0,
      nominal_denda: data.nominal_denda || 0,
      sesi_tanpa_honor: data.sesi_tanpa_honor || 0,
      catatan_sanksi: data.catatan_sanksi || null,
      diputuskan_oleh: data.diputuskan_oleh || null,
    },
  ]);

  if (error) {
    console.error('Error inserting penilaian:', error);
    throw new Error(error.message);
  }
}

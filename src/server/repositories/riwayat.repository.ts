import { createClient } from '@/server/supabase/server';
import { RiwayatPerubahanSiswa } from '@/types/database';

export async function getRiwayatPerubahanSiswa(): Promise<RiwayatPerubahanSiswa[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('riwayat_perubahan_siswa')
    .select(`
      id,
      siswa_id,
      jenis_perubahan,
      lokasi_lama,
      kelas_lama,
      paket_lama,
      pelatih_pemilik_lama,
      lokasi_baru,
      kelas_baru,
      paket_baru,
      pelatih_pemilik_baru,
      tanggal_perubahan,
      alasan,
      diubah_oleh,
      created_at,
      siswa:siswa_id (
        id_siswa,
        nama_lengkap
      ),
      pelatih_lama:pelatih_pemilik_lama (
        nama
      ),
      pelatih_baru:pelatih_pemilik_baru (
        nama
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching riwayat_perubahan_siswa:', error);
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    siswa_id: row.siswa_id,
    jenis_perubahan: row.jenis_perubahan,
    lokasi_lama: row.lokasi_lama,
    kelas_lama: row.kelas_lama,
    paket_lama: row.paket_lama,
    pelatih_pemilik_lama: row.pelatih_pemilik_lama,
    lokasi_baru: row.lokasi_baru,
    kelas_baru: row.kelas_baru,
    paket_baru: row.paket_baru,
    pelatih_pemilik_baru: row.pelatih_pemilik_baru,
    tanggal_perubahan: row.tanggal_perubahan,
    alasan: row.alasan,
    diubah_oleh: row.diubah_oleh,
    created_at: row.created_at,
    nama_siswa: row.siswa?.nama_lengkap,
    id_siswa: row.siswa?.id_siswa,
    nama_pelatih_lama: row.pelatih_lama?.nama,
    nama_pelatih_baru: row.pelatih_baru?.nama,
  }));
}

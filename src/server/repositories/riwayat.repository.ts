import { createClient } from '@/server/supabase/server';
import { RiwayatPerubahanSiswa } from '@/types/database';

interface RiwayatJoinRow {
  id: string;
  siswa_id: string;
  jenis_perubahan: string;
  lokasi_lama: string | null;
  kelas_lama: string | null;
  paket_lama: string | null;
  pelatih_pemilik_lama: string | null;
  lokasi_baru: string | null;
  kelas_baru: string | null;
  paket_baru: string | null;
  pelatih_pemilik_baru: string | null;
  tanggal_perubahan: string | null;
  alasan: string | null;
  diubah_oleh: string | null;
  created_at: string;
  siswa: {
    id_siswa: string;
    nama_lengkap: string;
  } | null;
  pelatih_lama: {
    nama: string;
  } | null;
  pelatih_baru: {
    nama: string;
  } | null;
}

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

  const rows = (data || []) as unknown as RiwayatJoinRow[];

  return rows.map((row) => ({
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

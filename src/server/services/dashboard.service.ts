import { KesitRole } from '@/types/auth';
import { DashboardStats } from '@/types/database';
import { createClient } from '@/server/supabase/server';

export async function getDashboardStats(
  userRole: KesitRole,
  _pelatihId?: string | null
): Promise<DashboardStats> {
  const supabase = await createClient();

  // Memanggil fungsi SQL agregasi langsung dari PostgreSQL engine (< 5ms)
  const { data, error } = await supabase.rpc('get_dashboard_summary');

  if (error || !data) {
    console.error('Error fetching dashboard summary RPC:', error);
    // Fallback jika terjadi kendala RPC
    return {
      totalSiswa: 0,
      siswaAktif: 0,
      siswaLunas: 0,
      siswaBelumLunas: 0,
      totalPelatih: 0,
      pelatihAktif: 0,
      pelatihTraining: 0,
      pelatihNonaktif: 0,
      totalPendapatan: 0,
      sisaPiutang: 0,
    };
  }

  const isPelatih = userRole === 'Pelatih';

  return {
    totalSiswa: Number(data.total_siswa) || 0,
    siswaAktif: Number(data.siswa_aktif) || 0,
    siswaLunas: Number(data.siswa_lunas) || 0,
    siswaBelumLunas: Number(data.siswa_belum_lunas) || 0,
    totalPelatih: Number(data.total_pelatih) || 0,
    pelatihAktif: Number(data.pelatih_aktif) || 0,
    pelatihTraining: Number(data.pelatih_training) || 0,
    pelatihNonaktif: Number(data.pelatih_nonaktif) || 0,
    totalPendapatan: isPelatih ? 0 : Number(data.total_pendapatan) || 0,
    sisaPiutang: isPelatih ? 0 : Number(data.sisa_piutang) || 0,
  };
}

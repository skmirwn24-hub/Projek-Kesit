import { KesitRole } from '@/types/auth';
import { DashboardStats } from '@/types/database';
import * as siswaRepo from '@/server/repositories/siswa.repository';
import * as pelatihRepo from '@/server/repositories/pelatih.repository';

export async function getDashboardStats(
  userRole: KesitRole,
  pelatihId?: string | null
): Promise<DashboardStats> {
  const [siswaList, pelatihList] = await Promise.all([
    siswaRepo.getRekapanSiswa(userRole, pelatihId),
    pelatihRepo.getAllPelatih(),
  ]);

  const totalSiswa = siswaList.length;
  const siswaAktif = siswaList.filter((s) => s.status_siswa === 'Aktif').length;
  const siswaLunas = siswaList.filter((s) => s.status_pembayaran === 'Lunas').length;
  const siswaBelumLunas = siswaList.filter((s) => s.status_pembayaran === 'Belum Lunas').length;

  const totalPelatih = pelatihList.length;
  const pelatihAktif = pelatihList.filter((p) => p.status === 'Aktif').length;
  const pelatihTraining = pelatihList.filter((p) => p.status === 'Training').length;
  const pelatihNonaktif = pelatihList.filter((p) => p.status === 'Nonaktif').length;

  // Pelatih does not have access to financial totals
  let totalPendapatan = 0;
  let sisaPiutang = 0;

  if (userRole !== 'Pelatih') {
    totalPendapatan = siswaList.reduce((sum, s) => sum + (Number(s.nominal_dibayar) || 0), 0);
    sisaPiutang = siswaList.reduce((sum, s) => sum + (Number(s.sisa_tagihan) || 0), 0);
  }

  return {
    totalSiswa,
    siswaAktif,
    siswaLunas,
    siswaBelumLunas,
    totalPelatih,
    pelatihAktif,
    pelatihTraining,
    pelatihNonaktif,
    totalPendapatan,
    sisaPiutang,
  };
}

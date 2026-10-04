import { KesitRole } from '@/types/auth';
import {
  VLaporanSiswa,
  LaporanDetailData,
  LaporanStats,
  StatusDokumenRapor,
} from '@/types/laporan';
import * as laporanRepo from '@/server/repositories/laporan.repository';
import { SimpanLaporanInput } from '@/server/validators/laporan.schema';

export async function fetchLaporanList(
  role: KesitRole,
  filters: laporanRepo.LaporanFilterOptions = {}
): Promise<{ list: VLaporanSiswa[]; stats: LaporanStats }> {
  const list = await laporanRepo.getLaporanList(role, filters);

  const totalRapor = list.length;
  const totalNaikLevel = list.filter(
    (l) => l.status_kenaikan === 'Naik Level' || l.status_kenaikan === 'Lulus Tingkat'
  ).length;
  const totalDraft = list.filter((l) => l.status_dokumen === 'Draft').length;

  const sumNilai = list.reduce((acc, curr) => acc + (Number(curr.nilai_rata_rata) || 0), 0);
  const rataRataNilai = totalRapor > 0 ? Number((sumNilai / totalRapor).toFixed(2)) : 0;

  return {
    list,
    stats: {
      totalRapor,
      totalNaikLevel,
      rataRataNilai,
      totalDraft,
    },
  };
}

export async function fetchLaporanDetail(laporanId: string): Promise<LaporanDetailData | null> {
  return laporanRepo.getLaporanDetail(laporanId);
}

export async function saveLaporan(
  input: SimpanLaporanInput
): Promise<{
  success: boolean;
  laporan_id: string;
  nomor_rapor: string;
  nilai_rata_rata: number;
  sertifikat_id?: string;
  nomor_sertifikat?: string;
}> {
  return laporanRepo.simpanLaporanRpc(input);
}

export async function changeStatusDokumen(
  laporanId: string,
  status: StatusDokumenRapor
): Promise<void> {
  return laporanRepo.updateStatusDokumen(laporanId, status);
}

export async function removeLaporan(laporanId: string): Promise<void> {
  return laporanRepo.hapusLaporanRpc(laporanId);
}

export async function fetchDropdownData(role: KesitRole) {
  const [siswaOptions, pelatihOptions] = await Promise.all([
    laporanRepo.getSiswaOptionsForLaporan(role),
    laporanRepo.getPelatihOptions(),
  ]);

  return {
    siswaOptions,
    pelatihOptions,
  };
}

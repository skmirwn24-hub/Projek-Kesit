import { KesitRole } from '@/types/auth';
import { KategoriKelas, AbsensiSiswaView } from '@/types/database';
import { hasPermission } from '@/server/constants/roles';
import * as absensiRepo from '@/server/repositories/absensi.repository';
import { AbsensiSiswaInput } from '@/server/validators/absensi.schema';

const HARI_LIBUR_PRESTASI = 1; // 0=Minggu, 1=Senin, ..., 6=Sabtu

// --------------------------------------------------------
// getSiswaUntukAbsensi
// Ambil daftar siswa (dengan status absensi) untuk pelatih & kategori
// --------------------------------------------------------
export async function getSiswaUntukAbsensi(
  pelatihPemilikId: string,
  kategori: KategoriKelas,
  bulan: number,
  tahun: number,
  nomorSesi?: number | null,
  tanggal?: string | null,
  userRole?: KesitRole
): Promise<{
  success: boolean;
  data?: absensiRepo.SiswaAbsensiEnriched[];
  error?: string;
}> {
  try {
    // Validasi: Prestasi tidak bisa di hari Senin
    if (kategori === 'Prestasi') {
      const targetDate = tanggal ? new Date(tanggal) : new Date();
      const dayOfWeek = targetDate.getDay(); // 0=Sun, 1=Mon
      if (dayOfWeek === HARI_LIBUR_PRESTASI) {
        return {
          success: false,
          error: 'Kelas Prestasi libur setiap hari Senin. Tidak bisa melakukan absensi.',
        };
      }
    }

    const data = await absensiRepo.getSiswaUntukAbsensi(
      pelatihPemilikId,
      kategori,
      bulan,
      tahun,
      nomorSesi,
      tanggal
    );

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat daftar siswa.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// absenSiswa
// Input/update absensi satu siswa
// --------------------------------------------------------
export async function absenSiswa(
  input: AbsensiSiswaInput,
  dicatatOleh: string,
  userRole: KesitRole
): Promise<{ success: boolean; absensiId?: string; error?: string }> {
  if (!hasPermission(userRole, 'absensi:write')) {
    return { success: false, error: 'Akses ditolak: tidak memiliki izin absensi.' };
  }

  // Validasi Prestasi tidak boleh di hari Senin
  if (input.kategori === 'Prestasi') {
    const tgl = new Date(input.tanggal);
    if (tgl.getDay() === HARI_LIBUR_PRESTASI) {
      return {
        success: false,
        error: 'Kelas Prestasi libur hari Senin. Absensi tidak dapat disimpan.',
      };
    }
  }

  // Validasi nomor sesi untuk Reguler & Private
  if (input.kategori === 'Reguler' && input.nomor_sesi != null) {
    if (input.nomor_sesi < 1 || input.nomor_sesi > 6) {
      return { success: false, error: 'Nomor sesi Reguler harus antara 1–6.' };
    }
  }
  if (input.kategori === 'Private' && input.nomor_sesi != null) {
    if (input.nomor_sesi < 1 || input.nomor_sesi > 10) {
      return { success: false, error: 'Nomor sesi Private harus antara 1–10.' };
    }
  }

  try {
    const absensiId = await absensiRepo.absenSiswa(input, dicatatOleh);
    return { success: true, absensiId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyimpan absensi.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// batalkanAbsen
// Hapus record absensi dan kembalikan kuota
// --------------------------------------------------------
export async function batalkanAbsen(
  absensiId: string,
  userRole: KesitRole
): Promise<{ success: boolean; error?: string }> {
  if (!hasPermission(userRole, 'absensi:write')) {
    return { success: false, error: 'Akses ditolak: tidak memiliki izin absensi.' };
  }

  try {
    await absensiRepo.batalkanAbsen(absensiId);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membatalkan absensi.';
    return { success: false, error: message };
  }
}

// --------------------------------------------------------
// getRekapAbsensi
// Ambil rekap absensi bulanan (untuk tampilan rekap & export)
// --------------------------------------------------------
export async function getRekapAbsensi(
  userRole: KesitRole,
  pelatihPemilikId: string,
  bulan: number,
  tahun: number,
  kategori?: KategoriKelas | null,
  isAdminView?: boolean,
  filterPelatihId?: string | null
): Promise<{ success: boolean; data?: AbsensiSiswaView[]; error?: string }> {
  if (!hasPermission(userRole, 'absensi:read')) {
    return { success: false, error: 'Akses ditolak: tidak memiliki izin membaca absensi.' };
  }

  try {
    let data: AbsensiSiswaView[];
    if (isAdminView && (userRole === 'Owner' || userRole === 'Admin')) {
      data = await absensiRepo.getSemuaAbsensiByBulan(
        bulan,
        tahun,
        filterPelatihId,
        kategori ?? null
      );
    } else {
      data = await absensiRepo.getAbsensiByBulan(
        pelatihPemilikId,
        kategori ?? 'Reguler',
        bulan,
        tahun
      );
    }
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat rekap absensi.';
    return { success: false, error: message };
  }
}

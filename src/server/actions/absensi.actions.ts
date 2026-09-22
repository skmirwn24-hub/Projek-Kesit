'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import * as absensiService from '@/server/services/absensi.service';
import {
  absensiSiswaSchema,
  batalkanAbsensiSchema,
  AbsensiSiswaInput,
} from '@/server/validators/absensi.schema';
import { KategoriKelas, AbsensiSiswaView } from '@/types/database';
import type { SiswaAbsensiEnriched } from '@/server/repositories/absensi.repository';

// --------------------------------------------------------
// getSiswaUntukAbsensiAction
// Ambil daftar siswa dengan status absensi untuk sesi tertentu
// --------------------------------------------------------
export async function getSiswaUntukAbsensiAction(params: {
  pelatihPemilikId?: string | null;
  kategori: KategoriKelas;
  bulan: number;
  tahun: number;
  nomorSesi?: number | null;   // untuk Reguler & Private
  tanggal?: string | null;     // untuk Prestasi (ISO date), default = today
}): Promise<{
  success: boolean;
  data?: SiswaAbsensiEnriched[];
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  return absensiService.getSiswaUntukAbsensi(
    params.pelatihPemilikId,
    params.kategori,
    params.bulan,
    params.tahun,
    params.nomorSesi,
    params.tanggal,
    profile.role
  );
}

// --------------------------------------------------------
// absenSiswaAction
// Simpan atau update absensi satu siswa
// --------------------------------------------------------
export async function absenSiswaAction(
  rawInput: AbsensiSiswaInput
): Promise<{ success: boolean; absensiId?: string; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = absensiSiswaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data absensi tidak valid.',
    };
  }

  return absensiService.absenSiswa(parsed.data, profile.id, profile.role);
}

// --------------------------------------------------------
// batalkanAbsenAction
// Hapus record absensi (dan kembalikan kuota)
// --------------------------------------------------------
export async function batalkanAbsenAction(
  rawInput: { absensi_id: string }
): Promise<{ success: boolean; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = batalkanAbsensiSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'ID absensi tidak valid.',
    };
  }

  return absensiService.batalkanAbsen(parsed.data.absensi_id, profile.role);
}

// --------------------------------------------------------
// getRekapAbsensiAction
// Rekap absensi bulanan (untuk tampilan rekap & export CSV)
// --------------------------------------------------------
export async function getRekapAbsensiAction(params: {
  bulan: number;
  tahun: number;
  kategori?: KategoriKelas | null;
  filterPelatihId?: string | null; // hanya berlaku untuk Owner/Admin
}): Promise<{ success: boolean; data?: AbsensiSiswaView[]; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const isAdminView = profile.role === 'Owner' || profile.role === 'Admin';
  const pelatihPemilikId = profile.pelatih_id || params.filterPelatihId || '';

  return absensiService.getRekapAbsensi(
    profile.role,
    pelatihPemilikId,
    params.bulan,
    params.tahun,
    params.kategori,
    isAdminView,
    params.filterPelatihId
  );
}

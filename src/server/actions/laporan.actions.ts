'use server';

import { getCurrentUser } from '@/server/services/auth.service';
import * as laporanService from '@/server/services/laporan.service';
import { LaporanFilterOptions } from '@/server/repositories/laporan.repository';
import {
  simpanLaporanSchema,
  SimpanLaporanInput,
} from '@/server/validators/laporan.schema';
import {
  VLaporanSiswa,
  LaporanStats,
  LaporanDetailData,
  StatusDokumenRapor,
} from '@/types/laporan';
import { revalidatePath } from 'next/cache';

export async function getLaporanListAction(
  filters: LaporanFilterOptions = {}
): Promise<{
  success: boolean;
  data?: { list: VLaporanSiswa[]; stats: LaporanStats };
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await laporanService.fetchLaporanList(profile.role, filters);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat daftar rapor siswa.';
    return { success: false, error: message };
  }
}

export async function getLaporanDetailAction(
  laporanId: string
): Promise<{
  success: boolean;
  data?: LaporanDetailData;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await laporanService.fetchLaporanDetail(laporanId);
    if (!data) {
      return { success: false, error: 'Data rapor tidak ditemukan.' };
    }
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat detail rapor.';
    return { success: false, error: message };
  }
}

export async function submitLaporanAction(
  rawInput: SimpanLaporanInput
): Promise<{
  success: boolean;
  laporan_id?: string;
  nomor_rapor?: string;
  nilai_rata_rata?: number;
  sertifikat_id?: string;
  nomor_sertifikat?: string;
  error?: string;
}> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  const parsed = simpanLaporanSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Input form penilaian tidak valid.',
    };
  }

  try {
    const result = await laporanService.saveLaporan(parsed.data);
    revalidatePath('/laporan-siswa');
    return { ...result, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyimpan laporan siswa.';
    return { success: false, error: message };
  }
}

export async function updateStatusLaporanAction(
  laporanId: string,
  status: StatusDokumenRapor
): Promise<{ success: boolean; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    await laporanService.changeStatusDokumen(laporanId, status);
    revalidatePath('/laporan-siswa');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memperbarui status rapor.';
    return { success: false, error: message };
  }
}

export async function deleteLaporanAction(
  laporanId: string
): Promise<{ success: boolean; error?: string }> {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    await laporanService.removeLaporan(laporanId);
    revalidatePath('/laporan-siswa');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghapus rapor siswa.';
    return { success: false, error: message };
  }
}

export async function getDropdownDataAction() {
  const { profile } = await getCurrentUser();
  if (!profile) {
    return { success: false, error: 'Sesi tidak valid, silakan login kembali.' };
  }

  try {
    const data = await laporanService.fetchDropdownData(profile.role);
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuat data pilihan.';
    return { success: false, error: message };
  }
}
